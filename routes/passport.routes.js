import express from "express";
import {
  getPendingPassports,
  getApprovedPassports,
  getRejectedPassports,
  approvePassport,
  rejectPassport
} from "../controllers/passportController.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// Get pending, approved, and rejected passports
router.get("/pending", adminAuth, getPendingPassports);
router.get("/approved", adminAuth, getApprovedPassports);
router.get("/rejected", adminAuth, getRejectedPassports);

// Approve and reject passports
router.put("/approve/:guestId", adminAuth, approvePassport);
router.put("/reject/:guestId", adminAuth, rejectPassport);

export default router;
