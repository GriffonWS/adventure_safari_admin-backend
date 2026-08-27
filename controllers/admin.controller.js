import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Trip from "../models/Trip.js";
import mongoose from "mongoose";
import Guest from "../models/Guest.js";
import { deleteCloudinaryFile } from "../middleware/documentUpload.js";
import { buildGuestPricing, bookingTripTotal } from "../utils/pricing.js";
import { buildBookingReference } from "../utils/reference.js";

// Get all users with booking counts
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "bookings", // MongoDB collection name (lowercase plural)
          localField: "_id",
          foreignField: "userId",
          as: "bookings",
        },
      },
      {
        $addFields: {
          bookingCount: { $size: "$bookings" },
        },
      },
      {
        $project: {
          password: 0,
          verificationToken: 0,
          resetPasswordToken: 0,
          resetPasswordExpires: 0,
          twoFactorSecret: 0,
          twoFactorTempSecret: 0,
          bookings: 0, // Remove the bookings array from output
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by newest first
      },
    ]);

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Get all bookings with user and trip details
export const getAllBookings = async (req, res) => {
  try {
    // Several customers can share one custom trip, each booking separately.
    // Filtering by trip is what pulls those bookings back together.
    const { tripId } = req.query;
    const filter = {};
    if (tripId) {
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      filter.tripId = tripId;
    }

    const bookings = await Booking.find(filter)
      .populate("userId", "name email")
      .populate("tripId", "name destination price pricing")
      .populate("guestIds", "name")
      .sort({ createdAt: -1 }); // Latest bookings first

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(id)
      .populate("userId", "name email phone")
      .populate("tripId", "name destination price pricing")
      .populate("guestIds");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ message: "Error fetching booking" });
  }
};

