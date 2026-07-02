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
  rejectGuest
} from "../controllers/admin.controller.js";
import adminAuth from "../middleware/auth.js";
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

export default router;
