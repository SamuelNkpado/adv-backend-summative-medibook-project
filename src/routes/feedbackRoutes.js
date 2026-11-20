const express = require('express');
const { resolveLang, loadLocale, formatToday, SUPPORTED } = require('../i18n');

const router = express.Router();
const QUESTION_COUNT = 5;
const MAX_ANSWER_LENGTH = 5000;
const CHARS_PER_LINE = 90;
const LANGUAGE_NAMES = { en: 'English', fr: 'Français' };

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Reads q1..q5 from the form body. Missing or non-text values become empty strings.
function readAnswers(body) {
  return Array.from({ length: QUESTION_COUNT }, (_, index) => {
    const value = body[`q${index + 1}`];
    return typeof value === 'string' ? value.trim().slice(0, MAX_ANSWER_LENGTH) : '';
  });
}

// Estimates how many lines a stored answer needs, so the whole answer shows without scrolling.
function rowsFor(text) {
  const visualLines = String(text)
    .split('\n')
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0);
  return Math.max(4, visualLines + 1);
}

function renderLanguageLinks(current) {
  const links = SUPPORTED.map((code) => {
    const active = code === current ? ' class="active" aria-current="page"' : '';
    return `<a href="/feedback?lang=${code}"${active}>${LANGUAGE_NAMES[code]}</a>`;
  });
  return links.join('');
}

function renderPage(lang, submitted) {
  const t = loadLocale(lang);
  const dateText = formatToday(lang);
  const values = submitted || t.answers;

  const questions = t.questions
    .map((question, index) => {
      const name = `q${index + 1}`;
      const answer = values[index] || '';
      return `
    <div class="question">
      <label for="${name}">${index + 1}. ${escapeHtml(question)}</label>
      <textarea id="${name}" name="${name}" rows="${rowsFor(answer)}">${escapeHtml(answer)}</textarea>
    </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(t.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; line-height: 1.5; }
    h1 { font-size: 1.6rem; margin-top: 1rem; }
    .languages a { display: inline-block; margin-right: 0.5rem; padding: 0.4rem 0.9rem; border: 1px solid #888; border-radius: 4px; color: #1a1a1a; text-decoration: none; }
    .languages a.active { font-weight: bold; text-decoration: underline; background: #eee; }
    .date { color: #555; margin-bottom: 1rem; }
    .question { margin-bottom: 1.25rem; }
    label { display: block; font-weight: bold; margin-bottom: 0.4rem; }
    textarea { width: 100%; box-sizing: border-box; font: inherit; padding: 0.5rem; resize: vertical; white-space: pre-wrap; }
    button[type="submit"] { padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
  </style>
</head>
<body>
  <nav class="languages">${renderLanguageLinks(lang)}</nav>

  <h1>${escapeHtml(t.title)}</h1>
  <p class="date">${escapeHtml(t.today)}: ${escapeHtml(dateText)}</p>
  <p>${escapeHtml(t.instructions)}</p>

  <form method="post" action="/feedback?lang=${lang}">${questions}
    <button type="submit">${escapeHtml(t.submit)}</button>
  </form>
</body>
</html>`;
}

router.get('/', (req, res) => {
  const lang = resolveLang(typeof req.query.lang === 'string' ? req.query.lang : undefined);
  res.type('html').send(renderPage(lang, null));
});

router.post('/', express.urlencoded({ extended: false }), (req, res) => {
  const lang = resolveLang(typeof req.query.lang === 'string' ? req.query.lang : undefined);
  res.type('html').send(renderPage(lang, readAnswers(req.body)));
});

module.exports = router;