export const updateAirArrangement = async (req, res) => {
  try {
    const { id } = req.params;
    const { arrangedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    if (!["self", "company"].includes(arrangedBy)) {
      return res.status(400).json({ message: "arrangedBy must be 'self' or 'company'" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.airTravel) {
      booking.airTravel = {};
    }
    booking.airTravel.arrangedBy = arrangedBy;
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("userId", "name email phone")
      .populate("tripId", "name destination price pricing")
      .populate("guestIds");

    res.json({
      message: "Air travel arrangement updated successfully",
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("Error updating air arrangement:", err);
    res.status(500).json({ message: "Error updating air travel arrangement" });
  }
};

export const uploadAirTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No air ticket file uploaded" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.airTravel) {
      booking.airTravel = {};
    }

    const oldPublicId = booking.airTravel.ticketPublicId;
    if (oldPublicId) {
      await deleteCloudinaryFile(oldPublicId);
    }

    booking.airTravel.ticketUrl = req.fileUrl;
    booking.airTravel.ticketPublicId = req.fileId;
    booking.airTravel.uploadedBy = "admin";
    booking.airTravel.uploadedAt = new Date();
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("userId", "name email phone")
      .populate("tripId", "name destination price pricing")
      .populate("guestIds");

    res.json({
      message: "Air ticket uploaded successfully",
      ticketUrl: req.fileUrl,
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("Error uploading air ticket:", err);
    res.status(500).json({ message: "Error uploading air ticket" });
  }
};

// Create new booking (admin can create booking for any user)
export const createBooking = async (req, res) => {
  try {
    const { userId, tripId, guests, travelDate } = req.body;

    // Validate required fields
    if (!userId || !tripId || !guests || !travelDate) {
      return res.status(400).json({
        message: "userId, tripId, guests, and travelDate are required",
      });
    }

    // Validate guests array
    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({
        message: "At least one guest is required",
      });
    }

    // Validate each guest has required fields
    for (let guest of guests) {
      if (!guest.name || !guest.age || !guest.passport) {
        return res.status(400).json({
          message: "Each guest must have name, age, and passport",
        });
      }
    }

    const bookingDate = new Date(travelDate);
    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({ message: "Invalid travel date" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!trip.isActive) {
      return res.status(400).json({ message: "Trip is not available" });
    }

    // Travellers are stored as Guest documents, the same as a booking the
    // customer makes themselves, so every later screen reads one shape.
    const createdGuests = await Guest.insertMany(
      guests.map((guest) => ({
        userId,
        name: String(guest.name).trim(),
        age: Number(guest.age),
        passport: guest.passport,
      }))
    );

    // Freeze what each traveller is being charged. This snapshot is the trip
    // cost their insurance is declared against, so it is stored on the booking
    // rather than read back off the trip, which may later be repriced.
    let guestPricing;
    let tripTotal;
    try {
      ({ guestPricing, tripTotal } = buildGuestPricing(
        trip,
        createdGuests.map((created, i) => ({
          guestId: created._id,
          name: created.name,
          age: created.age,
          tierCode: guests[i]?.tierCode,
        }))
      ));
    } catch (pricingError) {
      // The guests just created would otherwise be left orphaned on a failure.
      await Guest.deleteMany({ _id: { $in: createdGuests.map((g) => g._id) } });
      return res.status(400).json({ message: pricingError.message });
    }

    // Catalogue and custom trips are referenced identically — one generator,
    // no branch on isCustom.
    const bookingReference = buildBookingReference(trip, bookingDate);

    // Create booking
    const booking = new Booking({
      userId,
      tripId,
      bookingId: bookingReference,
      guestIds: createdGuests.map((g) => g._id),
      guestPricing,
      tripTotal,
      bookingDate,
    });

    await booking.save();

    // Populate the booking before sending response
    await booking.populate("userId", "name email");
    await booking.populate("tripId", "name destination price pricing");
    await booking.populate("guestIds");

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ message: "Error creating booking" });
  }
};

// admin.controller.js
// Add this function to your existing controller
export const getAllTrips = async (req, res) => {
  try {
    // Assuming you have a Trip model
    const trips = await Trip.find({}).select("name destination price pricing duration"); // Adjust fields as needed
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all pending guest approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const Guest = mongoose.model("Guest");
    // Return every status so the Pending / Approved / Rejected tabs can be filtered client-side
    const guests = await Guest.find({
      "passportApproval.status": { $in: ["pending", "approved", "rejected"] }
    })
      .populate("userId", "name email")
      .populate("passportApproval.approvedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(guests);
  } catch (err) {
    console.error("Error fetching pending approvals:", err);
    res.status(500).json({ message: "Error fetching pending approvals" });
  }
};

// Approve guest passport details
export const approveGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const Guest = mongoose.model("Guest");

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      return res.status(400).json({ message: "Invalid guest ID" });
    }

    // Nothing to approve until a passport has been uploaded — the same rule the
    // passport approval screen enforces.
    const existing = await Guest.findById(guestId).select("passport name");
    if (!existing) {
      return res.status(404).json({ message: "Guest not found" });
    }
    if (!existing.passport) {
      return res.status(400).json({
        message: `${existing.name || "This traveller"} has not uploaded a passport yet, so there is nothing to approve.`
      });
    }

    // Update only the approval fields so unrelated legacy data on the guest
    // document cannot fail validation and block the approval
    const guest = await Guest.findByIdAndUpdate(
      guestId,
      {
        $set: {
          passportApproval: {
            status: "approved",
            approvedBy: req.user?.id || req.adminId,
            rejectionReason: undefined,
            approvedAt: new Date()
          }
        }
      },
      { new: true, runValidators: false }
    );

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    res.json({
      message: "Guest approved successfully",
      guest
    });
  } catch (err) {
    console.error("Error approving guest:", err);
    res.status(500).json({ message: err.message || "Error approving guest" });
  }
};

