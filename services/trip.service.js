import Trip from "../models/Trip.js";
import { normalizePricingTiers, derivePriceFromTiers } from "../utils/pricing.js";

class TripService {
  // Get all trips
  async getAllTrips() {
    return await Trip.find().sort({ createdAt: -1 });
  }

  // Get single trip by ID
  async getTripById(tripId) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    return trip;
  }

  // Create new trip
  async createTrip(tripData) {
    const { name, destination, price, image, wetuLink, isActive, isCustom, assignedUserId, pricing } = tripData;

    // A trip is priced either as one flat per-person amount or as a list of
    // traveller types. When the list is given it is the source of truth and
    // `price` becomes the cheapest of them, so the catalogue still has a figure.
    const tiers = normalizePricingTiers(pricing);
    const headlinePrice = tiers.length ? derivePriceFromTiers(tiers) : price;

    // Validate required fields
    if (!name || !destination || !headlinePrice || !image) {
      throw new Error("Name, destination, price, and image are required");
    }

    // A custom trip is built for one customer, who then books it themselves
    // with their own travel date and travellers.
    if (isCustom) {
      if (!assignedUserId) {
        throw new Error("A custom trip must be assigned to a customer");
      }
      if (!wetuLink) {
        throw new Error("A custom trip must have a Wetu link");
      }
    }

    const trip = new Trip({
      name,
      destination,
      price: headlinePrice,
      pricing: tiers,
      image,
      wetuLink: wetuLink || "",
      isCustom: Boolean(isCustom),
      assignedUserId: isCustom ? assignedUserId : null,
      isActive: isActive !== undefined ? isActive : true
    });

    await trip.save();
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
    // isCustom and assignedUserId are deliberately not editable here.
    const editableFields = ["name", "destination", "price", "image", "wetuLink", "isActive"];
    for (const field of editableFields) {
      if (updateData[field] !== undefined) {
        trip[field] = updateData[field];
      }
    }

    // Editing traveller types repoints the headline price at the cheapest one.
    // Bookings already made keep the amounts they froze, so nothing here can
    // change what an existing traveller was quoted or insured for.
    if (updateData.pricing !== undefined) {
      const tiers = normalizePricingTiers(updateData.pricing);
      trip.pricing = tiers;
      if (tiers.length) {
        trip.price = derivePriceFromTiers(tiers);
      }
    }

    await trip.save();
    return trip;
  }

  // Toggle trip active status
  async toggleTripStatus(tripId) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }

    trip.isActive = !trip.isActive;
    await trip.save();
    return trip;
  }
}

export default new TripService();
