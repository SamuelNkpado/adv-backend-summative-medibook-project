# Final Assessment — Backend Development

**Weight:** 30% of final grade
**Duration:** 2 weeks
**Mode:** Individual project
**Stack (mandatory):** Node.js, Express.js, MySQL (with parameterized queries only), Redis

---

## Scenario — "MediBook" Clinic Appointment System

A community clinic wants a backend service for booking doctor appointments. Doctors see patients in fixed 30-minute slots during working hours (09:00–17:00), each doctor can handle at most **12 appointments per day**, and the clinic administrator needs reports. You will design the database, build the API, and handle the operational concerns (background jobs, logging, testing).

**Entity limit:** Your database must contain **exactly 3 entities**:

| Entity | Purpose |
|---|---|
| `patients` | People who book appointments |
| `doctors` | Doctors with a specialty, consultation fee, and room |
| `appointments` | A patient's booking with a doctor at a specific date/time (links the other two) |

You may add columns as needed, but no additional tables (lookup/locale JSON files don't count).

---

## Part A — Database Design & Normalization

The clinic currently tracks everything in this single spreadsheet:

| appt_ref | patient_name | patient_email | patient_phone | doctor_name | specialty | consultation_fee | room | appt_datetime | amount_paid | booked_on |
|---|---|---|---|---|---|---|---|---|---|---|
| AP-001 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:00 | 150.00 | 2026-07-01 |
| AP-002 | Kojo Owusu | kojo@mail.com | 0555-333-444 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:30 | 120.00 | 2026-07-02 |
| AP-003 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Adjei | Paediatrics | 100.00 | R-03 | 2026-08-15 10:00 | 100.00 | 2026-07-03 |

Study the spreadsheet, then produce a **database schema diagram** of your design in fully normalized form (up to 3NF). The diagram must show **everything**:

- all 3 entities with every column and its MySQL data type,
- primary keys and foreign keys, clearly marked,
- the relationships between the entities and their cardinality (1:N, etc.),
- every constraint that enforces a business rule (`NOT NULL`, `UNIQUE`, `CHECK`) — in particular, it must be visible from the diagram that *a doctor cannot have two appointments at the same date/time*.

Use any tool you like (dbdiagram.io, draw.io) and include it in your repository as `schema-diagram` (image or PDF).

## Part B — Database Implementation & Project Setup

1. **Table creation.** Translate your Part A diagram into a MySQL DDL script, `database/schema.sql`, that creates the database and the 3 tables — data types, primary keys, foreign keys, and every constraint shown on the diagram. The script must run cleanly on a fresh MySQL server. Also provide `database/seed.sql` with realistic sample data: at least 3 patients, 3 doctors (including one with no appointments), and 8 appointments (including one doctor-day at or near the 12-slot daily cap).

2. **Project structure.** Set up the Express project in a **models / controllers / routes** structure:

```
├── database/          schema.sql and seed.sql (Part B.1)
└── src/
    ├── models/        all application SQL lives here — nowhere else
    ├── controllers/   business logic; calls model functions, never the DB directly
    └── routes/        maps URLs and HTTP methods to controllers
```

Every SQL statement in the application must use **parameterized queries** (`?` placeholders via `mysql2`). SQL found in a controller or route file loses marks. **Do not use any ORM for this assignment.**

## Part C — Controllers & Endpoints

Implement endpoints for the operations below. **Designing the API is part of the assessment**: you choose the URL paths, the HTTP methods, and how the endpoints are grouped into controllers and routes — your choices should follow REST conventions and will be marked. The business rules listed are **requirements** — *how* you satisfy them is your design decision, and you will be asked to defend it at the viva.

1. **Basic CRUD** — standard **C**reate, **R**ead (one and all), **U**pdate, and **D**elete operations for patients and for doctors, with sensible validation. (Appointments get their create/delete behaviour from the two operations below — no separate CRUD needed there.)

2. **Book an appointment**. Rules that must always hold:
   - Appointments can only be booked in the future, within working hours (09:00–17:00), on a 30-minute slot boundary.
   - A doctor never exceeds 12 appointments in a day.
   - Two patients can never hold the same doctor slot — even when both requests arrive at the same instant.

3. **Cancel an appointment**. Rules:
   - The refund is computed by the server from the notice given: more than 48 hours → 100%; 24–48 hours → 50%; less than 24 hours → 0%. The response states the refund amount.
   - The cancellation and its refund record succeed or fail together.
   - A cancelled slot becomes bookable by another patient, while the cancellation record is kept for refund history.
   - A cancellation notifies the waitlist (Part E).

4. **Doctor statistics** — for a given doctor: revenue collected, upcoming appointment count, appointments per day for the next 7 days, and utilization % against the 12-slot daily cap.

Operations 5 and 6 are where your **advanced SQL** is assessed: the results must be produced by the SQL in your models (joins, aggregates, etc) — not fetched raw and computed in JavaScript.

5. **Doctors report** — every doctor's total appointments and revenue collected, including doctors with zero appointments.
6. **Busy days report** — every (doctor, date) where more than 80% of the 12-slot daily capacity is booked.

### General requirements (all endpoints)

Input validation with meaningful `400` messages; correct status codes (`201`, `404`, `409`, `422`); a central error-handling middleware.

## Part D — Node.js `fs` Module

**Audit log:** every successful booking and cancellation must be appended as a JSON line to `logs/audit.log` using the `fs` module (async, non-blocking — no `*Sync` calls inside request handlers). The logger must create the `logs/` directory on first run if it doesn't exist, and a logging failure must **not** fail the user's request.

## Part E — Queues & Redis

1. **Waitlist queue:** when the requested slot (or the doctor's whole day) is fully booked, offer the patient a waitlist spot — push them onto a queue (Redis list, or Bull/BullMQ). When a cancellation frees a slot, a **worker process** (separate from the web server) pops the first waitlisted patient and books them in. Think through: what happens if the promoted booking itself fails? The patient must not simply vanish from both the queue and the appointments table.
2. **Notification jobs:** every confirmed appointment enqueues a "confirmation SMS/email" job; the worker processes it by writing the message to the audit log (no real sending needed).

## Part F — Unit Testing

Using Jest, write **at least 6 meaningful unit tests**:

- The refund calculator from Part C.3 — cover all three tiers **and both boundaries** (exactly 24 hours, exactly 48 hours). Boundary behaviour must match your documented policy.
- One validation function of your choice — e.g., the slot-alignment/working-hours check — including at least one edge case (17:00 exactly? 09:15? a malformed date?).

Tests must not require a live MySQL or Redis connection — that's the point of extracting pure functions. `npm test` must run them.

## Part G — i18n & l10n: Course Feedback Page

Create a **simple HTML page** (served by your Express app at `GET /feedback`) containing a short course-feedback form with **exactly 5 essay questions** (each answered in a `<textarea>`):

1. Which topic in this course did you find most challenging, and why?
2. Describe one concept you understood only after the practical assignments. What made it click?
3. How has your approach to designing databases or APIs changed since the start of the trimester?
4. What would you improve about how this course was taught or assessed?
5. How do you plan to apply what you learned in this course going forward?

**i18n/l10n requirement (keep it simple):** the page title, instructions, and all 5 questions must be loaded from locale files (e.g., `locales/en.json` and `locales/fr.json` — English plus one other language of your choice). Visiting `/feedback?lang=fr` shows the translated page; the default is English, and an unsupported `lang` value must fall back to English rather than crash. Display today's date on the page formatted for the active locale (e.g., using `Intl.DateTimeFormat`).

---

## Submission Requirements

- Git repository (with meaningful commit history — a single "final commit" will be questioned) containing:
  - `schema-diagram` (image or PDF), `schema.sql`, and `seed.sql` (as specified in Part B)
  - Application source, worker process, tests, locale files
  - `README.md` with: setup steps, `.env.example`, and the short written justifications requested in Parts C, D, and E
- The app must start with `npm install && npm start` (plus documented MySQL/Redis setup) and tests with `npm test`.
- A short **viva/demo (10 minutes)** walkthrough.

**Automatic penalties:** SQL injection vector anywhere in the app (−15), secrets committed to the repo (−5), app does not start per README instructions (−10), work the student cannot explain in the video (or at a follow-up viva if called) | Academic integrity referral; affected criteria re-scored at Developing or below |


# MediBook Clinic Appointment API

A backend for booking doctor appointments at a community clinic. It is built with Express.js, MySQL 8, and Redis, and it uses parameterized queries only, with no ORM.

## Contents

1. Requirements
2. Setup
3. Running the app
4. Running the tests
5. API reference
6. Postman collection
7. Feedback page
8. Design justifications (Parts C, D, E)
9. Known limitations

## 1. Requirements

| Tool | Version used | Notes |
|---|---|---|
| Node.js | 22 | 18 or later should work |
| MySQL | 8.0 | Generated columns and CHECK constraints need 8.0.16 or later |
| Redis | 7 | On Windows, run Redis inside WSL 2 (Ubuntu) |

## 2. Setup

### 2.1 Start Redis

On Windows, open Ubuntu in WSL and run:

```
sudo apt update && sudo apt install -y redis-server
sudo service redis-server start
redis-cli ping
```

The last command should print `PONG`.

### 2.2 Create the MySQL user

Log in to MySQL as an administrator and run:

```sql
CREATE USER 'medibook'@'localhost' IDENTIFIED BY 'choose_a_password';
GRANT ALL PRIVILEGES ON medibook.* TO 'medibook'@'localhost';
FLUSH PRIVILEGES;
```

### 2.3 Load the schema and sample data

From the project root:

```
mysql -u medibook -p < database/schema.sql
mysql -u medibook -p < database/seed.sql
```

In Windows PowerShell, use this form instead:

```
Get-Content database\schema.sql | mysql -u medibook -p
Get-Content database\seed.sql | mysql -u medibook -p
```

`schema.sql` creates the `medibook` database and its three tables. It drops and recreates them, so it can be run again. `seed.sql` replaces the data with sample patients, doctors, and appointments.

### 2.4 Configure the environment

Copy `.env.example` to `.env` and set your MySQL password:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=medibook
DB_PASSWORD=choose_a_password
DB_NAME=medibook
REDIS_URL=redis://127.0.0.1:6379
PORT=3000
```

`.env` is listed in `.gitignore`, so the password is never committed.

### 2.5 Install dependencies

```
npm install
```

## 3. Running the app

The app needs two processes: the API and the waitlist worker. Open two terminals in the project root.

Terminal 1, the API:

```
npm start
```

Terminal 2, the worker:

```
npm run worker
```

The API listens on `http://localhost:3000`. The worker waits for jobs from Redis and writes its results to `logs/audit.log`.

Check that the API is running:

```
curl http://localhost:3000/health
```

Expected output: `{"status":"ok"}`.

## 4. Running the tests

```
npm test
```

The tests are pure unit tests. They do not need MySQL or Redis to be running. There are 39 tests in four files: booking rules, refund policy, date handling, and the feedback locale logic.

## 5. API reference

All request bodies are JSON, except the feedback form, which is HTML form data. Error responses have the form `{ "error": "message" }`.

### Patients

| Method | Path | Success | Other responses |
|---|---|---|---|
| GET | `/api/patients` | 200 | |
| GET | `/api/patients/:id` | 200 | 400 bad ID, 404 not found |
| POST | `/api/patients` | 201 | 400 invalid input, 409 duplicate email |
| PUT | `/api/patients/:id` | 200 | 400, 404, 409 |
| DELETE | `/api/patients/:id` | 204 | 400, 404, 409 has appointments |

Body for POST and PUT: `name`, `email`, `phone`.

### Doctors

| Method | Path | Success | Other responses |
|---|---|---|---|
| GET | `/api/doctors` | 200 | |
| GET | `/api/doctors/:id` | 200 | 400, 404 |
| POST | `/api/doctors` | 201 | 400 invalid input |
| PUT | `/api/doctors/:id` | 200 | 400, 404 |
| DELETE | `/api/doctors/:id` | 204 | 400, 404, 409 has appointments |
| GET | `/api/doctors/:id/stats` | 200 | 400, 404 |

Body for POST and PUT: `name`, `specialty`, `fee`, `room`. The fee may be sent as a number or as text, such as `"150.00"`.

### Appointments

| Method | Path | Success | Other responses |
|---|---|---|---|
| POST | `/api/appointments` | 201 | 400 bad input, 404 patient or doctor missing, 409 slot taken or day full (includes a `waitlist` hint), 422 past time or outside 09:00–16:30 |
| GET | `/api/appointments/:id` | 200 | 400, 404 |
| POST | `/api/appointments/:id/cancel` | 200 (returns `refund_amount`) | 400, 404, 409 already cancelled |

Body for POST: `patient_id`, `doctor_id`, `appt_datetime` (for example `2026-12-01T10:00`), `amount_paid`.

Cancelling is a POST to `/cancel`, not a DELETE. The record is kept for refund history.

### Reports

| Method | Path | Success |
|---|---|---|
| GET | `/api/reports/doctors` | 200 |
| GET | `/api/reports/busy-days` | 200 |

### Waitlist

| Method | Path | Success | Other responses |
|---|---|---|---|
| POST | `/api/waitlist` | 201 | 400 bad input, 404 patient or doctor missing, 409 already waiting, 422 past day |

Body: `patient_id`, `doctor_id`, `day` (for example `2026-12-01`).

### Health

| Method | Path | Success |
|---|---|---|
| GET | `/health` | 200 |

## 6. Postman collection

The file `postman/MediBook.postman_collection.json` contains 36 requests in seven folders. Each request checks its status code and the fields that matter, and requests that create data save their IDs for later requests.

To run it:

1. Import the file into Postman.
2. Reseed the database, using the commands in section 2.3.
3. Start the API and the worker.
4. Choose **Run collection**.

The full run passes 66 checks. Reseed before every run. The booking step creates an appointment on 2026-12-30 at 10:00, so a second run without reseeding will get a 409 at that step.

## 7. Feedback page

`GET /feedback` shows a course-feedback form with five questions. Every visible string comes from the locale files in `locales/`.

| URL | Result |
|---|---|
| `/feedback` | English (the default) |
| `/feedback?lang=en` | English |
| `/feedback?lang=fr` | French |
| `/feedback?lang=de` or any other value | English, without an error |

The date is formatted for the active language with `Intl.DateTimeFormat`. Submitting the form posts the answers back to the same page, where they are shown again. The answers are not stored.

## 8. Design justifications

### Part C: booking and cancellation

**The database holds the slot rule.** The `appointments` table has a generated column, `active_slot`, which equals `appt_datetime` while a booking is active and NULL once it is cancelled. A unique key on `(doctor_id, active_slot)` therefore stops two active bookings for one doctor at one time. MySQL ignores NULLs in unique keys, so a cancelled slot can be booked again while its record stays for refund history.

**Concurrent requests are serialized by a row lock.** Each booking runs in a transaction. The first step locks the doctor's row with `SELECT ... FOR UPDATE`, so a second request for the same doctor waits until the first commits or rolls back. The daily count of active bookings is taken under that lock, so two requests cannot both see 11 bookings and both insert. The unique key is a backstop: if it still rejects an insert, the response is 409.

**The 12-per-day cap is enforced in code.** A CHECK constraint cannot count rows, so the cap is checked inside the booking transaction, against the locked count.

**Working hours are enforced in two places.** The schema has a CHECK that the start time falls on a 30-minute boundary between 09:00 and 16:30. The application also checks that the appointment is in the future, because MySQL CHECK constraints cannot use `NOW()`. The last valid start is 16:30, because a slot starting at 17:00 would run past closing.

**Error codes:**
- 400 for malformed input, such as an unreadable date or a negative amount.
- 422 for valid input that breaks a business rule, such as a past time or a start outside working hours.
- 409 for a conflict with existing data, such as a taken slot, a full day, or a cancellation that has already happened.

**Refunds are computed on the server.** The refund percentage comes from the notice given, measured from the moment of cancellation. More than 48 hours gives 100%. Exactly 48 hours, or from 24 up to 48 hours, gives 50%. Less than 24 hours gives 0%. The calculation uses the stored `amount_paid`, never a value from the request. The boundaries are tested in `tests/refundPolicy.test.js`.

**Cancellation and refund succeed or fail together.** The cancelled status, the cancellation time, and the refund amount are written in one transaction, which locks the appointment row first.

**Revenue and statistics.** Revenue is total payments minus total refunds, counting every appointment. Cancelled bookings therefore contribute their payment and their refund, which nets to zero. The busy-day threshold is more than 80% of capacity, which means ten or more bookings out of twelve. Upcoming appointments are counted relative to the moment the request is made. The seven-day window starts today.

### Part D: audit log

Each successful booking, cancellation, and promotion is appended to `logs/audit.log` as one JSON line. The logger uses `fs.promises`, so no request handler blocks on disk. The directory is created with `recursive: true` on the first write and reused after that.

Logging happens after the database commit. A booking that fails is never logged as successful. A logging failure is caught and written to the console, and the request still succeeds.

### Part E: waitlist and worker

**Waitlists are per doctor and per day.** A full slot or a full day both mean the patient is waiting for any opening with that doctor on that day. A per-day list lets a freed slot reach a patient who asked for a different time. The trade-off is that a promoted patient gets the first freed slot that day, not necessarily the time they asked for.

**Cancelling a booking notifies the worker.** The cancel endpoint places a `freed_slot` job on a Redis list. The worker is a separate process, started with `npm run worker`.

**Promotion never loses a patient.** The worker moves the first patient from the waitlist to a processing list in one atomic step, `LMOVE`. It then books the patient:
- If the booking commits, the patient is removed from the processing list and a `waitlist_promoted` line is written to the audit log.
- If the booking fails, both list changes run in one MULTI transaction, which removes the patient from processing and puts them back at the front of the waitlist. A `waitlist_promotion_failed` line is written to the audit log.

**Promoted patients pay the consultation fee.** A patient on the waitlist has not paid, so the worker records the doctor's consultation fee as `amount_paid`.

**Confirmation jobs.** Each successful booking places a `confirmation` job on the queue. The worker records it in the audit log as `booking_confirmed`. No real SMS or email is sent.

## 9. Known limitations

- **A patient whose promotion always fails stays at the head of the list.** For example, a waitlisted patient who is later deleted cannot be booked. Each freed slot that day retries and fails on that patient first, which blocks the others behind them. The fix is a dead-letter list after a set number of attempts. This was out of scope for the assignment.
- **Jobs are not retried if the worker crashes mid-job.** The worker removes a job from the queue before processing it, so a crash during processing loses that job. A production system would use a reliable queue, such as BullMQ with acknowledgements.
- **Times are stored as local clock time.** MySQL stores appointment times as entered. The JSON output converts them to UTC, which can make a time look two hours off in Postman. The stored value is correct.
- **Feedback answers are not stored.** The brief asks for the page and the localization, not for storing responses, and the three-table limit leaves no place to keep them.
