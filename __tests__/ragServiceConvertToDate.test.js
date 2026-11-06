/**
 * The extraction prompts ask the model for dates as YYYY-MM-DD, so that is the
 * main format convertToDate has to read.
 */

import {ragService} from '../src/services/RAGService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@notifee/react-native', () => ({}));
jest.mock('../src/database', () => ({openDB: jest.fn()}));
jest.mock('../src/model/model', () => ({generateRAGResponse: jest.fn()}));
jest.mock('../src/services/NotificationService', () => ({}));

describe('ragService.convertToDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 6, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['2026-12-20', '2026-12-20'],
    ['2027-01-05', '2027-01-05'],
    [' 2026-12-20 ', '2026-12-20'],
    ['2026-12-20T10:00:00', '2026-12-20'],
  ])('keeps the date in %j', (text, expected) => {
    expect(ragService.convertToDate(text)).toBe(expected);
  });

  it.each([
    ['January 12 2027', '2027-01-12'],
    ['January 12, 2027', '2027-01-12'],
    ['December 20', '2026-12-20'],
    ['december 20th', '2026-12-20'],
  ])('reads a month that comes before the day in %j', (text, expected) => {
    expect(ragService.convertToDate(text)).toBe(expected);
  });

  it('does not accept a day that does not exist in the month', () => {
    expect(ragService.convertToDate('2026-02-31')).toBe('2026-11-06');
  });

  it.each([
    ['12 December', '2026-12-12'],
    ['12 December 2027', '2027-12-12'],
    ['today', '2026-11-06'],
    ['tomorrow', '2026-11-07'],
    ['next week', '2026-11-13'],
    ['monday', '2026-11-09'],
    ['something else', '2026-11-06'],
  ])('still reads %j', (text, expected) => {
    expect(ragService.convertToDate(text)).toBe(expected);
  });

  it('finds an appointment by the date the model returns', () => {
    const appointments = [
      {id: 1, appointment_date: '2026-11-06'},
      {id: 2, appointment_date: '2026-12-20'},
    ];

    const matches = ragService.findMatchingAppointments(appointments, {
      type: 'date',
      value: '2026-12-20',
    });

    expect(matches.map(appointment => appointment.id)).toEqual([2]);
  });
});
