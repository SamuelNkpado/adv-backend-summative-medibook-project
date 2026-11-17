const { HttpError } = require('./errors');

const HOUR_MS = 60 * 60 * 1000;
const FULL_REFUND_NOTICE_HOURS = 48;
const HALF_REFUND_NOTICE_HOURS = 24;

function refundPercent(appointmentTime, cancelledAt) {
  const noticeMs = appointmentTime.getTime() - cancelledAt.getTime();
  if (noticeMs < 0) {
    throw new HttpError(422, 'Cannot cancel an appointment that has already started');
  }
  const noticeHours = noticeMs / HOUR_MS;

  if (noticeHours > FULL_REFUND_NOTICE_HOURS) return 1.0;
  if (noticeHours >= HALF_REFUND_NOTICE_HOURS) return 0.5;
  return 0;
}

function calculateRefund(amountPaid, appointmentTime, cancelledAt) {
  const percent = refundPercent(appointmentTime, cancelledAt);
  return Math.round(amountPaid * percent * 100) / 100;
}

module.exports = { calculateRefund, refundPercent, FULL_REFUND_NOTICE_HOURS, HALF_REFUND_NOTICE_HOURS };