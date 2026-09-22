import Trip from "../models/Trip.js";
import { normalizePricingTiers, derivePriceFromTiers } from "../utils/pricing.js";
import { normalizeAssignedUserIds, resolveAssignedUserIds } from "../utils/assignment.js";
import { startOfToday, shouldArchive } from "../utils/schedule.js";
import { buildSchedule } from "../utils/departures.js";
import {
  ensureCustomTripBookings,
  removeEmptyCustomTripBooking,
} from "../utils/customTripBooking.js";
import invitationService from "./invitation.service.js";
import { sendBulkTripInvitations } from "../nodemailer/email.js";

class TripService {
  // Get all trips
  async getAllTrips() {
    return await Trip.find()
      .populate("assignedUserIds", "name email")
      .sort({ createdAt: -1 });
  }

  // Get single trip by ID
  async getTripById(tripId) {
    const trip = await Trip.findById(tripId).populate("assignedUserIds", "name email");
    if (!trip) {
      throw new Error("Trip not found");
    }
    return trip;
  }

  // Create new trip
  async createTrip(tripData) {
    const { name, destination, price, image, wetuLink, isCustom, assignedUserId, assignedUserIds, invitedEmails, pricing, departures, startDate, endDate, invitedBy } = tripData;

    const schedule = buildSchedule({ departures, startDate, endDate });

    // A custom trip is built for one party travelling together, so there is
    // nothing for them to choose between.
    if (isCustom && schedule.departures.length > 1) {
      throw new Error("A custom trip runs once, so it takes a single set of dates");
    }

    // Merge registered users and invited emails
    const assignedIds = normalizeAssignedUserIds(assignedUserIds, assignedUserId);
    const allEmails = invitedEmails ? invitedEmails.filter(e => e.trim()) : [];

    // A trip is priced either as one flat per-person amount or as a list of
    // traveller types. When the list is given it is the source of truth and
    // `price` becomes the cheapest of them, so the catalogue still has a figure.
    const tiers = normalizePricingTiers(pricing);
    const headlinePrice = tiers.length ? derivePriceFromTiers(tiers) : price;
    const hasPrice = Number(headlinePrice) > 0;

    // Validate required fields
    if (!name || !destination || !image) {
      throw new Error("Name, destination, and image are required");
    }

    // A custom trip may be saved before its quote is settled and priced later.
    // A catalogue trip is on sale the moment it exists, so it needs a figure.
    if (!hasPrice && !isCustom) {
      throw new Error("Name, destination, price, and image are required");
    }

    // A custom trip is built for one customer, who then books it themselves
    if (isCustom) {
      if (assignedIds.length === 0 && allEmails.length === 0) {
        throw new Error("A custom trip must be assigned to at least one customer or email");
      }
      if (!wetuLink) {
        throw new Error("A custom trip must have a Wetu link");
      }
    }

    const trip = new Trip({
      name,
      destination,
      price: hasPrice ? headlinePrice : null,
      pricing: tiers,
      image,
      wetuLink: wetuLink || "",
      departures: schedule.departures,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      isCustom: Boolean(isCustom),
      assignedUserIds: isCustom ? assignedIds : [],
      // Mirrors the first customer so anything still reading the old single
      // field keeps working.
      assignedUserId: isCustom ? assignedIds[0] : null,
      status: "active"
    });

    await trip.save();

    if (isCustom && allEmails.length > 0 && invitedBy) {
      const invitationResults = await invitationService.createInvitations(
        allEmails,
        trip._id,
        name,
        invitedBy
      );

      // Send emails for newly invited addresses
      if (invitationResults.invitedEmails.length > 0) {
        await sendBulkTripInvitations(invitationResults.invitedEmails, name, wetuLink);
      }

      // An invited address that already has an account gets no invitation, so
      // it is put straight onto the trip — otherwise the trip stays invisible
      // to the one person the admin meant to send it to.
      const registeredIds = invitationResults.registeredEmails
        .map((entry) => entry?.userId)
        .filter(Boolean)
        .map(String);

      if (registeredIds.length > 0) {
        const merged = normalizeAssignedUserIds([...assignedIds, ...registeredIds]);
        trip.assignedUserIds = merged;
        trip.assignedUserId = merged[0];
        await trip.save();
      }

      trip.invitationResults = invitationResults;
    }

    if (isCustom) {
      await ensureCustomTripBookings(trip, resolveAssignedUserIds(trip));
    }

    return trip;
  }

