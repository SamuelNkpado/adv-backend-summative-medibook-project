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
const FREED_SLOTS_KEY = 'jobs:freed-slots';

// Patients join the tail, so the head is the longest-waiting patient.
async function joinWaitlist(doctorId, day, patientId) {
  await connect();
  return client.rPush(waitlistKey(doctorId, day), String(patientId));
}

// Atomically move the head of the waitlist into the processing list.
// The patient is never in neither list while the promotion is in progress.
async function promoteNext(doctorId, day) {
  await connect();
  return client.lMove(
    waitlistKey(doctorId, day),
    processingKey(doctorId, day),
    'LEFT',
    'RIGHT'
  );
}

// The promoted booking succeeded: the patient is now in the appointments table,
// so remove them from the processing list.
async function confirmPromotion(doctorId, day, patientId) {
  await connect();
  return client.lRem(processingKey(doctorId, day), 1, String(patientId));
}

// The promoted booking failed: return the patient to the front of the waitlist.
async function requeueFailedPromotion(doctorId, day, patientId) {
  await connect();
  await client.lMove(
    processingKey(doctorId, day),
    waitlistKey(doctorId, day),
    'RIGHT',
    'LEFT'
  );
}

// Called by the cancel endpoint: announce that a slot has been freed.
async function enqueueFreedSlot(job) {
  await connect();
  return client.rPush(FREED_SLOTS_KEY, JSON.stringify(job));
}

// Called by the worker: wait up to 5 seconds for the next freed slot.
async function takeNextFreedSlot(timeoutSeconds = 5) {
  await connect();
  const item = await client.blPop(FREED_SLOTS_KEY, timeoutSeconds);
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
  promoteNext,
  confirmPromotion,
  requeueFailedPromotion,
  enqueueFreedSlot,
  takeNextFreedSlot,
  quit,
};