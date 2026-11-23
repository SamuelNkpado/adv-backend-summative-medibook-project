// Runs a task whose failure must never fail the request or job that triggered it.
// The failure is reported to the console and otherwise ignored.
async function bestEffort(label, task) {
  try {
    await task();
  } catch (err) {
    console.error(`${label} failed:`, err.message);
  }
}

module.exports = { bestEffort };