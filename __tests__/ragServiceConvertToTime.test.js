import {ragService} from '../src/services/RAGService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@notifee/react-native', () => ({}));
jest.mock('../src/database', () => ({openDB: jest.fn()}));
jest.mock('../src/model/model', () => ({generateRAGResponse: jest.fn()}));
jest.mock('../src/services/NotificationService', () => ({}));

describe('ragService.convertToTime', () => {
  it.each([
    ['3 in the afternoon', '15:00'],
    ['4:30 in the afternoon', '16:30'],
    ['12 in the afternoon', '12:00'],
    ['8 in the evening', '20:00'],
    ['10 at night', '22:00'],
    ['12 at night', '00:00'],
    ['1 at night', '01:00'],
    ['10:30 in the morning', '10:30'],
    ['12 in the morning', '00:00'],
  ])('uses the number in %j', (text, expected) => {
    expect(ragService.convertToTime(text)).toBe(expected);
  });

  it.each([
    ['noon', '12:00'],
    ['at noon', '12:00'],
    ['12 noon', '12:00'],
    ['midnight', '00:00'],
    ['12 midnight', '00:00'],
  ])('reads %j', (text, expected) => {
    expect(ragService.convertToTime(text)).toBe(expected);
  });

  it.each([
    ['15:00 in the afternoon', '15:00'],
    ['14:30 pm', '14:30'],
  ])('does not add 12 hours to the 24-hour time in %j', (text, expected) => {
    expect(ragService.convertToTime(text)).toBe(expected);
  });

  it.each([
    ['morning', '09:00'],
    ['afternoon', '14:00'],
    ['evening', '18:00'],
    ['night', '20:00'],
    ['tonight', '20:00'],
    ['2pm', '14:00'],
    ['2 pm', '14:00'],
    ['12am', '00:00'],
    ['12pm', '12:00'],
    ['9:05 am', '09:05'],
    ['14:00', '14:00'],
    ['TBD', '09:00'],
    ['whenever', '09:00'],
    [null, '09:00'],
  ])('still reads %j', (text, expected) => {
    expect(ragService.convertToTime(text)).toBe(expected);
  });
});
