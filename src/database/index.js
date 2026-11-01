import {open} from 'react-native-nitro-sqlite';
import {REMOVE_SAMPLE_DATA, SCHEMA} from './schema';

const DATABASE_NAME = 'babynest.db';

// Version 2 stopped seeding sample rows for user_id 1.
const DATABASE_VERSION = 2;

let db = null;

export async function openDB() {
  // If already opened, return the same connection
  if (db) {
    return db;
  }

  // Open existing database or create a new one
  db = open({name: DATABASE_NAME});

  // Check whether database initialization has already happened
  const result = await db.execute(`PRAGMA user_version;`);

  const version = result.rows?._array?.[0]?.user_version ?? 0;

  // First-time database setup
  if (version === 0) {
    console.log('VERSION IS 0 → STARTING SCHEMA');

    for (let i = 0; i < SCHEMA.length; i++) {
      console.log(`Executing schema ${i}`);

      try {
        await db.execute(SCHEMA[i]);
        console.log(`Schema ${i} SUCCESS`);
      } catch (error) {
        console.error(`Schema ${i} FAILED`);
        console.error('SQL:', SCHEMA[i]);
        console.error('ERROR:', error);
        throw error;
      }
    }

    console.log('SCHEMA FINISHED');
    await db.execute(`PRAGMA user_version = ${DATABASE_VERSION};`);
    console.log(`VERSION SET TO ${DATABASE_VERSION}`);
  } else if (version === 1) {
    await removeSampleData();
  }

  return db;
}

async function removeSampleData() {
  try {
    await db.execute('BEGIN TRANSACTION');
    for (const statement of REMOVE_SAMPLE_DATA) {
      await db.execute(statement);
    }
    await db.execute(`PRAGMA user_version = ${DATABASE_VERSION};`);
    await db.execute('COMMIT');
  } catch (error) {
    // Keep version 1 so the cleanup runs again on the next launch. The app
    // still works with the sample rows, so do not fail opening the database.
    console.error('Removing sample data failed:', error);
    try {
      await db.execute('ROLLBACK');
    } catch {
      // BEGIN failed, so there is no transaction to roll back.
    }
  }
}
