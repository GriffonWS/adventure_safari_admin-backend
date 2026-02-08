import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { sendBulkAnnouncement } from '../nodemailer/email.js';

// Send announcement to all users
export const sendAnnouncement = async (req, res) => {
  try {
    const { subject, message } = req.body;

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    if (subject.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subject cannot be empty'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Get all users
    const users = await User.find({}, 'name email');

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found in the database'
      });
    }

    // Create announcement record
    const announcement = new Announcement({
      subject: subject.trim(),
      message: message.trim(),
      sentBy: req.user._id, // Admin auth middleware sets req.user
      recipientCount: users.length,
      status: 'sending'
    });

    await announcement.save();

    // Send emails to all users
    const results = await sendBulkAnnouncement(users, subject.trim(), message.trim());

    // Update announcement record with results
    announcement.successfulCount = results.successful;
    announcement.failedCount = results.failed;
    announcement.errors = results.errors;
    announcement.status = results.failed === 0 ? 'completed' : 'completed';

    await announcement.save();

    return res.status(200).json({
      success: true,
      message: 'Announcement sent successfully',
      data: {
        announcementId: announcement._id,
        totalRecipients: results.total,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error('Error sending announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message
    });
  }
};

// Get all announcements
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

// Get single announcement by ID
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
      .populate('sentBy', 'name email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error.message
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message
    });
  }
};
