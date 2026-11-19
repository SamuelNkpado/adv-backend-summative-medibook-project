const { HttpError } = require('./errors');

const pad = (n) => String(n).padStart(2, '0');

function formatDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatSlot(date) {
  return `${formatDay(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Accepts YYYY-MM-DD, rejects impossible dates, and rejects past days.
// Returns the day as a string, which is the form used in Redis keys.
function parseDay(raw, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof raw === 'string' ? raw : '');
  if (!match) {
    throw new HttpError(400, 'day must look like 2026-12-01');
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const rolledOver =
    date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day;
  if (rolledOver) {
    throw new HttpError(400, 'day is not a valid date');
  }

  const normalized = `${match[1]}-${match[2]}-${match[3]}`;
  if (normalized < formatDay(now)) {
    throw new HttpError(422, 'day must be today or later');
  }
  return normalized;
}

module.exports = { formatDay, formatSlot, parseDay };