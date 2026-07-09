import express from "express";
import {
  getColorSettings,
  updateColorSettings,
  toggleColorAvailability,
} from "../controllers/colorSettingsController.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// Get all color settings
router.get("/", getColorSettings);

// Update color settings (admin only)
router.put("/", adminAuth, updateColorSettings);

// Toggle specific color availability (admin only)
router.patch("/:colorName/toggle", adminAuth, toggleColorAvailability);

export default router;
