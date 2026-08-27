import Booking from "../models/Booking.js";
import Guest from "../models/Guest.js";
import Admin from "../models/Admin.js";
import { sendPassportRejectedEmail } from "../nodemailer/email.js";

// Get all pending passport approvals
export const getPendingPassports = async (req, res) => {
  try {
    const pendingPassports = await Guest.find({
      "passportApproval.status": "pending",
      passport: { $exists: true, $ne: null }
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const bookings = await Booking.find({
      guestIds: { $in: pendingPassports.map(g => g._id) }
    }).populate("tripId", "name destination endDate");

    const result = pendingPassports.map(guest => {
      const booking = bookings.find(b => b.guestIds.includes(guest._id));
      return {
        guest,
        booking,
        tripName: booking?.tripId?.name || "Unknown Trip",
        tripEndDate: booking?.tripId?.endDate
      };
    });

    res.status(200).json({
      message: "Pending passports retrieved successfully",
      total: result.length,
      data: result
    });
  } catch (error) {
    console.error("Get pending passports error:", error);
    res.status(500).json({ message: "Server error while fetching pending passports" });
  }
};

// Get all approved passport approvals
export const getApprovedPassports = async (req, res) => {
  try {
    const approvedPassports = await Guest.find({
      "passportApproval.status": "approved"
    })
      .populate("userId", "name email")
      .populate("passportApproval.approvedBy", "name email")
      .sort({ "passportApproval.approvedAt": -1 });

    const bookings = await Booking.find({
      guestIds: { $in: approvedPassports.map(g => g._id) }
    }).populate("tripId", "name destination endDate");

    const result = approvedPassports.map(guest => {
      const booking = bookings.find(b => b.guestIds.includes(guest._id));
      return {
        guest,
        booking,
        tripName: booking?.tripId?.name || "Unknown Trip",
        tripEndDate: booking?.tripId?.endDate
      };
    });

    res.status(200).json({
      message: "Approved passports retrieved successfully",
      total: result.length,
      data: result
    });
  } catch (error) {
    console.error("Get approved passports error:", error);
    res.status(500).json({ message: "Server error while fetching approved passports" });
  }
};

// Get all rejected passport approvals
export const getRejectedPassports = async (req, res) => {
  try {
    const rejectedPassports = await Guest.find({
      "passportApproval.status": "rejected"
    })
      .populate("userId", "name email")
      .populate("passportApproval.approvedBy", "name email")
      .sort({ "passportApproval.approvedAt": -1 });

    const bookings = await Booking.find({
      guestIds: { $in: rejectedPassports.map(g => g._id) }
    }).populate("tripId", "name destination endDate");

    const result = rejectedPassports.map(guest => {
      const booking = bookings.find(b => b.guestIds.includes(guest._id));
      return {
        guest,
        booking,
        tripName: booking?.tripId?.name || "Unknown Trip",
        tripEndDate: booking?.tripId?.endDate
      };
    });

    res.status(200).json({
      message: "Rejected passports retrieved successfully",
      total: result.length,
      data: result
    });
  } catch (error) {
    console.error("Get rejected passports error:", error);
    res.status(500).json({ message: "Server error while fetching rejected passports" });
  }
};

// Approve passport
export const approvePassport = async (req, res) => {
  try {
    const { guestId } = req.params;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    // There is nothing to approve until a passport has actually been uploaded.
    // Approving an empty record would mark the traveller as document-verified
    // with no document behind it.
    const existing = await Guest.findById(guestId).select("passport name");
    if (!existing) {
      return res.status(404).json({ message: "Guest not found" });
    }
    if (!existing.passport) {
      return res.status(400).json({
        message: `${existing.name || "This traveller"} has not uploaded a passport yet, so there is nothing to approve.`
      });
    }

    const guest = await Guest.findByIdAndUpdate(
      guestId,
      {
        "passportApproval.status": "approved",
        "passportApproval.approvedBy": adminId,
        "passportApproval.approvedAt": new Date(),
        "passportApproval.rejectionReason": null
      },
      { new: true }
    )
      .populate("userId", "name email")
      .populate("passportApproval.approvedBy", "name email");

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    res.status(200).json({
      message: "Passport approved successfully",
      guest
    });
  } catch (error) {
    console.error("Approve passport error:", error);
    res.status(500).json({ message: "Server error while approving passport" });
  }
};

// Reject passport
export const rejectPassport = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const guest = await Guest.findByIdAndUpdate(
      guestId,
      {
        "passportApproval.status": "rejected",
        "passportApproval.approvedBy": adminId,
        "passportApproval.approvedAt": new Date(),
        "passportApproval.rejectionReason": reason
      },
      { new: true }
    )
      .populate("userId", "name email")
      .populate("passportApproval.approvedBy", "name email");

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    // The customer cannot act on a rejection they never see, so the admin's
    // note is emailed to them. A mail failure is reported but does not undo the
    // rejection — the decision stands and the portal already reflects it.
    let emailed = false;
    const customerEmail = guest.userId?.email;
    if (customerEmail) {
      const booking = await Booking.findOne({ guestIds: guest._id }).select("_id");
      const portalUrl = booking && process.env.CLIENT_URL
        ? `${process.env.CLIENT_URL}/dashboard/${booking._id}/passport-upload`
        : null;

      const result = await sendPassportRejectedEmail(
        customerEmail,
        guest.userId?.name || "there",
        guest.name || "your traveller",
        reason,
        portalUrl
      );
      emailed = result.success;
    }

    res.status(200).json({
      message: emailed
        ? "Passport rejected. The customer has been emailed your note."
        : "Passport rejected, but the notification email could not be sent. Please contact the customer directly.",
      emailed,
      guest
    });
  } catch (error) {
    console.error("Reject passport error:", error);
    res.status(500).json({ message: "Server error while rejecting passport" });
  }
};
