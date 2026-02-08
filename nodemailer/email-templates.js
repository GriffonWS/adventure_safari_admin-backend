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
