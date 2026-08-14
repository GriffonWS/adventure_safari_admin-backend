import tripService from "../services/trip.service.js";

// Get all trips
export const getAllTrips = async (req, res) => {
  try {
    const trips = await tripService.getAllTrips();
    res.status(200).json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: error.message || "Error fetching trips" });
  }
};

// Get single trip
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripService.getTripById(id);
    res.status(200).json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(404).json({ message: error.message || "Trip not found" });
  }
};

// Create new trip
export const createTrip = async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.body);
    res.status(201).json({
      message: "Trip created successfully",
      trip
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(400).json({ message: error.message || "Error creating trip" });
  }
};

// Update trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripService.updateTrip(id, req.body);
    res.status(200).json({
      message: "Trip updated successfully",
      trip
    });
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(400).json({ message: error.message || "Error updating trip" });
  }
};

// Trips are never deleted, only deactivated — see toggleTripStatus below.

// Upload a trip image to Cloudinary and hand back the hosted URL.
// The form uploads first, then submits the trip with the returned URL.
export const uploadTripImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl: req.fileUrl,
      publicId: req.fileId,
    });
  } catch (error) {
    console.error("Error uploading trip image:", error);
    res.status(500).json({ message: error.message || "Error uploading trip image" });
  }
};

// Toggle trip status
export const toggleTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripService.toggleTripStatus(id);
    res.status(200).json({
      message: "Trip status updated successfully",
      trip
    });
  } catch (error) {
    console.error("Error toggling trip status:", error);
    res.status(404).json({ message: error.message || "Error updating trip status" });
  }
};
