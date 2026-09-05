import mongoose from "mongoose";
import crypto from "crypto";

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    tripName: {
      type: String,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    invitationToken: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index to find pending invitations by email and tripId for deduplication
invitationSchema.index({ email: 1, tripId: 1, status: 1 });
// Index to find invitations by token
invitationSchema.index({ invitationToken: 1 });
// TTL index to automatically delete expired invitations after 30 days
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate a unique token
invitationSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

// Instance method to check if invitation is expired
invitationSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

export default mongoose.model("Invitation", invitationSchema);
