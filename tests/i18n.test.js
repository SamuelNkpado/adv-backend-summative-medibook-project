const { resolveLang, loadLocale, formatToday, DEFAULT_LANG } = require('../src/i18n');

describe('resolveLang', () => {
  test('keeps a supported language', () => {
    expect(resolveLang('fr')).toBe('fr');
  });

  test('falls back to English for an unsupported language', () => {
    expect(resolveLang('de')).toBe(DEFAULT_LANG);
  });

  test('falls back to English when no language is given', () => {
    expect(resolveLang(undefined)).toBe('en');
  });

  test('is case-sensitive, so FR falls back to English', () => {
    expect(resolveLang('FR')).toBe('en');
  });
});

describe('loadLocale', () => {
  test('loads all five questions in English', () => {
    expect(loadLocale('en').questions).toHaveLength(5);
  });

  test('loads all five questions in French', () => {
    expect(loadLocale('fr').questions).toHaveLength(5);
  });

  test('English and French have the same keys', () => {
    expect(Object.keys(loadLocale('fr')).sort()).toEqual(Object.keys(loadLocale('en')).sort());
  });
});

describe('formatToday', () => {
  test('formats the date in the active locale', () => {
    const date = new Date(2026, 10, 17);
    expect(formatToday('en', date)).toMatch(/2026/);
    expect(formatToday('fr', date)).toMatch(/2026/);
    expect(formatToday('fr', date)).not.toBe(formatToday('en', date));
  });
});