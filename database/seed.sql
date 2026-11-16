USE medibook;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE appointments;
TRUNCATE TABLE doctors;
TRUNCATE TABLE patients;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO patients (patient_name, patient_email, patient_phone) VALUES
  ('Ama Mensah',   'ama@mail.com',   '0244-111-222'),
  ('Kojo Owusu',   'kojo@mail.com',  '0555-333-444'),
  ('Grace Uwase',  'grace@mail.com', '0788-555-901');

INSERT INTO doctors (doctor_name, specialty, consultation_fee, room) VALUES
  ('Dr. Boateng', 'Dermatology',  150.00, 'R-12'),
  ('Dr. Adjei',   'Paediatrics',  100.00, 'R-03'),
  ('Dr. Mugisha', 'Cardiology',   200.00, 'R-07');

-- Dr. Mugisha (doctor 3) has zero appointments on purpose.
-- Dr. Boateng (doctor 1) gets 10 bookings on 2026-12-01 for the busy-day report.
INSERT INTO appointments
  (appt_ref, patient_id, doctor_id, appt_datetime, status, amount_paid, booked_on) VALUES
  ('AP-001', 1, 1, '2026-08-10 09:00:00', 'booked',    150.00, '2026-07-01'),
  ('AP-002', 2, 1, '2026-08-10 09:30:00', 'booked',    120.00, '2026-07-02'),
  ('AP-003', 1, 2, '2026-08-15 10:00:00', 'booked',    100.00, '2026-07-03'),
  ('AP-004', 3, 2, '2026-08-15 10:30:00', 'cancelled',   0.00, '2026-07-04'),
  ('AP-005', 2, 1, '2026-12-01 09:00:00', 'booked',    150.00, '2026-11-01'),
  ('AP-006', 2, 1, '2026-12-01 09:30:00', 'booked',    150.00, '2026-11-01'),
  ('AP-007', 2, 1, '2026-12-01 10:00:00', 'booked',    150.00, '2026-11-01'),
  ('AP-008', 2, 1, '2026-12-01 10:30:00', 'booked',    150.00, '2026-11-01'),
  ('AP-009', 2, 1, '2026-12-01 11:00:00', 'booked',    150.00, '2026-11-01'),
  ('AP-010', 2, 1, '2026-12-01 11:30:00', 'booked',    150.00, '2026-11-01'),
  ('AP-011', 2, 1, '2026-12-01 12:00:00', 'booked',    150.00, '2026-11-01'),
  ('AP-012', 2, 1, '2026-12-01 12:30:00', 'booked',    150.00, '2026-11-01'),
  ('AP-013', 2, 1, '2026-12-01 13:00:00', 'booked',    150.00, '2026-11-01'),
  ('AP-014', 2, 1, '2026-12-01 13:30:00', 'booked',    150.00, '2026-11-01');