// A trip can run more than once. The same safari might go out as "Batch 1" in
// June and "Batch 2" in September, and a customer booking it picks which one
// they are travelling on.
//
// Each departure carries its own name and dates. The name is what the customer
// sees when choosing, so it is never blank — an unnamed row becomes "Batch 1",
// "Batch 2" and so on in date order.
//
// A departure keeps a stable `_id` for its whole life, because bookings point
// at it. Editing a trip must not renumber or re-issue those ids, or bookings
// already made would lose the dates they were sold against.

import mongoose from "mongoose";
import { parseTripDate } from "./schedule.js";

export const MAX_DEPARTURES = 24;

// A row the admin left entirely empty — the form submits these when a departure
// is added and then not filled in, and they are dropped rather than refused.
const isBlankRow = (row) =>
  !row ||
  (!String(row.name ?? "").trim() &&
    !String(row.startDate ?? "").trim() &&
    !String(row.endDate ?? "").trim());

// Turns whatever the trip form submitted into a clean departure list, or throws
// with a message written for the admin.
export function normalizeDepartures(input) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    throw new Error("Dates must be a list of departures");
  }

  const rows = input.filter((row) => !isBlankRow(row));
  if (rows.length === 0) return [];
  if (rows.length > MAX_DEPARTURES) {
    throw new Error(`A trip can have at most ${MAX_DEPARTURES} sets of dates`);
  }

  const departures = rows.map((row, index) => {
    const name = String(row.name ?? "").trim();
    // A row with no name yet has nothing to call it in an error message, so it
    // is referred to by where it sits in the form.
    const who = name ? `"${name}"` : `Set of dates ${index + 1}`;

    const startDate = parseTripDate(row.startDate, `Start date for ${who}`);
    const endDate = parseTripDate(row.endDate, `End date for ${who}`);

    // Unlike the trip's own dates, a departure is the thing being booked, so it
    // is meaningless without both ends of it.
    if (!startDate) throw new Error(`${who} needs a start date`);
    if (!endDate) throw new Error(`${who} needs an end date`);
    if (endDate < startDate) {
      throw new Error(`${who} cannot end before it starts`);
    }

    // An id already on the row belongs to a departure that exists and may
    // already have bookings against it, so it is carried through untouched.
    // Anything else is a new departure and Mongoose mints its id on save.
    const existingId = row._id ?? row.id;
    const keepsId =
      existingId && mongoose.Types.ObjectId.isValid(String(existingId));

    return {
      ...(keepsId ? { _id: new mongoose.Types.ObjectId(String(existingId)) } : {}),
      name,
      startDate,
      endDate,
    };
  });

  // Soonest first, which is the order a customer expects to choose from, and
  // the order the names below are handed out in.
  departures.sort((a, b) => a.startDate - b.startDate);

  const taken = new Set();
  for (const departure of departures) {
    if (!departure.name) continue;
    const key = departure.name.toLowerCase();
    if (taken.has(key)) {
      throw new Error(`There is more than one "${departure.name}"`);
    }
    taken.add(key);
  }

  // A departure the admin did not name still needs something the customer can
  // pick it by, so it becomes the next "Batch N" — skipping any number already
  // used by hand, rather than colliding with it.
  let next = 1;
  for (const departure of departures) {
    if (departure.name) continue;
    while (taken.has(`batch ${next}`)) next += 1;
    departure.name = `Batch ${next}`;
    taken.add(`batch ${next}`);
  }

  return departures;
}

// The trip's own startDate/endDate stay as the span covering every departure:
// the earliest start and the latest end. They are derived, never edited
// directly once a trip has departures, so the retire-and-archive timers keep
// working off a single date without knowing about batches at all — and a trip
// only retires once its *last* departure is over.
export function deriveTripDates(departures) {
  if (!departures || departures.length === 0) {
    return { startDate: null, endDate: null };
  }
  return {
    startDate: departures.reduce(
      (earliest, d) => (d.startDate < earliest ? d.startDate : earliest),
      departures[0].startDate
    ),
    endDate: departures.reduce(
      (latest, d) => (d.endDate > latest ? d.endDate : latest),
      departures[0].endDate
    ),
  };
}

// Works out what a trip's dates should be from whatever the form submitted, as
// `{ departures, startDate, endDate }` ready to assign onto the trip.
//
// A form that sends a departure list is the normal path. A form that still
// sends a bare startDate/endDate pair — the shape trips were saved in before
// departures existed — has that pair turned into a single "Batch 1", so a trip
// saved either way ends up stored the same and nothing downstream has to ask
// which era it came from. Sending neither, or clearing both, leaves the trip
// evergreen.
export function buildSchedule({ departures, startDate, endDate } = {}) {
  if (departures !== undefined) {
    const list = normalizeDepartures(departures);
    return { departures: list, ...deriveTripDates(list) };
  }

  const start = parseTripDate(startDate, "Start date") ?? null;
  const end = parseTripDate(endDate, "End date") ?? null;
  if (start && end && end < start) {
    throw new Error("A trip cannot end before it starts");
  }
  if (start && end) {
    const list = normalizeDepartures([{ name: "Batch 1", startDate: start, endDate: end }]);
    return { departures: list, ...deriveTripDates(list) };
  }
  // Half a pair is not a departure, but it is still what the admin typed, so it
  // is kept on the trip the way it always was.
  return { departures: [], startDate: start, endDate: end };
}

// Trips created before departures existed carry a single pair of dates on the
// trip itself. Reading those back as a one-entry list keeps every caller — the
// booking form above all — on one code path.
export function resolveDepartures(trip) {
  if (trip?.departures?.length) {
    return trip.departures.map((departure) => ({
      _id: departure._id,
      name: departure.name,
      startDate: departure.startDate,
      endDate: departure.endDate,
    }));
  }
  if (trip?.startDate && trip?.endDate) {
    return [
      {
        _id: null,
        name: "Batch 1",
        startDate: trip.startDate,
        endDate: trip.endDate,
      },
    ];
  }
  return [];
}

// Which departure a booking is for. A trip that runs once has nothing to choose
// between, so the booking form does not ask and the single departure is taken
// as given. A trip that runs several times must be told, because guessing here
// would sell someone the wrong dates.
export function resolveDepartureForBooking(trip, departureId) {
  const departures = resolveDepartures(trip);
  if (departures.length === 0) return null;

  if (departureId) {
    const chosen = departures.find(
      (departure) => String(departure._id) === String(departureId)
    );
    if (!chosen) {
      throw new Error("That set of dates is not offered on this trip");
    }
    return chosen;
  }

  if (departures.length === 1) return departures[0];

  throw new Error("Choose which dates you are travelling on");
}
