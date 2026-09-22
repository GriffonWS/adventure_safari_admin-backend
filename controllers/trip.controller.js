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
    const tripData = {
      ...req.body,
      invitedBy: req.user._id
    };
    const trip = await tripService.createTrip(tripData);
    // Not a schema path, so it does not survive serialising the trip — it is
    // returned alongside it instead.
    res.status(201).json({
      message: "Trip created successfully",
      trip,
      invitationResults: trip.invitationResults || null
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
    const trip = await tripService.updateTrip(id, {
      ...req.body,
      invitedBy: req.user._id
    });
    res.status(200).json({
      message: "Trip updated successfully",
      trip,
      invitationResults: trip.invitationResults || null
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

const statusAction = (run, successMessage) => async (req, res) => {
  try {
    const trip = await run(req);
    res.status(200).json({ message: successMessage, trip });
  } catch (error) {
    console.error(`Error: ${successMessage}:`, error);
    const code = error.message === "Trip not found" ? 404 : 400;
    res.status(code).json({ message: error.message || "Error updating trip status" });
  }
};

export const voidTrip = statusAction(
  (req) => tripService.voidTrip(req.params.id, req.body, req.user),
  "Trip voided and moved to the archive"
);

export const archiveTrip = statusAction(
  (req) => tripService.archiveTrip(req.params.id, req.user),
  "Trip archived"
);

export const reactivateTrip = statusAction(
  (req) => tripService.reactivateTrip(req.params.id, req.body, req.user),
  "Trip reactivated"
);
