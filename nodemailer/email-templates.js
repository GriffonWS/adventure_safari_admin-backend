// Email template for announcements
export const announcementTemplate = (userName, subject, message) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #fbaf3f;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #473d34;
          margin-bottom: 10px;
        }
        .announcement-badge {
          display: inline-block;
          background-color: #fbaf3f;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 10px;
        }
        h1 {
          color: #473d34;
          font-size: 24px;
          margin-top: 0;
        }
        .greeting {
          font-size: 16px;
          color: #666;
          margin-bottom: 20px;
        }
        .message-content {
          background-color: #f9f5f2;
          padding: 25px;
          border-left: 4px solid #fbaf3f;
          border-radius: 5px;
          margin: 25px 0;
          white-space: pre-wrap;
          line-height: 1.8;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e6e1db;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        .footer p {
          margin: 5px 0;
        }
        .contact-info {
          margin-top: 20px;
          padding: 15px;
          background-color: #f7f4f1;
          border-radius: 5px;
          text-align: center;
        }
        .contact-info p {
          margin: 5px 0;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🦁 Adventure Safari</div>
          <div class="announcement-badge">📢 ANNOUNCEMENT</div>
        </div>

        <div class="greeting">
          Hello <strong>${userName}</strong>,
        </div>

        <h1>${subject}</h1>

        <div class="message-content">
          ${message}
        </div>

        <div class="contact-info">
          <p><strong>Need Help?</strong></p>
          <p>Contact us at: <a href="mailto:${process.env.EMAIL_USER || 'support@adventuresafari.com'}" style="color: #fbaf3f; text-decoration: none;">${process.env.EMAIL_USER || 'support@adventuresafari.com'}</a></p>
        </div>

        <div class="footer">
          <p><strong>Adventure Safari</strong></p>
          <p>Your Gateway to Wild Adventures</p>
          <p style="margin-top: 15px; color: #bbb;">
            This is an automated announcement from Adventure Safari. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Sent when an admin rejects an uploaded passport. The admin's note is the
// whole point of the email — the traveller cannot fix the problem without it,
// so it is given its own panel rather than buried in a paragraph.
export const passportRejectedTemplate = (customerName, guestName, reason, portalUrl) => {
  const safe = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Passport needs to be re-uploaded</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f2f2f2;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#473d34;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">

        <div style="background-color:#256000;padding:24px 30px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">
            Action needed: passport re-upload
          </h1>
        </div>

        <div style="padding:30px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            Hi ${safe(customerName)},
          </p>

          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
            We've reviewed the passport uploaded for
            <strong>${safe(guestName)}</strong> and it can't be accepted as it is.
            Here's what our team noted:
          </p>

          <div style="border-left:4px solid #f7741d;background-color:#fff2e8;padding:16px 18px;margin:0 0 24px;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#473d34;white-space:pre-wrap;">${safe(reason)}</p>
          </div>

          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
            Please upload a new copy of the passport in your booking portal. This
            replacement won't count against your usual one-time update limit.
          </p>

          ${
            portalUrl
              ? `<p style="margin:0 0 28px;">
                   <a href="${safe(portalUrl)}"
                      style="display:inline-block;background-color:#f7741d;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;font-size:15px;">
                     Upload a new passport
                   </a>
                 </p>`
              : ""
          }

          <p style="margin:0;font-size:14px;line-height:1.6;color:#5a4d42;">
            If you think this is a mistake, or you're not sure what's needed,
            just reply to this email and we'll help.
          </p>
        </div>

        <div style="background-color:#dce3ea;padding:18px 30px;">
          <p style="margin:0;font-size:12px;color:#5a666e;">
            Adventure Safari Network
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
};

// Invitation email for unregistered customers
export const tripInvitationTemplate = (tripName, registrationUrl, wetuLink) => {
  const safe = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // The itinerary is shown as a button reading "Itinerary", never as the bare
  // Wetu URL — that address tells the customer nothing and reads as spam.
  const itineraryUrl = /^https?:\/\//i.test(String(wetuLink ?? "").trim())
    ? String(wetuLink).trim()
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to a custom trip!</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background-color: #2d6a3e;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 15px;
        }
        .trip-info {
          font-size: 15px;
          color: #555;
          margin: 15px 0;
          line-height: 1.6;
        }
        .cta-section {
          margin: 25px 0;
          text-align: center;
        }
        .cta-button {
          display: inline-block;
          background-color: #2d6a3e;
          color: white !important;
          text-decoration: none !important;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
        }
        .itinerary-button {
          display: inline-block;
          background-color: #f0f8f4;
          color: #2d6a3e !important;
          text-decoration: none !important;
          border: 2px solid #2d6a3e;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
        }
        .note-box {
          background-color: #f0f8f4;
          border-left: 4px solid #2d6a3e;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
          color: #333;
          line-height: 1.6;
        }
        .footer {
          background-color: #fafafa;
          padding: 20px 30px;
          border-top: 1px solid #e6e1db;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🦁</div>
          <h1>You're invited to an exclusive trip!</h1>
        </div>

        <div class="content">
          <div class="greeting">
            Hello,
          </div>

          <div class="trip-info">
            You've been invited to book a custom safari trip: <strong>${safe(tripName)}</strong>
          </div>

          <div class="trip-info">
            This exclusive trip has been created specifically for you. Register on our platform to view the full itinerary and proceed with your booking.
          </div>

          ${
            itineraryUrl
              ? `<div class="cta-section">
                  <a href="${safe(itineraryUrl)}" class="itinerary-button" style="color: #2d6a3e !important; text-decoration: none !important; display: inline-block; background-color: #f0f8f4; border: 2px solid #2d6a3e; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
                    📋 Itinerary
                  </a>
                </div>`
              : ""
          }

          <div class="cta-section">
            <a href="${safe(registrationUrl)}" class="cta-button" style="color: white !important; text-decoration: none !important; display: inline-block; background-color: #2d6a3e; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
              Register & View Trip
            </a>
          </div>

          <div class="note-box">
            <strong>⏰ Expires in 30 days</strong> — Register now to get immediate access to this trip and start your booking.
          </div>

          <div class="trip-info">
            Questions? Contact our team for any assistance with registration or trip details.
          </div>

          <div class="trip-info">
            <strong>Can't click the link?</strong><br>
            Copy and paste this URL: <span style="word-break: break-all; color: #555;">${safe(registrationUrl)}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Adventure Safari</strong></p>
          <p>Your Gateway to Wild Adventures</p>
          <p style="margin-top: 10px;">This is an invitation email. If sent in error, you can ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
