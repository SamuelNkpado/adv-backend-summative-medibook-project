const reportModel = require('../models/reportModel');
const doctorModel = require('../models/doctorModel');
const { HttpError } = require('../errors');
const { parseId } = require('../validation');
const { DAILY_CAP } = require('../bookingRules');

const BUSY_DAY_PERCENT = 80;

async function getDoctorStats(req, res) {
  const id = parseId(req.params.id);
  const doctor = await doctorModel.findById(id);
  if (!doctor) {
    throw new HttpError(404, `Doctor ${id} not found`);
  }
  const stats = await reportModel.doctorStats(id, DAILY_CAP);
  res.json({ doctor_id: id, doctor_name: doctor.doctor_name, ...stats });
}

async function getDoctorsReport(req, res) {
  res.json(await reportModel.doctorsReport());
}

async function getBusyDays(req, res) {
  res.json(await reportModel.busyDaysReport(DAILY_CAP, BUSY_DAY_PERCENT));
}

module.exports = { getDoctorStats, getDoctorsReport, getBusyDays };