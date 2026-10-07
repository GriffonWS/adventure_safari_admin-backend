import Inquiry from "../models/Inquiry.js";
import { sendInquiryReplyEmail } from "../nodemailer/email.js";

// Get all inquiries
export const getAllInquiries = async (req, res) => {
  try {
    let inquiries = await Inquiry.find().populate("replies.sentBy", "email").sort({ createdAt: -1 });

    // Ensure all inquiries have a status field (for backward compatibility)
    inquiries = inquiries.map(inquiry => {
      const inquiryObj = inquiry.toObject();
      if (!inquiryObj.status) {
        inquiryObj.status = "new";
      }
      return inquiryObj;
    });

    return res.status(200).json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries.",
    });
  }
};

// Get inquiry by ID
export const getInquiryById = async (req, res) => {
  try {
    let inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    // Ensure status field exists (for backward compatibility)
    const inquiryObj = inquiry.toObject();
    if (!inquiryObj.status) {
      inquiryObj.status = "new";
    }

    return res.status(200).json({
      success: true,
      data: inquiryObj,
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiry.",
    });
  }
};

// Update inquiry status
export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "read", "replied", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: new, read, replied, or closed",
      });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry status updated successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update inquiry.",
    });
  }
};

// Delete inquiry
export const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inquiry:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inquiry.",
    });
  }
};

// Email a reply to the customer and keep it on the inquiry
export const replyToInquiry = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ success: false, message: "Reply message is required" });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    const emailResult = await sendInquiryReplyEmail(inquiry.email, inquiry.name, message, inquiry.query);
    if (!emailResult.success) {
      return res.status(502).json({
        success: false,
        message: "The reply email could not be sent. Please try again.",
      });
    }

    inquiry.replies.push({ message, sentAt: new Date(), sentBy: req.user._id });
    if (inquiry.status !== "closed") inquiry.status = "replied";
    await inquiry.save();
    await inquiry.populate("replies.sentBy", "email");

    return res.status(200).json({ success: true, message: "Reply sent", data: inquiry });
  } catch (error) {
    console.error("Error replying to inquiry:", error.message);
    return res.status(500).json({ success: false, message: "Failed to send reply." });
  }
};
