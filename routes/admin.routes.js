// admin.route.js
import express from "express";
import {
  createBooking,
  getAllBookings,
  getAllUsers,
  getAllTrips,
  getBookingById, // Add this import
} from "../controllers/admin.controller.js";
import adminAuth from "../middleware/auth.js";
const router = express.Router();

router.get("/all-users", adminAuth, getAllUsers);
router.get("/get-all-bookings", adminAuth, getAllBookings);
router.get("/get-booking/:id", adminAuth, getBookingById);
router.get("/get-all-trips", adminAuth, getAllTrips); // Add this route
router.post("/create-booking", adminAuth, createBooking);

export default router;
