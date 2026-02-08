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
    const { name, destination, price, image, isActive } = tripData;

    // Validate required fields
    if (!name || !destination || !price || !image) {
      throw new Error("Name, destination, price, and image are required");
    }

    const trip = new Trip({
      name,
      destination,
      price,
      image,
      isActive: isActive !== undefined ? isActive : true
    });

    await trip.save();
    return trip;
  }

  // Update trip
  async updateTrip(tripId, updateData) {
    const trip = await Trip.findByIdAndUpdate(
      tripId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!trip) {
      throw new Error("Trip not found");
    }

    return trip;
  }

  // Delete trip
  async deleteTrip(tripId) {
    const trip = await Trip.findByIdAndDelete(tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
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
