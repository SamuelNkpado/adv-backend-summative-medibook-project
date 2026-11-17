const { query } = require('./db');

async function doctorStats(doctorId, capacity) {
  const [summary] = await query(
    `SELECT
        COALESCE(SUM(amount_paid), 0) - COALESCE(SUM(refund_amount), 0) AS revenue,
        COALESCE(SUM(CASE WHEN status = 'booked' AND appt_datetime >= NOW() THEN 1 ELSE 0 END), 0)
          AS upcoming_count
       FROM appointments
      WHERE doctor_id = ?`,
    [doctorId]
  );

  const [utilization] = await query(
    `SELECT ROUND(COUNT(*) / (7 * ?) * 100, 1) AS utilization_pct
       FROM appointments
      WHERE doctor_id = ?
        AND status = 'booked'
        AND DATE(appt_datetime) BETWEEN CURDATE() AND CURDATE() + INTERVAL 6 DAY`,
    [capacity, doctorId]
  );

  // Recursive CTE generates all 7 days, so days with no bookings still appear as 0.
  const perDay = await query(
    `WITH RECURSIVE next_days AS (
        SELECT CURDATE() AS day
        UNION ALL
        SELECT day + INTERVAL 1 DAY FROM next_days WHERE day < CURDATE() + INTERVAL 6 DAY
     )
     SELECT DATE_FORMAT(nd.day, '%Y-%m-%d') AS day,
            COUNT(a.appointment_id) AS booked
       FROM next_days nd
       LEFT JOIN appointments a
         ON a.doctor_id = ?
        AND a.status = 'booked'
        AND DATE(a.appt_datetime) = nd.day
      GROUP BY nd.day
      ORDER BY nd.day`,
    [doctorId]
  );

  return {
    revenue: Number(summary.revenue),
    upcoming_count: Number(summary.upcoming_count),
    utilization_pct: Number(utilization.utilization_pct || 0),
    next_7_days: perDay,
  };
}

async function doctorsReport() {
  return query(
    `SELECT d.doctor_id,
            d.doctor_name,
            COUNT(a.appointment_id) AS total_appointments,
            COALESCE(SUM(a.amount_paid), 0) - COALESCE(SUM(a.refund_amount), 0) AS revenue
       FROM doctors d
       LEFT JOIN appointments a ON a.doctor_id = d.doctor_id
      GROUP BY d.doctor_id, d.doctor_name
      ORDER BY d.doctor_id`
  );
}

async function busyDaysReport(capacity, percent) {
  return query(
    `SELECT doctor_id,
            DATE_FORMAT(appt_datetime, '%Y-%m-%d') AS day,
            COUNT(*) AS booked,
            ROUND(COUNT(*) / ? * 100, 1) AS utilization_pct
       FROM appointments
      WHERE status = 'booked'
      GROUP BY doctor_id, DATE_FORMAT(appt_datetime, '%Y-%m-%d')
     HAVING COUNT(*) * 100 > ? * ?
      ORDER BY doctor_id, day`,
    [capacity, percent, capacity]
  );
}

module.exports = { doctorStats, doctorsReport, busyDaysReport };