const { formatDay, formatSlot, parseDay } = require('../src/dates');

const NOW = new Date('2026-11-16T08:00:00');

describe('parseDay', () => {
  test('accepts today', () => {
    expect(parseDay('2026-11-16', NOW)).toBe('2026-11-16');
  });

  test('accepts a future day', () => {
    expect(parseDay('2026-12-01', NOW)).toBe('2026-12-01');
  });

  test('rejects a past day with 422', () => {
    expect(() => parseDay('2026-11-01', NOW)).toThrow(/today or later/);
  });

  test('rejects a malformed day', () => {
    expect(() => parseDay('16/11/2026', NOW)).toThrow(/must look like/);
  });

  test('rejects an impossible day such as February 30', () => {
    expect(() => parseDay('2026-02-30', NOW)).toThrow(/not a valid date/);
  });
});

describe('formatSlot and formatDay', () => {
  test('formats a slot with a T separator and zero padding', () => {
    expect(formatSlot(new Date(2026, 11, 1, 9, 30))).toBe('2026-12-01T09:30');
  });

  test('formats a day with zero padding', () => {
    expect(formatDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});