  // Update trip
  async updateTrip(tripId, updateData) {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Apply the changes to the document and validate on save, which runs the
    // full schema against real values rather than the partial update.
    // isCustom is deliberately not editable here, and status only changes
    // through voidTrip / archiveTrip / reactivateTrip.
    const editableFields = ["name", "destination", "price", "image", "wetuLink"];
    for (const field of editableFields) {
      if (updateData[field] !== undefined) {
        trip[field] = updateData[field];
      }
    }

    // Dates are cleared by sending an empty list, or an empty value for the
    // legacy pair, which puts the trip back to evergreen — it then stays active
    // until deactivated by hand.
    //
    // A departure that survives an edit keeps its id, so bookings already made
    // against it still resolve to the dates they were sold. Removing one does
    // not touch those bookings; they carry their own copy of the dates.
    if (
      updateData.departures !== undefined ||
      updateData.startDate !== undefined ||
      updateData.endDate !== undefined
    ) {
      const schedule = buildSchedule({
        departures: updateData.departures,
        // The legacy pair is only half-submitted on a partial update, so what
        // the form left out falls back to what the trip already has.
        startDate: updateData.startDate !== undefined ? updateData.startDate : trip.startDate,
        endDate: updateData.endDate !== undefined ? updateData.endDate : trip.endDate,
      });
      if (trip.isCustom && schedule.departures.length > 1) {
        throw new Error("A custom trip runs once, so it takes a single set of dates");
      }
      trip.departures = schedule.departures;
      trip.startDate = schedule.startDate;
      trip.endDate = schedule.endDate;
    }

    // The same trip can be sent to another couple later, so who it is assigned
    // to stays editable. Removing a customer only takes the trip out of their
    // list — any booking they already made stands on its own.
    const newEmails = Array.isArray(updateData.invitedEmails)
      ? updateData.invitedEmails.map((email) => String(email || "").trim()).filter(Boolean)
      : [];

    let addedUserIds = [];
    let removedUserIds = [];

    if (updateData.assignedUserIds !== undefined || updateData.assignedUserId !== undefined) {
      if (!trip.isCustom) {
        throw new Error("Only a custom trip can be assigned to customers");
      }
      const assignedIds = normalizeAssignedUserIds(
        updateData.assignedUserIds,
        updateData.assignedUserId
      );

      // A custom trip can go entirely to people who have no account yet, so an
      // empty customer list is only wrong when nothing is invited either.
      if (assignedIds.length === 0 && newEmails.length === 0) {
        const invitations = await invitationService.getInvitationsForTrip(trip._id);
        if (invitations.length === 0) {
          throw new Error("A custom trip must go to at least one customer or email address");
        }
      }

      // Read before the overwrite, so the diff below knows who is new.
      const previousIds = resolveAssignedUserIds(trip);
      addedUserIds = assignedIds.filter((id) => !previousIds.includes(id));
      removedUserIds = previousIds.filter((id) => !assignedIds.includes(id));

      trip.assignedUserIds = assignedIds;
      trip.assignedUserId = assignedIds[0] || null;
    }

    // Editing traveller types repoints the headline price at the cheapest one.
    // Bookings already made keep the amounts they froze, so nothing here can
    // change what an existing traveller was quoted or insured for.
    if (updateData.pricing !== undefined) {
      const tiers = normalizePricingTiers(updateData.pricing);
      trip.pricing = tiers;
      // Clearing every traveller type puts the trip back to unpriced rather
      // than leaving a stale headline figure behind. The schema refuses this
      // for a catalogue trip, which must always carry a price.
      trip.price = tiers.length ? derivePriceFromTiers(tiers) : null;
    }

    await trip.save();

    // The same trip can be sent to someone new later, so invitations are not
    // only a create-time thing.
    if (trip.isCustom && newEmails.length > 0 && updateData.invitedBy) {
      const invitationResults = await invitationService.createInvitations(
        newEmails,
        trip._id,
        trip.name,
        updateData.invitedBy
      );

      if (invitationResults.invitedEmails.length > 0) {
        await sendBulkTripInvitations(invitationResults.invitedEmails, trip.name, trip.wetuLink);
      }

      const registeredIds = invitationResults.registeredEmails
        .map((entry) => entry?.userId)
        .filter(Boolean)
        .map(String);

      if (registeredIds.length > 0) {
        const previousIds = resolveAssignedUserIds(trip);
        const merged = normalizeAssignedUserIds([...previousIds, ...registeredIds]);
        trip.assignedUserIds = merged;
        trip.assignedUserId = merged[0];
        await trip.save();
        addedUserIds = [
          ...addedUserIds,
          ...registeredIds.filter((id) => !previousIds.includes(id)),
        ];
      }

      trip.invitationResults = invitationResults;
    }

    if (addedUserIds.length > 0) {
      await ensureCustomTripBookings(trip, addedUserIds);
    }

    for (const userId of removedUserIds) {
      await removeEmptyCustomTripBooking(trip._id, userId);
    }

    return trip;
  }

