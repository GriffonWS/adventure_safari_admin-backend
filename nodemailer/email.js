import createTransporter from './config.js';
import { announcementTemplate, passportRejectedTemplate } from './email-templates.js';

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

// Tells the customer their passport was rejected, and why. A failure here must
// never roll back the rejection itself — the admin's decision stands either
// way, so the caller is told whether the email got out.
export const sendPassportRejectedEmail = async (customerEmail, customerName, guestName, reason, portalUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Adventure Safari" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Action needed: passport for ${guestName} must be re-uploaded`,
      html: passportRejectedTemplate(customerName, guestName, reason, portalUrl),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Passport rejection sent to ${customerEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending passport rejection to ${customerEmail}:`, error);
    return { success: false, error: error.message };
  }
};
