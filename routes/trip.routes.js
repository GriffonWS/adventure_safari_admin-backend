import express from "express";
import {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  toggleTripStatus
} from "../controllers/trip.controller.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// Get all trips
router.get("/", adminAuth, getAllTrips);

// Get single trip by ID
router.get("/:id", adminAuth, getTripById);

// Create new trip
router.post("/", adminAuth, createTrip);

// Update trip
router.put("/:id", adminAuth, updateTrip);

// Delete trip
router.delete("/:id", adminAuth, deleteTrip);

// Toggle trip active status
router.patch("/:id/toggle-status", adminAuth, toggleTripStatus);

export default router;
