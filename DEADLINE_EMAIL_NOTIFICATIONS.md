# Deadline Email Notifications Setup

## Overview
The system now includes automatic email notifications for tasks with approaching deadlines. Users receive both in-app notifications and email reminders when a task is due within 24 hours.

## How It Works

### 1. **Cron Job**
- Runs every 6 hours automatically on Vercel
- Checks all tasks with deadlines in the next 24 hours
- Sends email notifications to task owners
- Creates in-app notifications

### 2. **Email Content**
Beautiful HTML emails include:
- Task title and description
- Priority level with color coding (🔴 High, 🟡 Medium, 🔵 Low)
- Time remaining until deadline
- Due date and time
- Direct link to dashboard
- Professional branding

### 3. **Schedule**
- **Frequency**: Every 6 hours (can be adjusted)
- **Check Window**: Tasks due within next 24 hours
- **Status Filter**: Only tasks that are NOT completed

## Configuration

### Environment Variables
Already configured in `.env.local`:
```env
EMAIL_USER=kurtangeloespiritu022@gmail.com
EMAIL_APP_PASSWORD=egifargpivprxqsz
CRON_SECRET=your-secure-cron-secret-key-change-this-in-production
```

### Vercel Deployment
The `vercel.json` file is configured with:
```json
"crons": [
  {
    "path": "/api/cron/check-deadlines",
    "schedule": "0 */6 * * *"
  }
]
```

**Schedule Format**: `0 */6 * * *` means:
- `0` - At minute 0
- `*/6` - Every 6 hours
- `* * *` - Every day, month, day of week

### Changing the Schedule
To modify when emails are sent, update the cron schedule in `vercel.json`:
- `0 */4 * * *` - Every 4 hours
- `0 8,12,16,20 * * *` - At 8am, 12pm, 4pm, 8pm
- `0 9 * * *` - Once daily at 9am

## API Endpoint

### `/api/cron/check-deadlines` (GET)
- **Auth**: Requires `Bearer ${CRON_SECRET}` header
- **Response**: Statistics about emails sent

Example response:
```json
{
  "success": true,
  "message": "Deadline check completed",
  "stats": {
    "tasksChecked": 5,
    "emailsSent": 5,
    "notificationsCreated": 5
  }
}
```

## Testing Locally

To test the cron job manually:

1. **Install dependencies** (already done):
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

2. **Test the endpoint**:
   ```bash
   curl http://localhost:3000/api/cron/check-deadlines \
     -H "Authorization: Bearer your-secure-cron-secret-key-change-this-in-production"
   ```

3. **Or use Postman/Insomnia**:
   - Method: GET
   - URL: `http://localhost:3000/api/cron/check-deadlines`
   - Header: `Authorization: Bearer your-secure-cron-secret-key-change-this-in-production`

## Email Service Details

### Provider
- Using **Gmail SMTP**
- Service: `gmail`
- Port: 587 (TLS)

### Gmail App Password
Your app password is already configured. If you need to regenerate:
1. Go to Google Account Settings
2. Security → 2-Step Verification → App passwords
3. Generate new password for "Mail"
4. Update `EMAIL_APP_PASSWORD` in `.env.local`

## Features

### What Gets Notified
✅ Tasks with deadlines within 24 hours  
✅ Tasks that are NOT completed (status !== 'done')  
✅ Tasks with valid user email addresses

### What Gets Sent
✅ Styled HTML email with task details  
✅ In-app notification  
✅ Priority color coding  
✅ Time until deadline  
✅ Link to dashboard

### Error Handling
- Continues processing even if individual emails fail
- Logs all errors to console
- Returns error summary in response

## Production Deployment

### Vercel Setup
1. **Add Environment Variables** in Vercel Dashboard:
   - `EMAIL_USER`
   - `EMAIL_APP_PASSWORD`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add deadline email notifications"
   git push
   ```

3. **Verify Cron Job**:
   - Go to Vercel Dashboard
   - Project → Settings → Crons
   - Check that `/api/cron/check-deadlines` is listed

### Security Note
⚠️ **IMPORTANT**: Change `CRON_SECRET` to a strong random string in production!

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## File Structure

```
src/
├── lib/
│   └── email.ts              # Email sending utility
└── app/
    └── api/
        └── cron/
            └── check-deadlines/
                └── route.ts   # Cron job endpoint
```

## Customization

### Change Email Template
Edit `src/lib/email.ts` → `sendDeadlineNotification()` function to modify:
- Email styling
- Content layout
- Colors and branding
- Subject line

### Change Notification Window
Edit `src/app/api/cron/check-deadlines/route.ts`:
```typescript
// Change from 24 hours to 48 hours
const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
```

### Add Multiple Reminder Times
Create additional cron jobs:
```json
"crons": [
  {
    "path": "/api/cron/check-deadlines-24h",
    "schedule": "0 9 * * *"
  },
  {
    "path": "/api/cron/check-deadlines-1h",
    "schedule": "0 * * * *"
  }
]
```

## Troubleshooting

### Emails Not Sending
1. Check Gmail app password is correct
2. Verify 2-Step Verification is enabled on Google Account
3. Check Vercel logs for errors
4. Test endpoint manually with curl/Postman

### Cron Not Running
1. Verify `vercel.json` is in project root
2. Check Vercel Dashboard → Settings → Crons
3. Ensure project is deployed (crons don't run locally)
4. Check `CRON_SECRET` environment variable is set

### Wrong Time Zone
Vercel crons run in UTC. Adjust schedule accordingly:
- If you want 9am PST (UTC-8), use `0 17 * * *` (5pm UTC)
- If you want 9am EST (UTC-5), use `0 14 * * *` (2pm UTC)

## Future Enhancements

Potential improvements:
- [ ] User preference for notification frequency
- [ ] Multiple reminder options (24h, 6h, 1h before)
- [ ] SMS notifications via Twilio
- [ ] Digest emails (daily summary of upcoming tasks)
- [ ] Timezone-aware scheduling
- [ ] Opt-out/unsubscribe option

---

**Status**: ✅ Fully implemented and ready for deployment
**Last Updated**: November 16, 2025
