// Backfills per-traveller pricing onto data created before it existed.
//
//   node scripts/backfillTripPricing.js --dry-run   (report only, changes nothing)
//   node scripts/backfillTripPricing.js
//
// Two passes, both idempotent — rerunning skips anything already done:
//
//   Trips    get a single "Standard" traveller type holding their flat price,
//            so every trip reads through the same code path from here on.
//
//   Bookings get the per-traveller snapshot they were always missing, built
//            from the trip price times head count they have been shown all
//            along. The figures do not move; they just stop being recomputed
//            from a trip the admin can still edit.

import mongoose from "mongoose";
import dotenv from "dotenv";
import Trip from "../models/Trip.js";
import Booking from "../models/Booking.js";
import {
  LEGACY_TIER_CODE,
  LEGACY_TIER_LABEL,
  sumGuestPricing,
} from "../utils/pricing.js";

dotenv.config();

const dryRun = process.argv.includes("--dry-run");

const backfillTrips = async () => {
  const trips = await Trip.find({
    $or: [{ pricing: { $exists: false } }, { pricing: { $size: 0 } }],
  });

  let updated = 0;
  for (const trip of trips) {
    const amount = Number(trip.price) || 0;
    if (amount <= 0) {
      console.log(`  ! skipped "${trip.name}" (${trip._id}) — no usable price`);
      continue;
    }

    console.log(`  - "${trip.name}" -> ${LEGACY_TIER_LABEL} $${amount}`);
    if (!dryRun) {
      trip.pricing = [{ code: LEGACY_TIER_CODE, label: LEGACY_TIER_LABEL, amount }];
      await trip.save();
    }
    updated += 1;
  }

  return { scanned: trips.length, updated };
};

const backfillBookings = async () => {
  const bookings = await Booking.find({
    $or: [{ guestPricing: { $exists: false } }, { guestPricing: { $size: 0 } }],
  }).populate("tripId", "name price pricing");

  let updated = 0;
  for (const booking of bookings) {
    const guestIds = booking.guestIds || [];
    if (guestIds.length === 0) {
      console.log(`  ! skipped ${booking.bookingId} — no guests`);
      continue;
    }

    // The trip's own pricing is not consulted here on purpose. A trip repriced
    // since this booking was made would rewrite history; the flat price times
    // head count is the number this booking has always been shown.
    const amount = Number(booking.tripId?.price) || 0;
    if (amount <= 0) {
      console.log(`  ! skipped ${booking.bookingId} — trip has no usable price`);
      continue;
    }

    const guestPricing = guestIds.map((guestId) => ({
      guestId,
      tierCode: LEGACY_TIER_CODE,
      label: LEGACY_TIER_LABEL,
      tripCost: amount,
    }));
    const tripTotal = sumGuestPricing(guestPricing);

    console.log(
      `  - ${booking.bookingId}: ${guestIds.length} x $${amount} = $${tripTotal}`
    );
    if (!dryRun) {
      booking.guestPricing = guestPricing;
      booking.tripTotal = tripTotal;
      await booking.save();
    }
    updated += 1;
  }

  return { scanned: bookings.length, updated };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected${dryRun ? " (dry run — nothing will be written)" : ""}\n`);

  console.log("Trips without traveller types:");
  const trips = await backfillTrips();

  console.log("\nBookings without a per-traveller snapshot:");
  const bookings = await backfillBookings();

  console.log("\n─────────────────────────");
  console.log(`Trips:    ${trips.updated} of ${trips.scanned} updated`);
  console.log(`Bookings: ${bookings.updated} of ${bookings.scanned} updated`);
  if (dryRun) console.log("\nDry run — nothing was written.");

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Backfill failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
