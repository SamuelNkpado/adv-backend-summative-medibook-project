const doctorModel = require('../models/doctorModel');
const { HttpError } = require('../errors');
const { parseId, validateDoctor } = require('../validation');

async function listDoctors(req, res) {
  const doctors = await doctorModel.findAll();
  res.json(doctors);
}

async function getDoctor(req, res) {
  const id = parseId(req.params.id);
  const doctor = await doctorModel.findById(id);
  if (!doctor) {
    throw new HttpError(404, `Doctor ${id} not found`);
  }
  res.json(doctor);
}

async function createDoctor(req, res) {
  const data = validateDoctor(req.body);
  const doctor = await doctorModel.create(data);
  res.status(201).json(doctor);
}

async function updateDoctor(req, res) {
  const id = parseId(req.params.id);
  const data = validateDoctor(req.body);

  const existing = await doctorModel.findById(id);
  if (!existing) {
    throw new HttpError(404, `Doctor ${id} not found`);
  }

  const doctor = await doctorModel.update(id, data);
  res.json(doctor);
}

async function deleteDoctor(req, res) {
  const id = parseId(req.params.id);
  try {
    const deleted = await doctorModel.remove(id);
    if (!deleted) {
      throw new HttpError(404, `Doctor ${id} not found`);
    }
    res.status(204).end();
  } catch (err) {
    if (err.blockedByAppointments) {
      throw new HttpError(409, 'Doctor has appointments and cannot be deleted');
    }
    throw err;
  }
}

module.exports = { listDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor };