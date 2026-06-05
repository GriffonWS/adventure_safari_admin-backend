import express from "express";
import {
  getDashboardStats,
  getUserGrowthData,
  getWeeklyBookingsData,
  getUsersLast30Days,
  getBookingsLast30Days
} from "../controllers/dashboard.controller.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// Get all dashboard statistics (cards + charts data)
router.get("/stats", adminAuth, getDashboardStats);

// Get user growth chart data
router.get("/user-growth", adminAuth, getUserGrowthData);

// Get weekly bookings chart data
router.get("/weekly-bookings", adminAuth, getWeeklyBookingsData);

// Get users registered in last 30 days
router.get("/users-last-30-days", adminAuth, getUsersLast30Days);

// Get bookings from last 30 days
router.get("/bookings-last-30-days", adminAuth, getBookingsLast30Days);

export default router;
