const { HttpError } = require('./errors');

const WORKING_START_MINUTES = 9 * 60;
const WORKING_END_MINUTES = 17 * 60;
const SLOT_MINUTES = 30;
const DAILY_CAP = 12;

function parseSlot(raw) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::00)?$/.exec(raw || '');
  if (!match) {
    throw new HttpError(400, 'appt_datetime must look like 2026-12-01T09:30');
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  const rolledOver =
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day;

  if (rolledOver || Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'appt_datetime is not a valid date');
  }
  return date;
}

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function validateSlotTime(date, now = new Date()) {
  const errors = [];

  if (date <= now) {
    errors.push('appointment must be in the future');
  }
  if (date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
    errors.push('appointment must start on a whole minute');
  }

  const minutes = minutesOfDay(date);
  if (minutes % SLOT_MINUTES !== 0) {
    errors.push('appointment must start on a 30-minute boundary');
  }
  if (minutes < WORKING_START_MINUTES || minutes + SLOT_MINUTES > WORKING_END_MINUTES) {
    errors.push('appointment must start between 09:00 and 16:30');
  }

  if (errors.length > 0) {
    throw new HttpError(422, errors.join('; '));
  }
  return date;
}

function assertBelowDailyCap(bookedCount) {
  if (bookedCount >= DAILY_CAP) {
    throw new HttpError(409, 'Doctor is fully booked for this day');
  }
}

module.exports = {
  parseSlot,
  validateSlotTime,
  assertBelowDailyCap,
  WORKING_START_MINUTES,
  WORKING_END_MINUTES,
  SLOT_MINUTES,
  DAILY_CAP,
};