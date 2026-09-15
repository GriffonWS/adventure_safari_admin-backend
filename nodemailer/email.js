import createTransporter from './config.js';
import clientUrl from '../config/clientUrl.js';
import { announcementTemplate, passportRejectedTemplate, tripInvitationTemplate } from './email-templates.js';

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

// Send invitation email for custom trip
export const sendTripInvitationEmail = async (email, tripName, invitationToken, wetuLink) => {
  try {
    const transporter = createTransporter();
    const registrationUrl = `${clientUrl}/register?invitation=${invitationToken}`;

    const mailOptions = {
      from: `"Adventure Safari" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You're invited to an exclusive safari trip: ${tripName}`,
      html: tripInvitationTemplate(tripName, registrationUrl, wetuLink),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Trip invitation sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending trip invitation to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Send bulk invitations
export const sendBulkTripInvitations = async (invitations, tripName, wetuLink) => {
  const results = {
    total: invitations.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const inv of invitations) {
    const result = await sendTripInvitationEmail(inv.email, tripName, inv.token, wetuLink);
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
      results.errors.push({ email: inv.email, error: result.error });
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};
