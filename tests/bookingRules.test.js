const {
  parseSlot,
  validateSlotTime,
  assertBelowDailyCap,
  DAILY_CAP,
} = require('../src/bookingRules');

const NOW = new Date('2026-11-16T08:00:00');

describe('validateSlotTime', () => {
  test('accepts a valid slot in the future', () => {
    const slot = new Date('2026-11-20T10:30:00');
    expect(() => validateSlotTime(slot, NOW)).not.toThrow();
  });

  test('accepts 09:00, the first valid start', () => {
    expect(() => validateSlotTime(new Date('2026-11-20T09:00:00'), NOW)).not.toThrow();
  });

  test('accepts 16:30, the last valid start', () => {
    expect(() => validateSlotTime(new Date('2026-11-20T16:30:00'), NOW)).not.toThrow();
  });

  test('rejects 17:00, which would run past closing', () => {
    expect(() => validateSlotTime(new Date('2026-11-20T17:00:00'), NOW)).toThrow(/09:00 and 16:30/);
  });

  test('rejects 08:30, before opening', () => {
    expect(() => validateSlotTime(new Date('2026-11-20T08:30:00'), NOW)).toThrow(/09:00 and 16:30/);
  });

  test('rejects a start that is not on a 30-minute boundary', () => {
    expect(() => validateSlotTime(new Date('2026-11-20T09:15:00'), NOW)).toThrow(/30-minute boundary/);
  });

  test('rejects a time in the past', () => {
    expect(() => validateSlotTime(new Date('2026-11-10T10:00:00'), NOW)).toThrow(/in the future/);
  });
});

describe('parseSlot', () => {
  test('parses a valid local date-time', () => {
    const slot = parseSlot('2026-12-01T09:30');
    expect(slot.getHours()).toBe(9);
    expect(slot.getMinutes()).toBe(30);
  });

  test('rejects a malformed date with a 400', () => {
    expect(() => parseSlot('not-a-date')).toThrow(/appt_datetime must look like/);
  });

  test('rejects an impossible date such as February 30', () => {
    expect(() => parseSlot('2026-02-30T09:00')).toThrow(/not a valid date/);
  });
});

describe('assertBelowDailyCap', () => {
  test('allows booking when the day has room', () => {
    expect(() => assertBelowDailyCap(DAILY_CAP - 1)).not.toThrow();
  });

  test('blocks booking when the day is at the 12-slot cap', () => {
    expect(() => assertBelowDailyCap(DAILY_CAP)).toThrow(/fully booked/);
  });
});