const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const DEFAULT_LANG = 'en';
const SUPPORTED = ['en', 'fr'];

const cache = {};

function resolveLang(requested) {
  return SUPPORTED.includes(requested) ? requested : DEFAULT_LANG;
}

function loadLocale(lang) {
  if (!cache[lang]) {
    const file = path.join(LOCALES_DIR, `${lang}.json`);
    cache[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return cache[lang];
}

function formatToday(lang, now = new Date()) {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'full',
  }).format(now);
}

module.exports = { resolveLang, loadLocale, formatToday, SUPPORTED, DEFAULT_LANG };