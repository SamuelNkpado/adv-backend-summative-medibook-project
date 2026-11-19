const queue = require('./queue');
const appointmentModel = require('./models/appointmentModel');
const doctorModel = require('./models/doctorModel');
const { pool } = require('./models/db');
const { parseSlot, validateSlotTime } = require('./bookingRules');
const { logEvent } = require('./audit');

let running = true;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function bestEffort(label, task) {
  try {
    await task();
  } catch (err) {
    console.error(`${label} failed:`, err.message);
  }
}

async function promoteFromWaitlist({ doctor_id: doctorId, day, slot }) {
  const waiting = await queue.promoteNext(doctorId, day);
  if (waiting === null) {
    return; // nobody is waiting for this day
  }
  const patientId = Number(waiting);

  // Everything that can fail before the booking commits: the patient goes back
  // to the front of the waitlist, so they are never lost.
  let appointmentId;
  try {
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      throw new Error(`Doctor ${doctorId} not found`);
    }
    const slotTime = validateSlotTime(parseSlot(slot));

    appointmentId = await appointmentModel.createBooking({
      patientId,
      doctorId,
      slot: slotTime,
      amountPaid: Number(doctor.consultation_fee),
    });
  } catch (err) {
    await bestEffort('Requeue', () => queue.requeueFailedPromotion(doctorId, day, waiting));
    await bestEffort('Audit log', () =>
      logEvent('waitlist_promotion_failed', {
        patient_id: patientId,
        doctor_id: doctorId,
        slot,
        reason: err.message,
      })
    );
    console.error(`Promotion of patient ${patientId} failed, returned to waitlist: ${err.message}`);
    return;
  }

  // The booking is committed, so the patient must never be requeued from here.
  await bestEffort('Confirm promotion', () => queue.confirmPromotion(doctorId, day, waiting));
  await bestEffort('Audit log', () =>
    logEvent('waitlist_promoted', {
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      slot,
    })
  );
  await bestEffort('Confirmation job', () =>
    queue.enqueueJob('confirmation', {
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      source: 'waitlist',
    })
  );
  console.log(`Promoted patient ${patientId} into ${slot} (appointment ${appointmentId})`);
}

async function handleJob(job) {
  switch (job.type) {
    case 'freed_slot':
      return promoteFromWaitlist(job.payload);
    case 'confirmation':
      return logEvent('booking_confirmed', job.payload);
    default:
      console.warn(`Unknown job type: ${job.type}`);
  }
}

async function main() {
  console.log('MediBook worker started, waiting for jobs');
  while (running) {
    try {
      const job = await queue.takeNextJob(5);
      if (job) {
        await handleJob(job).catch((err) => console.error('Job failed:', err.message));
      }
    } catch (err) {
      console.error('Worker error, retrying:', err.message);
      await sleep(2000);
    }
  }
}

async function shutdown(signal) {
  console.log(`${signal} received, stopping worker`);
  running = false;
  await queue.quit().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main();