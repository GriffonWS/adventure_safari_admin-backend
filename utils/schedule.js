// A trip is over once its end date has passed, and is retired the day after —
// never on the final day itself, so a safari finishing today is not pulled out
// from under the people currently on it.
//
// A trip with no end date is evergreen and never retires on its own; it is
// deactivated by hand, the way every trip always could be.

// Midnight at the start of today, in UTC.
//
// UTC rather than the server's own timezone because that is how trip dates are
// stored — see parseTripDate below. Comparing a UTC-midnight end date against
// local midnight retired a trip on its final day on any server west of
// Greenwich, which is exactly what the note at the top says must not happen.
export function startOfToday(now = new Date()) {
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
}

// True once the trip's end date falls on an earlier day than today.
export function hasTripEnded(trip, now = new Date()) {
  if (!trip?.endDate) return false;
  return new Date(trip.endDate) < startOfToday(now);
}

// Normalises a date coming off the trip form. Blank clears the date.
//
// A trip date is a calendar date, not a moment: "3 June" is 3 June to everyone
// looking at it, wherever they are. It is pinned to midnight UTC and must be
// read back the same way — see formatTripDate in the front ends. Storing local
// midnight instead is what made a 1 June departure show as 31 May to anyone
// west of Greenwich.
export function parseTripDate(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  // The form sends YYYY-MM-DD. Building the date from its parts keeps the day
  // the admin typed, rather than letting the server's own timezone shift it.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (dateOnly) {
    const [, year, month, day] = dateOnly.map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new Error(`${field} is not a valid date`);
    }
    return parsed;
  }

  // Anything else — a full timestamp from an older client — is accepted, then
  // flattened to the calendar day it falls on so every trip date is stored the
  // same way.
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} is not a valid date`);
  }
  return new Date(Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate()
  ));
}

// A completed trip is archived at the end of the month it ended in, but never
// before it has become inactive (the day after it ends):
//   ends Jan 1  -> archived Jan 31
//   ends Jan 30 -> inactive Jan 31, archived Jan 31
//   ends Jan 31 -> inactive Feb 1, archived Feb 1
export function archiveOn(trip) {
  if (!trip?.endDate) return null;
  const end = new Date(trip.endDate);
  const lastDayOfMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0));
  const dayAfterEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1));
  return lastDayOfMonth > dayAfterEnd ? lastDayOfMonth : dayAfterEnd;
}

// A trip with no end date never archives on its own.
export function shouldArchive(trip, now = new Date()) {
  const on = archiveOn(trip);
  return on ? startOfToday(now) >= on : false;
}
