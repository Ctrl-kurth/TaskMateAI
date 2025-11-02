# 🚀 Quick Start Guide

Get TaskMate AI running on your local machine in 5 minutes!

## Prerequisites

Make sure you have these installed:
- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ MongoDB ([Install locally](https://www.mongodb.com/docs/manual/installation/) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register))
- ✅ Git ([Download](https://git-scm.com/))

## Installation Steps

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Ctrl-kurth/TaskMateAI.git
cd TaskMateAI
```

### 2️⃣ Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- MongoDB & Mongoose
- TypeScript
- Tailwind CSS
- JWT libraries
- And more...

### 3️⃣ Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# macOS/Linux
touch .env.local
```

Add these variables to `.env.local`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/taskmate-ai

# JWT Secret (change this to a random string!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Optional: API Keys for AI features
OPENAI_API_KEY=your-openai-api-key-here
```

#### 🔑 Generating a Strong JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use this online: https://generate-secret.vercel.app/32
```

### 4️⃣ Start MongoDB

**If using local MongoDB:**
```bash
# Windows
net start MongoDB

# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**If using MongoDB Atlas:**
- Copy your connection string from Atlas dashboard
- Replace `MONGODB_URI` in `.env.local`

### 5️⃣ Run the Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.0.1
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### 6️⃣ Open in Browser

Navigate to: **http://localhost:3000**

🎉 You should see the login page!

## First Time Setup

1. **Register an Account**
   - Go to http://localhost:3000/register
   - Fill in your name, email, and password
   - Click "Sign up"

2. **Explore the Dashboard**
   - You'll be automatically logged in
   - See the Kanban board with three columns
   - View stats cards at the top

3. **Create Your First Task**
   - Click "+ New Task" button
   - Fill in task details
   - Click "Add Task"

4. **Try AI Breakdown** (Optional)
   - Click "AI Breakdown" button
   - Enter a complex task (e.g., "Plan a birthday party")
   - See it automatically split into sub-tasks

5. **Add a Friend**
   - Click "Friends" button
   - Enter friend's name and email
   - They'll receive a notification when they log in

## 🧪 Testing the API

Test if everything works:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","database":"connected"}
```

## 🛠️ Common Issues & Solutions

### Issue: MongoDB Connection Error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env.local`
- Try: `mongodb://127.0.0.1:27017/taskmate-ai` instead of `localhost`

### Issue: Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: JWT_SECRET Not Found

**Error**: `JWT_SECRET is not defined`

**Solution**:
- Make sure `.env.local` exists in root directory
- Restart the dev server after creating `.env.local`
- Check for typos in variable name

### Issue: Module Not Found

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📦 Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## 🚀 Deploy to Cloud

### Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables
6. Click "Deploy"

### Environment Variables for Deployment

Don't forget to add these in your hosting platform:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key

## 📚 Next Steps

- [ ] Read the [full documentation](./README.md)
- [ ] Check out [feature guides](./docs)
- [ ] Customize the UI colors
- [ ] Add real AI integration (OpenAI/Anthropic)
- [ ] Deploy to production
- [ ] Share with friends!

## 💡 Development Tips

- Use `npm run dev` for hot-reloading during development
- Check browser console for any client-side errors
- Check terminal for server-side errors
- Use MongoDB Compass to view your database visually

## 🆘 Need Help?

- 📖 [Read the docs](./README.md)
- 🐛 [Report issues](https://github.com/Ctrl-kurth/TaskMateAI/issues)
- 💬 [Join discussions](https://github.com/Ctrl-kurth/TaskMateAI/discussions)

---

Happy coding! 🎉
