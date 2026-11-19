const queue = require('../queue');
const doctorModel = require('../models/doctorModel');
const patientModel = require('../models/patientModel');
const { HttpError } = require('../errors');
const { parseId } = require('../validation');
const { parseDay } = require('../dates');

async function joinWaitlist(req, res) {
  const body = req.body || {};
  const patientId = parseId(body.patient_id);
  const doctorId = parseId(body.doctor_id);
  const day = parseDay(body.day);

  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) {
    throw new HttpError(404, `Doctor ${doctorId} not found`);
  }
  const patient = await patientModel.findById(patientId);
  if (!patient) {
    throw new HttpError(404, `Patient ${patientId} not found`);
  }

  if (await queue.isOnWaitlist(doctorId, day, patientId)) {
    throw new HttpError(409, 'Patient is already on the waitlist for this day');
  }

  const position = await queue.joinWaitlist(doctorId, day, patientId);
  res.status(201).json({ doctor_id: doctorId, patient_id: patientId, day, position });
}

module.exports = { joinWaitlist };