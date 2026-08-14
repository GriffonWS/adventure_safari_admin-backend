import Trip from "../models/Trip.js";

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
    const { name, destination, price, image, wetuLink, isActive, isCustom, assignedUserId } = tripData;

    // Validate required fields
    if (!name || !destination || !price || !image) {
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
      price,
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
