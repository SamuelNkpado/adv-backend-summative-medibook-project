const crypto = require('crypto');
const { pool, query } = require('./db');
const { HttpError } = require('../errors');
const { assertBelowDailyCap } = require('../bookingRules');
const { calculateRefund } = require('../refundPolicy');

const SLOT_TAKEN_MESSAGE = 'Slot is already booked for this doctor';

const pad = (n) => String(n).padStart(2, '0');

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTime(date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function newApptRef() {
  return `AP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function findById(id) {
  const rows = await query(
    `SELECT appointment_id, appt_ref, patient_id, doctor_id, appt_datetime,
            status, amount_paid, booked_on, cancelled_at, refund_amount
       FROM appointments
      WHERE appointment_id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createBooking({ patientId, doctorId, slot, amountPaid, now = new Date() }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [patients] = await conn.execute(
      'SELECT patient_id FROM patients WHERE patient_id = ?',
      [patientId]
    );
    if (patients.length === 0) {
      throw new HttpError(404, `Patient ${patientId} not found`);
    }

    // Locks the doctor row: other bookings for this doctor wait here
    // until this transaction commits or rolls back.
    const [doctors] = await conn.execute(
      'SELECT doctor_id FROM doctors WHERE doctor_id = ? FOR UPDATE',
      [doctorId]
    );
    if (doctors.length === 0) {
      throw new HttpError(404, `Doctor ${doctorId} not found`);
    }

    const [countRows] = await conn.execute(
      `SELECT COUNT(*) AS booked
         FROM appointments
        WHERE doctor_id = ? AND status = 'booked' AND DATE(appt_datetime) = ?`,
      [doctorId, formatDate(slot)]
    );
    assertBelowDailyCap(countRows[0].booked);

    const [result] = await conn.execute(
      `INSERT INTO appointments
         (appt_ref, patient_id, doctor_id, appt_datetime, status, amount_paid, booked_on)
       VALUES (?, ?, ?, ?, 'booked', ?, ?)`,
      [newApptRef(), patientId, doctorId, formatDateTime(slot), amountPaid, formatDate(now)]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (err.code === 'ER_DUP_ENTRY' && String(err.sqlMessage).includes('uq_doctor_active_slot')) {
      throw new HttpError(409, SLOT_TAKEN_MESSAGE);
    }
    throw err;
  } finally {
    conn.release();
  }
}
async function cancelBooking(id, now = new Date()) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT appointment_id, appt_datetime, status, amount_paid
         FROM appointments
        WHERE appointment_id = ? FOR UPDATE`,
      [id]
    );
    const appt = rows[0];
    if (!appt) {
      throw new HttpError(404, `Appointment ${id} not found`);
    }
    if (appt.status === 'cancelled') {
      throw new HttpError(409, 'Appointment is already cancelled');
    }

    const refund = calculateRefund(
      Number(appt.amount_paid),
      new Date(appt.appt_datetime),
      now
    );

    await conn.execute(
      `UPDATE appointments
          SET status = 'cancelled', cancelled_at = ?, refund_amount = ?
        WHERE appointment_id = ?`,
      [formatDateTime(now), refund, id]
    );

    await conn.commit();
    return { refund };
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { findById, createBooking, cancelBooking };