# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for TaskMate AI.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select an existing project
3. Give your project a name (e.g., "TaskMate AI")
4. Click **"Create"**

## Step 2: Enable Google+ API

1. In your project dashboard, go to **"APIs & Services" > "Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it and press **"Enable"**

## Step 3: Create OAuth Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. If prompted, configure the **OAuth consent screen** first:
   - Choose **"External"** (for public apps)
   - Fill in required fields:
     - **App name**: TaskMate AI
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click **"Save and Continue"**
   - Add scopes: `email`, `profile`, `openid` (or leave default)
   - Click **"Save and Continue"**
   - Add test users if needed
   - Click **"Save and Continue"**

4. Back to **"Create OAuth client ID"**:
   - **Application type**: Web application
   - **Name**: TaskMate AI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://task-mate-ai-two.vercel.app` (for production)
   - **Authorized redirect URIs**: (Leave empty for now, not needed for client-side OAuth)
   - Click **"Create"**

5. **Copy your Client ID** (you'll need this)

## Step 4: Add Client ID to Your Project

### Local Development:

1. Open `.env.local` in your project root
2. Replace the placeholder with your actual Client ID:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
   ```
3. Save the file

### Production (Vercel):

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Value**: Your Google Client ID
   - **Environment**: Production, Preview, Development (select all)
4. Click **"Save"**
5. Redeploy your application

## Step 5: Test Google OAuth

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`
3. Click **"Continue with Google"**
4. Sign in with your Google account
5. You should be redirected to the dashboard

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure you added `http://localhost:3000` to **Authorized JavaScript origins** in Google Cloud Console
- For production, add your Vercel URL (e.g., `https://task-mate-ai-two.vercel.app`)

### "Error 401: invalid_client"
- Check if your Client ID is correct in `.env.local`
- Make sure you copied the **Client ID**, not the Client Secret

### Google button not showing
- Check browser console for errors
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Make sure you restarted the dev server after adding the env variable

### "User not found after Google sign-in"
- Check MongoDB connection
- Verify the `/api/auth/google` endpoint is working
- Check server logs for errors

## Production Deployment Notes

When deploying to Vercel:

1. **Add environment variable** in Vercel dashboard:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (your Client ID)

2. **Update OAuth origins** in Google Cloud Console:
   - Add your production URL to **Authorized JavaScript origins**

3. **Redeploy** your Vercel application

## Security Best Practices

✅ **Never commit** your `.env.local` file to Git (it's already in `.gitignore`)
✅ **Use different** Google OAuth projects for development and production
✅ **Regularly review** OAuth consent screen settings
✅ **Monitor** Google Cloud Console for suspicious activity
✅ **Limit scopes** to only what's needed (email, profile, openid)

## Features Enabled

With Google OAuth, users can:
- ✅ Sign in with their Google account
- ✅ Sign up with their Google account
- ✅ Auto-populate name and email from Google profile
- ✅ Get profile picture from Google (stored in MongoDB)
- ✅ Skip password creation (OAuth users use Google authentication)

## API Endpoints

- **POST** `/api/auth/google` - Handle Google OAuth sign-in/sign-up
  - Accepts: `{ credential: string }` (Google JWT token)
  - Returns: `{ token: string, user: object }`
  - Creates new user if email doesn't exist
  - Updates existing user with Google ID and avatar

## User Model Updates

The User model now includes:
- `googleId?: string` - Google account unique identifier
- `avatar?: string` - Profile picture URL from Google

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check server logs (`npm run dev` output)
3. Verify all environment variables are set
4. Make sure MongoDB is connected
5. Check Google Cloud Console audit logs

---

**Setup Complete!** 🎉

Users can now sign in with Google on both login and register pages.
