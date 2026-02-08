import express from "express";
import {
  sendAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// POST /api/announcements - Send announcement to all users
router.post("/", sendAnnouncement);

// GET /api/announcements - Get all announcements
router.get("/", getAllAnnouncements);

// GET /api/announcements/:id - Get single announcement
router.get("/:id", getAnnouncementById);

// DELETE /api/announcements/:id - Delete announcement
router.delete("/:id", deleteAnnouncement);

export default router;
