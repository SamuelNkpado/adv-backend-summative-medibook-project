CREATE DATABASE IF NOT EXISTS medibook
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medibook;

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
  patient_id     INT          NOT NULL AUTO_INCREMENT,
  patient_name   VARCHAR(100) NOT NULL,
  patient_email  VARCHAR(255) NOT NULL,
  patient_phone  VARCHAR(20)  NOT NULL,
  PRIMARY KEY (patient_id),
  UNIQUE KEY uq_patients_email (patient_email)
);

CREATE TABLE doctors (
  doctor_id         INT           NOT NULL AUTO_INCREMENT,
  doctor_name       VARCHAR(100)  NOT NULL,
  specialty         VARCHAR(100)  NOT NULL,
  consultation_fee  DECIMAL(10,2) NOT NULL,
  room              VARCHAR(10)   NOT NULL,
  PRIMARY KEY (doctor_id),
  CONSTRAINT chk_doctors_fee CHECK (consultation_fee >= 0)
);

CREATE TABLE appointments (
  appointment_id  INT           NOT NULL AUTO_INCREMENT,
  appt_ref        VARCHAR(20)   NOT NULL,
  patient_id      INT           NOT NULL,
  doctor_id       INT           NOT NULL,
  appt_datetime   DATETIME      NOT NULL,
  status          ENUM('booked','cancelled') NOT NULL DEFAULT 'booked',
  amount_paid     DECIMAL(10,2) NOT NULL,
  booked_on       DATE          NOT NULL,
  active_slot     DATETIME
                  GENERATED ALWAYS AS (IF(status = 'booked', appt_datetime, NULL)) STORED,
  PRIMARY KEY (appointment_id),
  UNIQUE KEY uq_appt_ref (appt_ref),
  UNIQUE KEY uq_doctor_active_slot (doctor_id, active_slot),
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id),
  CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors (doctor_id),
  CONSTRAINT chk_appt_amount CHECK (amount_paid >= 0),
  CONSTRAINT chk_appt_slot CHECK (
    SECOND(appt_datetime) = 0
    AND MINUTE(appt_datetime) IN (0, 30)
    AND TIME(appt_datetime) BETWEEN '09:00:00' AND '16:30:00'
  )
);