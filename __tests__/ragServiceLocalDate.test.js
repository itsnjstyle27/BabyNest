/**
 * "Today" in the assistant is the user's calendar day, not the day in UTC.
 * The tests stand in for a phone in India, where 20:00 UTC on 5 November is
 * already 6 November. Jest keeps the timezone the process started in, so the
 * local day comes from a mock.
 */

import {ragService} from '../src/services/RAGService';

const mockIndiaOffsetMs = 5.5 * 60 * 60 * 1000;

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@notifee/react-native', () => ({}));
jest.mock('../src/database', () => ({openDB: jest.fn()}));
jest.mock('../src/model/model', () => ({generateRAGResponse: jest.fn()}));
jest.mock('../src/services/NotificationService', () => ({}));
jest.mock('../src/utils/formatLocalDate', () => ({
  formatLocalDate: date =>
    new Date(date.getTime() + mockIndiaOffsetMs).toISOString().slice(0, 10),
}));

const findByRelativeDay = (appointments, value) =>
  ragService.findMatchingAppointments(appointments, {type: 'relative', value});

describe('ragService local dates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-05T20:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['appointment', () => ragService.getAppointmentExtractionPrompt()],
    ['update appointment', () => ragService.getUpdateAppointmentExtractionPrompt()],
    ['data', () => ragService.getDataExtractionPrompt()],
  ])('gives the %s prompt the local date', (_name, getPrompt) => {
    const prompt = getPrompt();

    expect(prompt).toContain('2026-11-06');
    expect(prompt).not.toContain('2026-11-05');
  });

  it('defaults a missing date to the local date', () => {
    expect(ragService.convertToDate('TBD')).toBe('2026-11-06');
  });

  it('matches "today" and "tomorrow" by the local date', () => {
    const onUtcToday = {appointment_date: '2026-11-05'};
    const onLocalToday = {appointment_date: '2026-11-06'};
    const onLocalTomorrow = {appointment_date: '2026-11-07'};
    const appointments = [onUtcToday, onLocalToday, onLocalTomorrow];

    expect(findByRelativeDay(appointments, 'today')).toEqual([onLocalToday]);
    expect(findByRelativeDay(appointments, 'tomorrow')).toEqual([onLocalTomorrow]);
  });

  it('matches a weekday by the calendar date of the appointment', () => {
    jest.useRealTimers();
    // 8 November 2026 is a Sunday
    const appointment = {appointment_date: '2026-11-08'};

    expect(
      ragService.findMatchingAppointments([appointment], {type: 'day', value: 'Sunday'}),
    ).toEqual([appointment]);
  });
});
