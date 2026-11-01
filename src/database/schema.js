export const SCHEMA = [
  // ─────────────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL DEFAULT 'Guest',
        lmp TEXT NOT NULL,
        cycleLength INTEGER NOT NULL,
        periodLength INTEGER NOT NULL,
        age INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        user_location TEXT NOT NULL,
        dueDate TEXT
      );
    `,

  // ─────────────────────────────────────────────
  // APPOINTMENTS
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        appointment_location TEXT NOT NULL,
        appointment_status TEXT
          CHECK(appointment_status IN ('pending', 'completed'))
          DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES profile(id)
      );
    `,

  // ─────────────────────────────────────────────
  // TASKS
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        starting_week INTEGER NOT NULL,
        ending_week INTEGER NOT NULL DEFAULT 0,
        task_priority TEXT
          CHECK(task_priority IN ('low', 'medium', 'high'))
          DEFAULT 'low',
        isOptional BOOLEAN NOT NULL DEFAULT FALSE,
        isAppointmentMade BOOLEAN DEFAULT FALSE,
        task_status TEXT
          CHECK(task_status IN ('pending', 'completed'))
          DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES profile(id)
      );
    `,

  // ─────────────────────────────────────────────
  // BLOOD PRESSURE LOGS
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS blood_pressure_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_number INTEGER NOT NULL,
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        time TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profile(id)
      );
    `,

  // ─────────────────────────────────────────────
  // DISCHARGE LOGS
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS discharge_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_number INTEGER NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL,
        bleeding TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profile(id)
      );
    `,

  // ─────────────────────────────────────────────
  // WEEKLY WEIGHT
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS weekly_weight (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_number INTEGER NOT NULL,
        weight REAL NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profile(id)
      );
    `,

  // ─────────────────────────────────────────────
  // WEEKLY MEDICINE
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS weekly_medicine (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        dose TEXT NOT NULL,
        time TEXT NOT NULL,
        taken BOOLEAN DEFAULT 0,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profile(id)
      );
    `,

  // ─────────────────────────────────────────────
  // WEEKLY SYMPTOMS
  // ─────────────────────────────────────────────
  `
      CREATE TABLE IF NOT EXISTS weekly_symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_number INTEGER NOT NULL,
        symptom TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profile(id)
      );
    `,

];

// Databases created before version 2 were seeded with sample rows for
// user_id 1. The first profile also gets id 1, so that user saw every default
// task twice and sample weight, medicine and symptom entries next to their own.
// These statements remove the sample rows and keep anything the user changed.
export const REMOVE_SAMPLE_DATA = [
  // The 18 sample tasks were inserted right after the table was created, so
  // they have ids 1 to 18. createProfile adds its own copy of each one.
  // Remove a sample task when there is no profile 1, or when it is untouched
  // and the user has their own copy.
  `
      DELETE FROM tasks
      WHERE user_id = 1
        AND id <= 18
        AND (
          NOT EXISTS (SELECT 1 FROM profile WHERE id = 1)
          OR (
            task_status = 'pending'
            AND isAppointmentMade = 0
            AND EXISTS (
              SELECT 1 FROM tasks AS copy
              WHERE copy.user_id = 1
                AND copy.id > 18
                AND copy.title = tasks.title
            )
          )
        );
    `,

  // A sample task that is still there was completed or turned into an
  // appointment, so remove the user's untouched copy of it instead.
  `
      DELETE FROM tasks
      WHERE user_id = 1
        AND id > 18
        AND task_status = 'pending'
        AND isAppointmentMade = 0
        AND EXISTS (
          SELECT 1 FROM tasks AS sample
          WHERE sample.user_id = 1
            AND sample.id <= 18
            AND sample.title = tasks.title
        );
    `,

  `
      DELETE FROM weekly_weight
      WHERE user_id = 1
        AND (
          (week_number = 8 AND weight = 60.5
            AND note = 'Slight nausea, but overall feeling okay')
          OR (week_number = 9 AND weight = 60.9
            AND note = 'Appetite increasing slightly')
          OR (week_number = 10 AND weight = 61.3
            AND note = 'Started prenatal yoga, feeling good')
        );
    `,

  `
      DELETE FROM weekly_medicine
      WHERE user_id = 1
        AND (
          (week_number = 8 AND name = 'Prenatal Vitamin'
            AND note = 'Daily multivitamin with folic acid')
          OR (week_number = 9 AND name = 'Iron Supplement'
            AND note = 'Taking to help with mild anemia')
          OR (week_number = 10 AND name = 'Prenatal Vitamin'
            AND note = 'No side effects, continuing as normal')
        );
    `,

  `
      DELETE FROM weekly_symptoms
      WHERE user_id = 1
        AND (
          (week_number = 8 AND symptom = 'Morning Sickness'
            AND note = 'Worse after waking up')
          OR (week_number = 9 AND symptom = 'Breast Tenderness'
            AND note = 'More sensitive than last week')
          OR (week_number = 10 AND symptom = 'Frequent Urination'
            AND note = 'Especially during the night')
        );
    `,
];
