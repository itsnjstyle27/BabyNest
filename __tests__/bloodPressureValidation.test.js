/**
 * A blood pressure log is checked before it is saved. The values come from text
 * inputs, and Number('') is 0, so a cleared field has to be rejected as well.
 */

import {addBPLog, updateBPLog} from '../src/storage/bloodPressure';

const USER_ID = 1;

const rows = items => ({rows: {_array: items}});

const mockDb = {
  execute: jest.fn(async sql => {
    if (sql.includes('FROM profile')) {
      return rows([{id: USER_ID}]);
    }
    if (sql.includes('SELECT') && sql.includes('blood_pressure_logs')) {
      return rows([
        {
          id: 5,
          week_number: 20,
          systolic: 120,
          diastolic: 80,
          time: '09:00',
          note: '',
        },
      ]);
    }
    return {rowsAffected: 1, insertId: 6};
  }),
};

jest.mock('../src/database', () => ({
  openDB: jest.fn(async () => mockDb),
}));

const valid = {week_number: 20, systolic: 120, diastolic: 80, time: '09:00'};

const savedQueries = () =>
  mockDb.execute.mock.calls.filter(([sql]) =>
    /INSERT INTO blood_pressure_logs|UPDATE blood_pressure_logs/.test(sql),
  );

const invalidValues = [
  [{week_number: 0}, 'INVALID_WEEK_NUMBER'],
  [{week_number: -5}, 'INVALID_WEEK_NUMBER'],
  [{week_number: 41}, 'INVALID_WEEK_NUMBER'],
  [{week_number: 'abc'}, 'INVALID_WEEK_NUMBER'],
  [{week_number: ''}, 'INVALID_WEEK_NUMBER'],
  [{systolic: 0}, 'INVALID_SYSTOLIC'],
  [{systolic: -120}, 'INVALID_SYSTOLIC'],
  [{systolic: ''}, 'INVALID_SYSTOLIC'],
  [{systolic: '  '}, 'INVALID_SYSTOLIC'],
  [{systolic: 'abc'}, 'INVALID_SYSTOLIC'],
  [{diastolic: 0}, 'INVALID_DIASTOLIC'],
  [{diastolic: -80}, 'INVALID_DIASTOLIC'],
  [{diastolic: ''}, 'INVALID_DIASTOLIC'],
];

beforeEach(() => {
  mockDb.execute.mockClear();
});

describe('addBPLog', () => {
  it.each(invalidValues)('rejects %j', async (values, code) => {
    const response = await addBPLog(USER_ID, {...valid, ...values});

    expect(response.success).toBe(false);
    expect(response.error.code).toBe(code);
    expect(savedQueries()).toHaveLength(0);
  });

  it.each([[{}], [{week_number: 1}], [{week_number: 40}], [{systolic: '118'}]])(
    'saves %j',
    async values => {
      const response = await addBPLog(USER_ID, {...valid, ...values});

      expect(response.success).toBe(true);
      expect(savedQueries()).toHaveLength(1);
    },
  );
});

describe('updateBPLog', () => {
  it.each(invalidValues)('rejects %j', async (values, code) => {
    const response = await updateBPLog(USER_ID, 5, values);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe(code);
    expect(savedQueries()).toHaveLength(0);
  });

  it('keeps the saved values for the fields that are not sent', async () => {
    const response = await updateBPLog(USER_ID, 5, {systolic: '118'});

    expect(response.success).toBe(true);
    expect(savedQueries()[0][1].slice(0, 3)).toEqual([20, 118, 80]);
  });
});
