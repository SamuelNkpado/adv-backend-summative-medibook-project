const patientModel = require('../models/patientModel');
const { HttpError } = require('../errors');
const { parseId, validatePatient } = require('../validation');

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';

async function listPatients(req, res) {
  const patients = await patientModel.findAll();
  res.json(patients);
}

async function getPatient(req, res) {
  const id = parseId(req.params.id);
  const patient = await patientModel.findById(id);
  if (!patient) {
    throw new HttpError(404, `Patient ${id} not found`);
  }
  res.json(patient);
}

async function createPatient(req, res) {
  const data = validatePatient(req.body);
  try {
    const patient = await patientModel.create(data);
    res.status(201).json(patient);
  } catch (err) {
    if (err.code === DUPLICATE_ENTRY) {
      throw new HttpError(409, 'A patient with this email already exists');
    }
    throw err;
  }
}

async function updatePatient(req, res) {
  const id = parseId(req.params.id);
  const data = validatePatient(req.body);

  const existing = await patientModel.findById(id);
  if (!existing) {
    throw new HttpError(404, `Patient ${id} not found`);
  }

  try {
    const patient = await patientModel.update(id, data);
    res.json(patient);
  } catch (err) {
    if (err.code === DUPLICATE_ENTRY) {
      throw new HttpError(409, 'A patient with this email already exists');
    }
    throw err;
  }
}

async function deletePatient(req, res) {
  const id = parseId(req.params.id);
  try {
    const deleted = await patientModel.remove(id);
    if (!deleted) {
      throw new HttpError(404, `Patient ${id} not found`);
    }
    res.status(204).end();
  } catch (err) {
    if (err.blockedByAppointments) {
      throw new HttpError(409, 'Patient has appointments and cannot be deleted');
    }
    throw err;
  }
}

module.exports = { listPatients, getPatient, createPatient, updatePatient, deletePatient };