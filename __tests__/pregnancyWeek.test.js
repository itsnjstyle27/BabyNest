/**
 * The Home screen and the assistant both show the current week of pregnancy, so
 * they have to agree on it.
 */

import {clearAllAgentContexts, getAgentContext} from '../src/storage/agent';

const USER_ID = 1;
const DAYS_IN_PREGNANCY = 280;

let mockProfile;

const rows = items => ({rows: {_array: items}});

const mockDb = {
  execute: jest.fn(async sql =>
    sql.includes('FROM profile') ? rows([mockProfile]) : rows([]),
  ),
};

jest.mock('../src/database', () => ({
  openDB: jest.fn(async () => mockDb),
}));

// The due date of someone who is this many days into the pregnancy today.
const dueDateAfter = daysElapsed => {
  const dueDate = new Date(2026, 10, 6 + DAYS_IN_PREGNANCY - daysElapsed);
  const month = String(dueDate.getMonth() + 1).padStart(2, '0');
  const day = String(dueDate.getDate()).padStart(2, '0');
  return `${dueDate.getFullYear()}-${month}-${day}`;
};

const currentWeekInContext = async daysElapsed => {
  mockProfile = {id: USER_ID, dueDate: dueDateAfter(daysElapsed)};
  const response = await getAgentContext(USER_ID);
  return response.data.current_week;
};

describe('current week in the assistant context', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 6, 12));
    clearAllAgentContexts();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    [70, 10],
    [71, 10],
    [76, 10],
    [77, 11],
    [139, 19],
    [273, 39],
    [280, 40],
  ])('after %d days it is week %d', async (daysElapsed, week) => {
    expect(await currentWeekInContext(daysElapsed)).toBe(week);
  });

  it('stays between week 1 and week 40', async () => {
    expect(await currentWeekInContext(3)).toBe(1);
    clearAllAgentContexts();
    expect(await currentWeekInContext(300)).toBe(40);
  });
});
