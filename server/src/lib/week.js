// Weeks run Monday 00:00 to Sunday 23:59 in America/Chicago (see docs/api.md).
export const TIME_ZONE = 'America/Chicago';
const DAY_MS = 86_400_000;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
});
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function zonedParts(date) {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
    dayIndex: WEEKDAYS.indexOf(p.weekday),
  };
}

/** Milliseconds Chicago is ahead of UTC at this instant (negative: -5h or -6h). */
function offsetMs(date) {
  const p = zonedParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant of a Chicago wall-clock time. */
function zonedTime(year, month, day, hour = 0, minute = 0) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes handle the DST change between the guess and the answer.
  let t = guess - offsetMs(new Date(guess));
  t = guess - offsetMs(new Date(t));
  return new Date(t);
}

/** 0 = Monday … 6 = Sunday, in Chicago time. */
export function dayIndex(date) {
  return zonedParts(date).dayIndex;
}

/** Monday 00:00 Chicago time of the week that contains `date`. */
export function startOfWeek(date = new Date()) {
  const p = zonedParts(date);
  // Step back to Monday on the calendar (UTC math on the date only, so no DST issues).
  const monday = new Date(Date.UTC(p.year, p.month - 1, p.day) - p.dayIndex * DAY_MS);
  return zonedTime(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
}

/** [start, end) of the week containing `date`; end is next Monday 00:00. */
export function weekRange(date = new Date()) {
  const start = startOfWeek(date);
  const end = startOfWeek(new Date(start.getTime() + 8 * DAY_MS));
  return { start, end };
}

/** A Chicago wall-clock time on day `dayOffset` (0 = Monday) of the week starting at `weekStart`. */
export function timeInWeek(weekStart, dayOffset, hour, minute = 0) {
  const p = zonedParts(new Date(weekStart.getTime() + dayOffset * DAY_MS + 12 * 3_600_000));
  return zonedTime(p.year, p.month, p.day, hour, minute);
}
