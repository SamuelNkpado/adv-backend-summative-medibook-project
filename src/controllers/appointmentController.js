const appointmentModel = require('../models/appointmentModel');
const { HttpError } = require('../errors');
const { parseId } = require('../validation');
const { parseSlot, validateSlotTime } = require('../bookingRules');
const { logEvent } = require('../audit');

const MAX_AMOUNT = 99999999.99;

function parseAmount(raw) {
  const amount = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new HttpError(400, 'amount_paid must be a number');
  }
  if (amount < 0) {
    throw new HttpError(400, 'amount_paid cannot be negative');
  }
  if (amount > MAX_AMOUNT) {
    throw new HttpError(400, 'amount_paid is too large');
  }
  return Math.round(amount * 100) / 100;
}

async function createAppointment(req, res) {
  const body = req.body || {};
  const patientId = parseId(body.patient_id);
  const doctorId = parseId(body.doctor_id);
  const slot = validateSlotTime(parseSlot(body.appt_datetime));
  const amountPaid = parseAmount(body.amount_paid);

  const appointmentId = await appointmentModel.createBooking({
    patientId,
    doctorId,
    slot,
    amountPaid,
  });
  const appointment = await appointmentModel.findById(appointmentId);

  await logEvent('booking_created', {
    appointment_id: appointment.appointment_id,
    appt_ref: appointment.appt_ref,
    patient_id: patientId,
    doctor_id: doctorId,
    amount_paid: amountPaid,
  });

  res.status(201).json(appointment);
}

async function getAppointment(req, res) {
  const id = parseId(req.params.id);
  const appointment = await appointmentModel.findById(id);
  if (!appointment) {
    throw new HttpError(404, `Appointment ${id} not found`);
  }
  res.json(appointment);
}

async function cancelAppointment(req, res) {
  const id = parseId(req.params.id);
  const { refund } = await appointmentModel.cancelBooking(id);
  const appointment = await appointmentModel.findById(id);

  await logEvent('booking_cancelled', {
    appointment_id: id,
    appt_ref: appointment.appt_ref,
    refund_amount: refund,
  });

  res.json({ ...appointment, refund_amount: refund });
}

module.exports = { createAppointment, getAppointment, cancelAppointment };