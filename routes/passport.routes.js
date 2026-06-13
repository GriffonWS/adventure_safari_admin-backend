import express from "express";
import {
  getPendingPassports,
  getApprovedPassports,
  getRejectedPassports,
  approvePassport,
  rejectPassport
} from "../controllers/passportController.js";
import { verifyAdminToken } from "../middleware/auth.js";

const router = express.Router();

// Get pending, approved, and rejected passports
router.get("/pending", verifyAdminToken, getPendingPassports);
router.get("/approved", verifyAdminToken, getApprovedPassports);
router.get("/rejected", verifyAdminToken, getRejectedPassports);

// Approve and reject passports
router.put("/approve/:guestId", verifyAdminToken, approvePassport);
router.put("/reject/:guestId", verifyAdminToken, rejectPassport);

export default router;
