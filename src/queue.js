const { createClient } = require('redis');
const { redisUrl } = require('./config');

const client = createClient({ url: redisUrl });
client.on('error', (err) => console.error('Redis error:', err.message));

let connecting = null;
function connect() {
  if (!connecting) {
    connecting = client.connect();
  }
  return connecting;
}

const waitlistKey = (doctorId, day) => `waitlist:${doctorId}:${day}`;
const processingKey = (doctorId, day) => `processing:${doctorId}:${day}`;
const JOBS_KEY = 'jobs';

// Patients join the tail, so the head is the longest-waiting patient.
async function joinWaitlist(doctorId, day, patientId) {
  await connect();
  return client.rPush(waitlistKey(doctorId, day), String(patientId));
}

async function isOnWaitlist(doctorId, day, patientId) {
  await connect();
  const position = await client.lPos(waitlistKey(doctorId, day), String(patientId));
  return position !== null && position !== undefined;
}

// Atomically move the head of the waitlist into the processing list.
// The patient is never in neither list while a promotion is in progress.
async function promoteNext(doctorId, day) {
  await connect();
  return client.lMove(waitlistKey(doctorId, day), processingKey(doctorId, day), 'LEFT', 'RIGHT');
}

// The promoted booking is committed, so the patient leaves the processing list.
async function confirmPromotion(doctorId, day, patientId) {
  await connect();
  return client.lRem(processingKey(doctorId, day), 1, String(patientId));
}

// The promoted booking failed: move the patient back to the head of the waitlist.
// Both steps run in one transaction, so the patient is never in neither list.
async function requeueFailedPromotion(doctorId, day, patientId) {
  await connect();
  const id = String(patientId);
  await client
    .multi()
    .lRem(processingKey(doctorId, day), 1, id)
    .lPush(waitlistKey(doctorId, day), id)
    .exec();
}

async function enqueueJob(type, payload) {
  await connect();
  return client.rPush(JOBS_KEY, JSON.stringify({ type, payload }));
}

// Waits up to timeoutSeconds for the next job, then returns it or null.
async function takeNextJob(timeoutSeconds = 5) {
  await connect();
  const item = await client.blPop(JOBS_KEY, timeoutSeconds);
  return item ? JSON.parse(item.element) : null;
}

async function quit() {
  if (connecting) {
    await client.quit();
    connecting = null;
  }
}

module.exports = {
  joinWaitlist,
  isOnWaitlist,
  promoteNext,
  confirmPromotion,
  requeueFailedPromotion,
  enqueueJob,
  takeNextJob,
  quit,
};