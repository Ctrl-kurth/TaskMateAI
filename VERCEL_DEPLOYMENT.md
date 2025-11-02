# 🚀 Vercel Deployment Guide for TaskMateAI

Follow these steps to deploy your TaskMateAI application to Vercel.

## 📋 Prerequisites

- [x] Code pushed to GitHub ✅
- [ ] MongoDB Atlas account (if not using local MongoDB)
- [ ] Strong JWT secret generated

---

## 🌐 Step 1: Set Up MongoDB Atlas (If Needed)

If you're using local MongoDB, you'll need to switch to MongoDB Atlas for production.

### Create MongoDB Atlas Database:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up / Log in
3. Create a **FREE** cluster:
   - Provider: **AWS** (recommended)
   - Region: **Choose closest to you**
   - Cluster Name: `TaskMateAI`
4. Wait 3-5 minutes for cluster creation

### Get Connection String:

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmate-ai?retryWrites=true&w=majority
   ```

### Configure Network Access:

1. Go to **Network Access** in Atlas
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

---

## 🚀 Step 2: Deploy to Vercel

### A. Using Vercel Website (Recommended):

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Click **"Sign Up"** or **"Log In"**
   - Choose **"Continue with GitHub"**

2. **Import Repository**
   - Click **"Add New..."** → **"Project"**
   - Find and select **"TaskMateAI"**
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected ✅)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - Leave everything as default!

4. **Add Environment Variables** ⚠️ IMPORTANT
   
   Click **"Environment Variables"** and add:

   **Variable 1:**
   ```
   Name: MONGODB_URI
   Value: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmate-ai?retryWrites=true&w=majority
   ```
   *(Replace with your actual MongoDB Atlas connection string)*

   **Variable 2:**
   ```
   Name: JWT_SECRET
   Value: [your-32-character-secret-here]
   ```
   *(Use a strong random string - see below for generation)*

   **For all environments**: ✅ Production, ✅ Preview, ✅ Development

5. **Deploy!**
   - Click **"Deploy"**
   - Wait 2-3 minutes ⏳
   - 🎉 Your app is live!

### B. Using Vercel CLI (Alternative):

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? TaskMateAI
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add MONGODB_URI
# Paste your MongoDB connection string when prompted

vercel env add JWT_SECRET
# Paste your JWT secret when prompted

# Deploy to production
vercel --prod
```

---

## 🔑 Generate Strong JWT Secret

Run this in PowerShell to generate a secure random secret:

```powershell
# Generate 32-byte random hex string
$bytes = New-Object Byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[BitConverter]::ToString($bytes).Replace('-','').ToLower()
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Step 3: Verify Deployment

After deployment completes:

1. **Get Your URL**
   - Vercel will show: `https://taskmate-ai-xxxxx.vercel.app`
   - Copy this URL

2. **Test Your App**
   - Visit the URL in your browser
   - You should see the login page
   - Try registering a new account
   - Create a task
   - Test all features

3. **Test API Health**
   - Visit: `https://your-app-url.vercel.app/api/health`
   - Should return: `{"status":"ok","database":"connected"}`

---

## 🛠️ Common Issues & Solutions

### Issue 1: Build Failed

**Error**: `Module not found` or `Cannot find package`

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install

# Push updated package-lock.json
git add package-lock.json
git commit -m "Update dependencies"
git push
```

Vercel will automatically redeploy.

### Issue 2: Database Connection Failed

**Error**: `MongooseServerSelectionError`

**Solutions**:
- ✅ Check MongoDB Atlas network access allows 0.0.0.0/0
- ✅ Verify connection string has correct password
- ✅ Ensure database name is included in URI
- ✅ Connection string ends with `?retryWrites=true&w=majority`

### Issue 3: 500 Internal Server Error

**Solutions**:
1. Check Vercel deployment logs:
   - Go to your project → Deployments
   - Click latest deployment
   - Click "Runtime Logs"

2. Verify environment variables:
   - Settings → Environment Variables
   - Make sure both `MONGODB_URI` and `JWT_SECRET` are set

### Issue 4: JWT Authentication Not Working

**Solution**:
- Ensure `JWT_SECRET` is at least 32 characters long
- Redeploy after adding/updating environment variables

---

## 🔄 Step 4: Set Up Automatic Deployments

Vercel automatically deploys when you push to GitHub!

**Every time you push:**
```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will:
1. Detect the push
2. Build your app
3. Deploy automatically
4. Send you a notification

**Branch Previews:**
- Push to any branch → Get a preview URL
- Merge to `main` → Deploy to production

---

## 📱 Step 5: Add Custom Domain (Optional)

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `taskmate.ai`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

---

## 🎯 Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Can register new account
- [ ] Can login
- [ ] Can create tasks
- [ ] Can add friends
- [ ] Notifications work
- [ ] Mobile responsive works
- [ ] API health endpoint returns "connected"
- [ ] No console errors in browser
- [ ] Update GitHub repo with live URL

---

## 🔗 Update GitHub Repository

After successful deployment:

1. **Add Website to GitHub**
   - Go to your GitHub repo
   - Click ⚙️ next to "About"
   - Paste Vercel URL
   - Check "Use your GitHub Pages website"
   - Save

2. **Update README.md**
   - Add: `🔗 **Live Demo**: https://your-app.vercel.app`
   - Commit and push

---

## 📊 Monitor Your Deployment

**Vercel Dashboard** shows:
- Real-time analytics
- Deployment history
- Error logs
- Performance metrics
- Bandwidth usage

**Access logs:**
- Project → Deployments → Click deployment → Runtime Logs

---

## 💡 Pro Tips

1. **Environment Variables per Branch**
   - Use different MongoDB databases for preview vs production

2. **Custom Build Command**
   - Add to `vercel.json` if needed

3. **Edge Functions**
   - API routes automatically run on Vercel Edge Network

4. **Automatic HTTPS**
   - All deployments get SSL certificates automatically

5. **Preview Deployments**
   - Every pull request gets a unique preview URL

---

## 🎉 Success!

Your TaskMateAI is now live on Vercel! 

**Share your live URL:**
```
🚀 TaskMate AI is now live!
Check it out: https://your-app.vercel.app

Built with Next.js, MongoDB, TypeScript & Tailwind CSS
GitHub: https://github.com/Ctrl-kurth/TaskMateAI
```

---

## 🆘 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

Happy deploying! 🎊
