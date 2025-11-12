# Email Verification Setup Guide

## Prerequisites

You need to install the `nodemailer` package to send verification emails.

## Installation Steps

### 1. Install nodemailer

Run this command in your terminal:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Set Up Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** > **2-Step Verification** (enable if not already enabled)
3. Scroll down to **App passwords**
4. Click **Select app** → Choose "Mail"
5. Click **Select device** → Choose "Other (Custom name)" → Enter "TaskMate AI"
6. Click **Generate**
7. Copy the 16-character password (remove spaces)

### 3. Update .env.local

Add these environment variables to your `.env.local` file:

```env
# Email Configuration (for verification emails)
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

Replace:
- `your-gmail-address@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the App Password you generated

### 4. Restart Development Server

After updating `.env.local`, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then start again
npm run dev
```

## How It Works

1. User enters email on signup page
2. Click "Send Verification Code" button
3. System sends 6-digit code to their email
4. User enters the code
5. System verifies the code
6. If valid, registration completes

## Security Notes

- Verification codes expire after 10 minutes
- Each email can only have one active code at a time
- App passwords are more secure than using your actual Gmail password
- Never commit your `.env.local` file to Git (it's already in .gitignore)

## Troubleshooting

**"Failed to send verification code"**
- Check if EMAIL_USER and EMAIL_APP_PASSWORD are set correctly
- Verify 2-Step Verification is enabled on your Google account
- Make sure you're using an App Password, not your regular password

**"Invalid verification code"**
- Code may have expired (10-minute limit)
- User may have typed it incorrectly
- Request a new code

**"Less secure app access" error**
- Use App Passwords instead (recommended method above)
- Do NOT enable "Less secure app access" - it's deprecated and insecure
