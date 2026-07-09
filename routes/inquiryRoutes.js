import express from "express";
import {
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
} from "../controllers/inquiryController.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// Get all inquiries
router.get("/", adminAuth, getAllInquiries);

// Get single inquiry by ID
router.get("/:id", adminAuth, getInquiryById);

// Update inquiry status
router.patch("/:id/status", adminAuth, updateInquiryStatus);

// Delete inquiry
router.delete("/:id", adminAuth, deleteInquiry);

export default router;
