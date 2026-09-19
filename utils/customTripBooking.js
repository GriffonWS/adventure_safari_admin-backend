import Booking from "../models/Booking.js";
import { buildBookingReference } from "./reference.js";

// A custom trip is assigned and booked in one act: the booking exists from the
// moment the customer is put on the trip, and they fill in their guests later.
export async function ensureCustomTripBooking(trip, userId) {
  const existing = await Booking.findOne({ tripId: trip._id, userId });
  if (existing) return existing;

  const booking = new Booking({
    tripId: trip._id,
    userId,
    bookingId: buildBookingReference(trip, new Date()),
    guestIds: [],
    // Never priced here: a custom trip may still be awaiting its quote.
    guestPricing: [],
    tripTotal: 0,
  });

  await booking.save();
  return booking;
}

export async function ensureCustomTripBookings(trip, userIds = []) {
  const bookings = [];
  for (const userId of userIds) {
    bookings.push(await ensureCustomTripBooking(trip, userId));
  }
  return bookings;
}

// Only an untouched booking goes. Once guests are on it, it stands on its own.
export async function removeEmptyCustomTripBooking(tripId, userId) {
  const result = await Booking.deleteOne({
    tripId,
    userId,
    guestIds: { $size: 0 },
  });
  return result.deletedCount > 0;
}
