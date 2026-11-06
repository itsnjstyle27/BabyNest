const DAYS_IN_PREGNANCY = 280;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * The current week of pregnancy, counted in full weeks since the start of the
 * pregnancy and kept between 1 and 40.
 * @param {string} dueDate The due date as YYYY-MM-DD
 * @param {Date} now The current time
 * @returns {number} The week, or NaN when the due date can't be read
 */
export function getPregnancyWeek(dueDate, now = new Date()) {
  const start = new Date(`${dueDate}T00:00:00`);
  start.setDate(start.getDate() - DAYS_IN_PREGNANCY);

  const week = Math.floor((now - start) / MS_PER_WEEK);

  return Math.min(Math.max(week, 1), 40);
}
