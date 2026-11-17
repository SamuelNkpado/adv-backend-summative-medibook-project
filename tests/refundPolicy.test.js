const { calculateRefund, refundPercent } = require('../src/refundPolicy');

const APPOINTMENT = new Date('2026-12-10T10:00:00');

function hoursBefore(hours) {
  return new Date(APPOINTMENT.getTime() - hours * 60 * 60 * 1000);
}

describe('refundPercent', () => {
  test('gives 100% when more than 48 hours notice', () => {
    expect(refundPercent(APPOINTMENT, hoursBefore(72))).toBe(1.0);
  });

  test('gives 100% at 48 hours plus one minute', () => {
    const cancelled = new Date(APPOINTMENT.getTime() - (48 * 60 + 1) * 60 * 1000);
    expect(refundPercent(APPOINTMENT, cancelled)).toBe(1.0);
  });

  test('gives 50% at exactly 48 hours', () => {
    expect(refundPercent(APPOINTMENT, hoursBefore(48))).toBe(0.5);
  });

  test('gives 50% at 30 hours', () => {
    expect(refundPercent(APPOINTMENT, hoursBefore(30))).toBe(0.5);
  });

  test('gives 50% at exactly 24 hours', () => {
    expect(refundPercent(APPOINTMENT, hoursBefore(24))).toBe(0.5);
  });

  test('gives 0% at 23 hours and 59 minutes', () => {
    const cancelled = new Date(APPOINTMENT.getTime() - (23 * 60 + 59) * 60 * 1000);
    expect(refundPercent(APPOINTMENT, cancelled)).toBe(0);
  });

  test('gives 0% at 1 hour', () => {
    expect(refundPercent(APPOINTMENT, hoursBefore(1))).toBe(0);
  });
});

describe('calculateRefund', () => {
  test('refunds the full amount with more than 48 hours notice', () => {
    expect(calculateRefund(150, APPOINTMENT, hoursBefore(72))).toBe(150);
  });

  test('refunds half at exactly 24 hours notice', () => {
    expect(calculateRefund(150, APPOINTMENT, hoursBefore(24))).toBe(75);
  });

  test('refunds nothing under 24 hours notice', () => {
    expect(calculateRefund(150, APPOINTMENT, hoursBefore(2))).toBe(0);
  });

  test('rounds to two decimal places', () => {
    expect(calculateRefund(120.05, APPOINTMENT, hoursBefore(30))).toBe(60.03);
  });

  test('refuses a cancellation after the appointment has started', () => {
    const afterStart = new Date(APPOINTMENT.getTime() + 60 * 60 * 1000);
    expect(() => calculateRefund(150, APPOINTMENT, afterStart)).toThrow(/already started/);
  });
});