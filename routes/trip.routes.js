import express from "express";
import {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  toggleTripStatus,
  uploadTripImage
} from "../controllers/trip.controller.js";
import {
  getInvitationsForTrip,
  resendInvitation,
  deleteInvitation,
  sendTripInvitations
} from "../controllers/invitation.controller.js";
import adminAuth from "../middleware/auth.js";
import { uploadSingleImage } from "../middleware/documentUpload.js";

const router = express.Router();

// Upload a trip image to Cloudinary, returns the hosted URL
router.post("/upload-image", adminAuth, uploadSingleImage("image"), uploadTripImage);

// Get all trips
router.get("/", adminAuth, getAllTrips);

// Get single trip by ID
router.get("/:id", adminAuth, getTripById);

// Create new trip
router.post("/", adminAuth, createTrip);

// Update trip
router.put("/:id", adminAuth, updateTrip);

// Trips are never deleted — they are deactivated with toggle-status below,
// so bookings that reference a trip always keep a valid trip.

// Toggle trip active status
router.patch("/:id/toggle-status", adminAuth, toggleTripStatus);

// Invitation routes
router.get("/:tripId/invitations", adminAuth, getInvitationsForTrip);
router.post("/invitations/:invitationId/resend", adminAuth, resendInvitation);
router.delete("/invitations/:invitationId", adminAuth, deleteInvitation);
router.post("/:tripId/send-invitations", adminAuth, sendTripInvitations);

export default router;
