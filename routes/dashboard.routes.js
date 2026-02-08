import express from "express";
import {
  getDashboardStats,
  getUserGrowthData,
  getWeeklyBookingsData
} from "../controllers/dashboard.controller.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// Get all dashboard statistics (cards + charts data)
router.get("/stats", adminAuth, getDashboardStats);

// Get user growth chart data
router.get("/user-growth", adminAuth, getUserGrowthData);

// Get weekly bookings chart data
router.get("/weekly-bookings", adminAuth, getWeeklyBookingsData);

export default router;
