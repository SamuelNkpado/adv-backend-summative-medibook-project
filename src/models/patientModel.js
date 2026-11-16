const { pool, query } = require('./db');

async function findAll() {
  return query(
    'SELECT patient_id, patient_name, patient_email, patient_phone FROM patients ORDER BY patient_id'
  );
}

async function findById(id) {
  const rows = await query(
    'SELECT patient_id, patient_name, patient_email, patient_phone FROM patients WHERE patient_id = ?',
    [id]
  );
  return rows[0] || null;
}

async function create({ name, email, phone }) {
  const [result] = await pool.execute(
    'INSERT INTO patients (patient_name, patient_email, patient_phone) VALUES (?, ?, ?)',
    [name, email, phone]
  );
  return findById(result.insertId);
}

async function update(id, { name, email, phone }) {
  await query(
    'UPDATE patients SET patient_name = ?, patient_email = ?, patient_phone = ? WHERE patient_id = ?',
    [name, email, phone, id]
  );
  return findById(id);
}

async function remove(id) {
  try {
    const [result] = await pool.execute('DELETE FROM patients WHERE patient_id = ?', [id]);
    return result.affectedRows > 0;
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      err.blockedByAppointments = true;
    }
    throw err;
  }
}

module.exports = { findAll, findById, create, update, remove };