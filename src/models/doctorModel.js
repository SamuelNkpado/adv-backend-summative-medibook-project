const { pool, query } = require('./db');

async function findAll() {
  return query(
    'SELECT doctor_id, doctor_name, specialty, consultation_fee, room FROM doctors ORDER BY doctor_id'
  );
}

async function findById(id) {
  const rows = await query(
    'SELECT doctor_id, doctor_name, specialty, consultation_fee, room FROM doctors WHERE doctor_id = ?',
    [id]
  );
  return rows[0] || null;
}

async function create({ name, specialty, fee, room }) {
  const [result] = await pool.execute(
    'INSERT INTO doctors (doctor_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [name, specialty, fee, room]
  );
  return findById(result.insertId);
}

async function update(id, { name, specialty, fee, room }) {
  await query(
    'UPDATE doctors SET doctor_name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE doctor_id = ?',
    [name, specialty, fee, room, id]
  );
  return findById(id);
}

async function remove(id) {
  try {
    const [result] = await pool.execute('DELETE FROM doctors WHERE doctor_id = ?', [id]);
    return result.affectedRows > 0;
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      err.blockedByAppointments = true;
    }
    throw err;
  }
}

module.exports = { findAll, findById, create, update, remove };