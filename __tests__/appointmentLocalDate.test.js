/**
 * An appointment is saved on the calendar day the user picked, also when that
 * time falls on another day in UTC.
 */

import {formatLocalDate} from '../src/utils/formatLocalDate';

// Jest keeps the timezone the process started in, so these dates give their
// local day directly, to run the same way on any machine.
const dateWithLocalDay = (utcTime, year, month, day) =>
  Object.assign(new Date(utcTime), {
    getFullYear: () => year,
    getMonth: () => month,
    getDate: () => day,
  });

describe('formatLocalDate', () => {
  it('keeps the local day of an evening in New York, already the next day in UTC', () => {
    // 20:00 on 5 November in New York
    const date = dateWithLocalDay(Date.UTC(2026, 10, 6, 1, 0), 2026, 10, 5);

    expect(date.toISOString().split('T')[0]).toBe('2026-11-06');
    expect(formatLocalDate(date)).toBe('2026-11-05');
  });

  it('keeps the local day of an early morning in India, still the previous day in UTC', () => {
    // 03:00 on 5 November in India
    const date = dateWithLocalDay(Date.UTC(2026, 10, 4, 21, 30), 2026, 10, 5);

    expect(date.toISOString().split('T')[0]).toBe('2026-11-04');
    expect(formatLocalDate(date)).toBe('2026-11-05');
  });

  it('pads the month and the day', () => {
    expect(formatLocalDate(new Date(2026, 0, 2, 12, 0))).toBe('2026-01-02');
  });
});
