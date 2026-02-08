import createTransporter from './config.js';
import { announcementTemplate } from './email-templates.js';

// Send announcement email to a single user
export const sendAnnouncementEmail = async (userEmail, userName, subject, message) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Adventure Safari" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📢 ${subject}`,
      html: announcementTemplate(userName, subject, message),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Announcement sent to ${userEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending announcement to ${userEmail}:`, error);
    return { success: false, error: error.message };
  }
};

// Send announcement to all users
export const sendBulkAnnouncement = async (users, subject, message) => {
  const results = {
    total: users.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const user of users) {
    try {
      const result = await sendAnnouncementEmail(
        user.email,
        user.name,
        subject,
        message
      );

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          email: user.email,
          error: result.error
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: user.email,
        error: error.message
      });
    }
  }

  return results;
};
