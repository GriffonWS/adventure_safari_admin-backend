import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    recipientCount: {
      type: Number,
      default: 0
    },
    successfulCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'sending', 'completed', 'failed'],
      default: 'pending'
    },
    errors: [{
      email: String,
      error: String
    }]
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Announcement", announcementSchema);
