const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

let dirReady = null;

function ensureLogDir() {
  if (!dirReady) {
    dirReady = fs.promises.mkdir(LOG_DIR, { recursive: true });
  }
  return dirReady;
}

async function logEvent(event, details) {
  try {
    await ensureLogDir();
    const line = JSON.stringify({ timestamp: new Date().toISOString(), event, ...details }) + '\n';
    await fs.promises.appendFile(LOG_FILE, line, 'utf8');
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

module.exports = { logEvent, LOG_FILE };