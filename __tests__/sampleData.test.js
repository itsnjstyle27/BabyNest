/**
 * The schema used to insert sample tasks, weight, medicine and symptom rows
 * for user_id 1. The first profile also gets id 1, so these tests check that
 * new databases are created without them and that databases created by an
 * earlier version remove them once.
 */

import {REMOVE_SAMPLE_DATA, SCHEMA} from '../src/database/schema';

let mockVersion;
let mockFailOn;
let mockStatements;

const mockDb = {
  execute: jest.fn(async sql => {
    mockStatements.push(sql);
    if (mockFailOn && sql === mockFailOn) {
      throw new Error('disk I/O error');
    }
    if (sql.includes('PRAGMA user_version;')) {
      return {rows: {_array: [{user_version: mockVersion}]}};
    }
    return {rows: {_array: []}};
  }),
};

jest.mock('react-native-nitro-sqlite', () => ({
  open: jest.fn(() => mockDb),
}));

// openDB keeps the connection in module state, so load a fresh copy per test.
function loadOpenDB() {
  let openDB;
  jest.isolateModules(() => {
    ({openDB} = require('../src/database'));
  });
  return openDB;
}

beforeEach(() => {
  mockVersion = 0;
  mockFailOn = null;
  mockStatements = [];
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sample data', () => {
  it('is not inserted by the schema', () => {
    for (const statement of SCHEMA) {
      expect(statement).not.toMatch(/INSERT\s+INTO/i);
    }
  });

  it('is not removed from a new database, which never had it', async () => {
    await loadOpenDB()();

    for (const statement of SCHEMA) {
      expect(mockStatements).toContain(statement);
    }
    for (const statement of REMOVE_SAMPLE_DATA) {
      expect(mockStatements).not.toContain(statement);
    }
    expect(mockStatements).toContain('PRAGMA user_version = 2;');
  });

  it('is removed from a version 1 database in one transaction', async () => {
    mockVersion = 1;

    await loadOpenDB()();

    expect(mockStatements).toEqual([
      'PRAGMA user_version;',
      'BEGIN TRANSACTION',
      ...REMOVE_SAMPLE_DATA,
      'PRAGMA user_version = 2;',
      'COMMIT',
    ]);
  });

  it('is only removed once', async () => {
    mockVersion = 2;

    await loadOpenDB()();

    expect(mockStatements).toEqual(['PRAGMA user_version;']);
  });

  it('is removed again on the next launch when removing it fails', async () => {
    mockVersion = 1;
    mockFailOn = REMOVE_SAMPLE_DATA[2];

    const db = await loadOpenDB()();

    expect(db).toBe(mockDb);
    expect(mockStatements).toContain('ROLLBACK');
    expect(mockStatements).not.toContain('PRAGMA user_version = 2;');
    expect(mockStatements).not.toContain('COMMIT');
  });

  it('only removes rows that belong to user_id 1', () => {
    for (const statement of REMOVE_SAMPLE_DATA) {
      expect(statement).toMatch(/^\s*DELETE FROM \w+\s+WHERE user_id = 1\b/);
    }
  });
});
