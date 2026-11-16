const { HttpError } = require('./errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'ID must be a positive integer');
  }
  return id;
}

function validatePatient(body) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

  if (!name) errors.push('name is required');
  else if (name.length > 100) errors.push('name must be 100 characters or fewer');

  if (!email) errors.push('email is required');
  else if (email.length > 255 || !EMAIL_PATTERN.test(email)) errors.push('email must be a valid email address');

  if (!phone) errors.push('phone is required');
  else if (!PHONE_PATTERN.test(phone)) errors.push('phone must contain 7 to 20 digits, spaces, dashes, or +');

  if (errors.length > 0) {
    throw new HttpError(400, errors.join('; '));
  }
  return { name, email, phone };
}

module.exports = { parseId, validatePatient };