// Reject guest passport details
export const rejectGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { reason } = req.body;
    const Guest = mongoose.model("Guest");

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      return res.status(400).json({ message: "Invalid guest ID" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    // Update only the approval fields so unrelated legacy data on the guest
    // document cannot fail validation and block the rejection
    const guest = await Guest.findByIdAndUpdate(
      guestId,
      {
        $set: {
          passportApproval: {
            status: "rejected",
            rejectionReason: reason.trim(),
            approvedBy: req.user?.id || req.adminId,
            approvedAt: new Date()
          }
        }
      },
      { new: true, runValidators: false }
    );

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    res.json({
      message: "Guest rejected successfully",
      guest
    });
  } catch (err) {
    console.error("Error rejecting guest:", err);
    res.status(500).json({ message: err.message || "Error rejecting guest" });
  }
};

export const setInstallmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { installments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(id).populate("tripId", "price");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const existing = booking.finalPayment?.installments || [];
    const paid = existing.filter((i) => i.status === "paid");

    if (!Array.isArray(installments) || installments.length === 0) {
      if (paid.length > 0) {
        return res.status(400).json({
          message: "Cannot remove the plan once an installment has been paid",
        });
      }
      booking.finalPayment = { installmentsEnabled: false, installments: [] };
      await booking.save();
      const cleared = await Booking.findById(id)
        .populate("userId", "name email phone")
        .populate("tripId", "name destination price pricing")
        .populate("guestIds");
      return res.json({ message: "Installment plan removed", booking: cleared });
    }

    // Incoming rows describe the unpaid part of the plan; paid ones are untouchable
    const newCount = paid.length + installments.length;

    if (newCount > 4) {
      return res.status(400).json({ message: "A maximum of 4 installments is allowed" });
    }
    if (paid.length > 0 && newCount < existing.length) {
      return res.status(400).json({
        message: `A payment has already been made, so the plan cannot drop below ${existing.length} installments`,
      });
    }

    // The booking's own frozen trip cost, so repricing the trip afterwards can
    // never invalidate a plan the customer has already agreed to.
    const totalAmount = bookingTripTotal(booking);
    const paidSum = paid.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const outstanding = Number((totalAmount - paidSum).toFixed(2));
    const parsed = [];

    for (const item of installments) {
      const amount = Number(item.amount);
      const dueDate = new Date(item.dueDate);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: "Each installment needs an amount greater than 0" });
      }
      if (Number.isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: "Each installment needs a valid due date" });
      }
      parsed.push({ amount, dueDate });
    }

    const sum = parsed.reduce((acc, i) => acc + i.amount, 0);
    if (Math.abs(sum - outstanding) > 0.01) {
      return res.status(400).json({
        message: `Remaining installments must add up to ${outstanding.toFixed(2)}`,
      });
    }

    parsed.push(
      ...paid.map((i) => ({
        amount: i.amount,
        dueDate: i.dueDate,
        status: "paid",
        transactionId: i.transactionId,
        paidAt: i.paidAt,
        payerEmail: i.payerEmail,
        payerName: i.payerName,
      }))
    );
    parsed.sort((a, b) => a.dueDate - b.dueDate);

    booking.finalPayment = {
      installmentsEnabled: true,
      totalAmount,
      installments: parsed,
    };
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("userId", "name email phone")
      .populate("tripId", "name destination price pricing")
      .populate("guestIds");

    res.json({ message: "Installment plan saved", booking: updatedBooking });
  } catch (err) {
    console.error("Error saving installment plan:", err);
    res.status(500).json({ message: "Error saving installment plan" });
  }
};

export const updateTravelKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { travelKey } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { travelKey: typeof travelKey === "string" ? travelKey.trim() : "" },
      { new: true }
    )
      .populate("userId", "name email phone")
      .populate("tripId", "name destination price pricing")
      .populate("guestIds");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Travel key updated", booking });
  } catch (err) {
    console.error("Error updating travel key:", err);
    res.status(500).json({ message: "Error updating travel key" });
  }
};
