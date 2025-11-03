# 🔧 Fix Local MongoDB Atlas Connection

## Quick Fix - Add Your Local IP

### Step 1: Get Your Public IP
Visit: https://whatismyipaddress.com/
Copy your IPv4 address (e.g., `123.45.67.89`)

### Step 2: Add IP to MongoDB Atlas
1. Go to: https://cloud.mongodb.com
2. Click **"Network Access"** (left sidebar)
3. Click **"+ ADD IP ADDRESS"**
4. Paste your IP address
5. Click **"Confirm"**
6. Wait 1-2 minutes

### Step 3: Restart Your Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

---

## Alternative: Use Local MongoDB

If you want to develop without internet:

### 1. Install MongoDB locally
- Windows: https://www.mongodb.com/try/download/community
- Or use: `winget install MongoDB.Server`

### 2. Start MongoDB service
```powershell
net start MongoDB
```

### 3. Update .env.local
Change line 3 to:
```env
MONGODB_URI=mongodb://localhost:27017/task-manager
```

### 4. Restart dev server
```bash
npm run dev
```

---

## Which Should You Use?

**MongoDB Atlas (Cloud):**
- ✅ Works anywhere with internet
- ✅ Same database as production
- ✅ No local installation needed
- ⚠️ Requires IP whitelist

**Local MongoDB:**
- ✅ Works offline
- ✅ Faster (no network latency)
- ✅ No IP restrictions
- ⚠️ Requires installation
- ⚠️ Different from production

**Recommendation**: Use Atlas and whitelist your IP!