  // Trips saved before `status` existed only carry isActive.
  async backfillTripStatus() {
    const [active, inactive] = await Promise.all([
      Trip.updateMany({ status: { $exists: false }, isActive: { $ne: false } }, { $set: { status: "active" } }),
      Trip.updateMany({ status: { $exists: false }, isActive: false }, { $set: { status: "inactive" } }),
    ]);
    return (active.modifiedCount || 0) + (inactive.modifiedCount || 0);
  }

  // Active trips become inactive the day after they end, never on the final day.
  async deactivateFinishedTrips(now = new Date()) {
    const result = await Trip.updateMany(
      {
        status: "active",
        endDate: { $type: "date", $lt: startOfToday(now) },
      },
      {
        $set: { status: "inactive", isActive: false },
        $push: { statusHistory: { action: "completed", from: "active", to: "inactive", at: now } },
      }
    );
    return result.modifiedCount || 0;
  }

  // Inactive trips archive at the end of the month they ended in (see archiveOn).
  async archiveFinishedTrips(now = new Date()) {
    const candidates = await Trip.find(
      {
        status: "inactive",
        isArchived: { $ne: true },
        endDate: { $type: "date", $lt: startOfToday(now) },
      },
      { endDate: 1 }
    ).lean();

    const dueIds = candidates.filter((trip) => shouldArchive(trip, now)).map((trip) => trip._id);
    if (dueIds.length === 0) return 0;

    const result = await Trip.updateMany(
      { _id: { $in: dueIds } },
      {
        $set: { isArchived: true, archivedAt: now },
        $push: { statusHistory: { action: "archived", from: "inactive", to: "inactive", at: now } },
      }
    );
    return result.modifiedCount || 0;
  }

  async voidTrip(tripId, { reason } = {}, admin) {
    const trip = await this.getTripById(tripId);
    if (trip.status === "voided") {
      throw new Error("This trip is already voided");
    }
    const cleanReason = String(reason || "").trim();
    if (!cleanReason) {
      throw new Error("Give a reason for voiding this trip");
    }

    const now = new Date();
    this.#recordChange(trip, "voided", trip.status, "voided", cleanReason, admin, now);
    trip.status = "voided";
    trip.voidedAt = now;
    trip.voidReason = cleanReason;
    trip.isArchived = true;
    trip.archivedAt = now;
    await trip.save();
    return trip;
  }

  // Manual archive, for completed trips the admin does not want to wait on.
  async archiveTrip(tripId, admin) {
    const trip = await this.getTripById(tripId);
    if (trip.isArchived) {
      throw new Error("This trip is already archived");
    }
    if (trip.status !== "inactive") {
      throw new Error("Only an inactive trip can be archived. Void an active trip instead.");
    }

    const now = new Date();
    this.#recordChange(trip, "archived", "inactive", "inactive", "", admin, now);
    trip.isArchived = true;
    trip.archivedAt = now;
    await trip.save();
    return trip;
  }

  // Brings an inactive or voided trip back to active, out of the archive, with
  // new dates. Everything else on the trip (pricing, customers, bookings) is
  // left exactly as it was.
  async reactivateTrip(tripId, { departures, startDate, endDate, reason } = {}, admin) {
    const trip = await this.getTripById(tripId);
    if (trip.status === "active") {
      throw new Error("This trip is already active");
    }

    const hadDates = Boolean(trip.departures?.length || trip.endDate);
    const schedule = buildSchedule({ departures, startDate, endDate });

    if (hadDates && schedule.departures.length === 0) {
      throw new Error("Enter the new dates for this trip");
    }
    if (trip.isCustom && schedule.departures.length > 1) {
      throw new Error("A custom trip runs once, so it takes a single set of dates");
    }
    const today = startOfToday();
    const past = schedule.departures.find((departure) => departure.startDate < today);
    if (past) {
      throw new Error(`"${past.name}" starts before today. An active trip needs dates from today onward.`);
    }

    const from = trip.status;
    this.#recordChange(trip, "reactivated", from, "active", String(reason || "").trim(), admin, new Date());
    trip.departures = schedule.departures;
    trip.startDate = schedule.startDate;
    trip.endDate = schedule.endDate;
    trip.status = "active";
    trip.isArchived = false;
    trip.archivedAt = null;
    trip.voidedAt = null;
    trip.voidReason = "";
    await trip.save();
    return trip;
  }

  #recordChange(trip, action, from, to, reason, admin, at) {
    trip.statusHistory.push({
      action,
      from,
      to,
      reason,
      by: admin?._id || null,
      byEmail: admin?.email || "",
      at,
    });
  }
}

export default new TripService();
