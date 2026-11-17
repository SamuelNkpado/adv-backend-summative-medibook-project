const { HttpError } = require('./errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const MAX_FEE = 99999999.99;

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'ID must be a positive integer');
  }
  return id;
}

function readString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function throwIfErrors(errors) {
  if (errors.length > 0) {
    throw new HttpError(400, errors.join('; '));
  }
}

function validatePatient(body) {
  const errors = [];
  const name = readString(body.name);
  const email = readString(body.email);
  const phone = readString(body.phone);

  if (!name) errors.push('name is required');
  else if (name.length > 100) errors.push('name must be 100 characters or fewer');

  if (!email) errors.push('email is required');
  else if (email.length > 255 || !EMAIL_PATTERN.test(email)) errors.push('email must be a valid email address');

  if (!phone) errors.push('phone is required');
  else if (!PHONE_PATTERN.test(phone)) errors.push('phone must contain 7 to 20 digits, spaces, dashes, or +');

  throwIfErrors(errors);
  return { name, email, phone };
}

function validateDoctor(body) {
  const errors = [];
  const name = readString(body.name);
  const specialty = readString(body.specialty);
  const room = readString(body.room);
  const fee = typeof body.fee === 'string' && body.fee.trim() !== '' ? Number(body.fee) : body.fee;

  if (!name) errors.push('name is required');
  else if (name.length > 100) errors.push('name must be 100 characters or fewer');

  if (!specialty) errors.push('specialty is required');
  else if (specialty.length > 100) errors.push('specialty must be 100 characters or fewer');

  if (!room) errors.push('room is required');
  else if (room.length > 10) errors.push('room must be 10 characters or fewer');

  if (typeof fee !== 'number' || !Number.isFinite(fee)) {
    errors.push('fee must be a number');
  } else if (fee < 0) {
    errors.push('fee cannot be negative');
  } else if (fee > MAX_FEE) {
    errors.push('fee is too large');
  }

  throwIfErrors(errors);
  return { name, specialty, fee: Math.round(fee * 100) / 100, room };
}

module.exports = { parseId, validatePatient, validateDoctor };