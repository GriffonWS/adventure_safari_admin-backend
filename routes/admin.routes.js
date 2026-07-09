// admin.route.js
import express from "express";
import {
  createBooking,
  getAllBookings,
  getAllUsers,
  getAllTrips,
  getBookingById,
  getPendingApprovals,
  approveGuest,
  rejectGuest,
  updateAirArrangement,
  uploadAirTicket
} from "../controllers/admin.controller.js";
import adminAuth from "../middleware/auth.js";
import { uploadSingleDocument } from "../middleware/documentUpload.js";
const router = express.Router();

router.get("/all-users", adminAuth, getAllUsers);
router.get("/get-all-bookings", adminAuth, getAllBookings);
router.get("/get-booking/:id", adminAuth, getBookingById);
router.get("/get-all-trips", adminAuth, getAllTrips);
router.post("/create-booking", adminAuth, createBooking);

// Guest Approval Routes
router.get("/pending-approvals", adminAuth, getPendingApprovals);
router.put("/approve-guest/:guestId", adminAuth, approveGuest);
router.put("/reject-guest/:guestId", adminAuth, rejectGuest);

router.put("/air-arrangement/:id", adminAuth, updateAirArrangement);
router.put("/upload-air-ticket/:id", adminAuth, uploadSingleDocument("airTicket"), uploadAirTicket);

export default router;
