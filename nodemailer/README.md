# Nodemailer Setup for Adventure Safari

## Overview
This folder contains the email configuration and templates for sending announcements to all users in the Adventure Safari system.

## Files

### 1. `config.js`
- Nodemailer transporter configuration
- Uses Gmail SMTP service
- Credentials stored in .env file

### 2. `email-templates.js`
- HTML email template for announcements
- Branded with Adventure Safari theme
- Responsive design

### 3. `email.js`
- Email sending functions
- `sendAnnouncementEmail()` - Send to single user
- `sendBulkAnnouncement()` - Send to all users with rate limiting

## Setup Instructions

### 1. Gmail App Password Setup
Since you're using Gmail, you need to create an App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification (if not already enabled)
4. Go to "App passwords" (https://myaccount.google.com/apppasswords)
5. Select "Mail" and "Other (Custom name)"
6. Name it "Adventure Safari Backend"
7. Click "Generate"
8. Copy the 16-character password

### 2. Update .env File
Add these variables to your `.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

**Important:** Never commit the .env file to version control!

## API Endpoints

### Send Announcement
**POST** `/api/announcements`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "subject": "Important Update",
  "message": "This is an important announcement for all users."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement sent successfully",
  "data": {
    "announcementId": "...",
    "totalRecipients": 150,
    "successful": 148,
    "failed": 2,
    "errors": [
      {
        "email": "invalid@example.com",
        "error": "Invalid email address"
      }
    ]
  }
}
```

### Get All Announcements
**GET** `/api/announcements`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

### Get Single Announcement
**GET** `/api/announcements/:id`

### Delete Announcement
**DELETE** `/api/announcements/:id`

## Database Model

The `Announcement` model stores:
- `subject` - Email subject
- `message` - Email body
- `sentBy` - Admin who sent it
- `recipientCount` - Total users
- `successfulCount` - Successfully sent
- `failedCount` - Failed sends
- `status` - pending/sending/completed/failed
- `errors` - Array of failed emails with reasons
- `createdAt` / `updatedAt` - Timestamps

## Features

✅ Send announcements to all users in database
✅ Beautiful HTML email template
✅ Track sent/failed emails
✅ Store announcement history
✅ Rate limiting to avoid spam flags
✅ Admin authentication required
✅ Error handling and logging

## Testing

You can test the email system using tools like:
- Postman
- Thunder Client (VS Code extension)
- cURL

Example cURL request:
```bash
curl -X POST http://localhost:5000/api/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "subject": "Test Announcement",
    "message": "This is a test message."
  }'
```

## Troubleshooting

### Email not sending?
1. Check if EMAIL_USER and EMAIL_PASSWORD are set in .env
2. Verify Gmail App Password is correct
3. Check Gmail account hasn't blocked the app
4. Look at server logs for specific errors

### Rate Limiting?
Gmail has sending limits:
- 500 emails per day for free accounts
- 2000 emails per day for Google Workspace

The code includes a 100ms delay between emails to avoid rate limiting.

## Security Notes

- Never expose EMAIL_PASSWORD in client-side code
- Always use App Passwords, never your actual Gmail password
- All announcement routes require admin authentication
- Emails are sent asynchronously to avoid blocking
