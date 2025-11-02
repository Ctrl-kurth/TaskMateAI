# 🤖 TaskMate AI

> **A modern, AI-powered task management application with smart collaboration features**

TaskMate AI is a full-stack web application that helps you organize tasks efficiently with your friends. Built with **Next.js 15**, **MongoDB**, and **JWT authentication**, it features AI-powered task breakdown, real-time notifications, and a beautiful dark-mode interface inspired by Vercel's design language.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Key Highlights

- **🎯 Kanban-style Dashboard** - Visualize tasks across To Do, In Progress, and Completed columns
- **🤖 AI Task Breakdown** - Automatically split complex tasks into manageable sub-tasks
- **👥 Friend Collaboration** - Invite friends, assign tasks, and work together
- **🔔 Real-time Notifications** - Instant updates for friend requests and task assignments
- **📱 Fully Responsive** - Seamless experience on mobile, tablet, and desktop
- **🌙 Dark Mode UI** - Elegant, eye-friendly interface with Vercel-inspired design
- **⚡ Fast & Secure** - JWT authentication with optimized database queries

## 🎨 Design Philosophy

- **Dark Mode First**: Minimalist, Vercel-inspired UI
- **Clean & Modern**: Simple cards, subtle borders, focused on content
- **Responsive**: Mobile-friendly design
- **Accessibility**: High contrast, readable typography

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Password Hashing**: bcryptjs

## 📦 Project Structure

```
task-app/
├── src/                    # Source code
│   ├── app/               # Next.js App Router
│   │   ├── api/          # Backend API Routes
│   │   │   ├── auth/     # Authentication endpoints
│   │   │   ├── tasks/    # Task management
│   │   │   ├── team/     # Friends management
│   │   │   ├── ai/       # AI breakdown feature
│   │   │   └── notifications/ # Notification system
│   │   ├── dashboard/    # Main dashboard page
│   │   ├── login/        # Login page
│   │   ├── register/     # Registration page
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── lib/              # Utility functions
│   │   ├── mongodb.ts    # MongoDB connection
│   │   ├── jwt.ts        # JWT utilities
│   │   └── middleware.ts # Auth middleware
│   ├── models/           # Database models
│   │   ├── User.ts       # User model
│   │   ├── Task.ts       # Task model
│   │   ├── TeamMember.ts # Friend model
│   │   └── Notification.ts # Notification model
│   ├── components/       # Reusable components
│   └── types/            # TypeScript types
├── public/               # Static assets
├── docs/                 # Documentation
└── .env.local           # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
Edit `.env.local` with your MongoDB connection string:
```env
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-super-secret-jwt-key-change-this
```

3. **Run the development server**:
```bash
npm run dev
```

4. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

5. **Test the API**:
Visit [http://localhost:3000/api/health](http://localhost:3000/api/health) to verify the database connection

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Auth** - Secure token-based authentication
- **Password Hashing** - bcryptjs encryption for user passwords
- **Protected Routes** - Middleware-protected API endpoints
- **Session Management** - Persistent login with localStorage

### 📋 Task Management
- **Full CRUD Operations** - Create, Read, Update, Delete tasks
- **Status Workflow** - Todo → In Progress → Completed
- **Priority Levels** - Low, Medium, High priority tags
- **Due Dates** - Set and track task deadlines
- **Rich Descriptions** - Add detailed notes to tasks
- **Quick Status Toggle** - Click circles to cycle through statuses
- **Multi-select Delete** - Bulk delete with floating action buttons
- **Search & Filter** - Find tasks quickly across all statuses

### 🤖 AI-Powered Features
- **Smart Task Breakdown** - AI automatically splits complex tasks into actionable sub-tasks
- **Context-Aware** - Understands different domains (work, personal, study, etc.)
- **One-Click Generation** - Instant sub-task creation from parent task

### 👥 Collaboration & Friends
- **Friend Invitations** - Send requests via email
- **Invitation System** - Accept/decline friend requests with notifications
- **Task Assignment** - Assign tasks to friends from dropdown
- **Friend Management** - Add, view, and remove friends
- **Duplicate Cleanup** - Built-in tool to remove duplicate entries

### 🔔 Notification System
- **Real-time Updates** - Polls every 10 seconds for new notifications
- **Friend Requests** - Instant notification when someone adds you
- **Task Assignments** - Get notified when tasks are assigned to you
- **Mark as Read** - Individual or bulk mark all as read
- **Action Buttons** - Accept/decline directly from notification dropdown
- **Unread Counter** - Visual badge showing unread count

### 🎨 User Interface
- **Dark Mode Design** - Eye-friendly dark theme inspired by Vercel
- **Responsive Layout** - Mobile-first design with breakpoints
- **Kanban Board** - Visual columns for task organization
- **Stats Dashboard** - Overview cards showing task counts
- **User Avatar** - Personalized initials with gradient background
- **Smooth Animations** - Polished transitions and hover effects
- **Context Menus** - Right-click for quick actions

## 🎮 Usage

### Authentication
1. Register a new account at `/register`
2. Login at `/login`
3. Your session is maintained via JWT tokens

### Task Management
- **Create**: Click "+ New Task" button
- **Edit**: Click on any task card
- **Delete**: Right-click task circle or use multi-select
- **Status**: Click the colored circle to toggle status (Todo → In Progress → Done)
- **AI Breakdown**: Use "AI Breakdown" to split complex tasks

### Friends & Collaboration
- **Add Friends**: Click "Friends" button, add by email
- **Accept Requests**: Check notification bell for incoming requests
- **Assign Tasks**: Select friends from dropdown when creating/editing tasks
- **Notifications**: Real-time updates every 10 seconds

## � Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x450/000000/FFFFFF?text=Dashboard+Screenshot)
*Kanban-style board with task cards, stats, and navigation*

### AI Task Breakdown
![AI Breakdown](https://via.placeholder.com/800x450/000000/FFFFFF?text=AI+Breakdown+Modal)
*AI-powered task decomposition feature*

### Friend Collaboration
![Friends](https://via.placeholder.com/800x450/000000/FFFFFF?text=Friends+Management)
*Invite and manage friends for task collaboration*

### Mobile Responsive
![Mobile View](https://via.placeholder.com/400x800/000000/FFFFFF?text=Mobile+Responsive)
*Fully optimized for mobile devices*

## �📚 Documentation

Detailed feature documentation available in [`/docs`](./docs):
- [AI Breakdown Feature](./docs/AI_BREAKDOWN_FEATURE.md)
- [Team Invitation System](./docs/TEAM_INVITATION_FEATURE.md)
- [Responsive Design Guide](./RESPONSIVE_DESIGN.md)
- [Project Architecture](./PROJECT_OVERVIEW.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Design inspiration from [Vercel](https://vercel.com)
- Icons from [Heroicons](https://heroicons.com)
- Built with [Next.js](https://nextjs.org) and [MongoDB](https://mongodb.com)

## 📧 Contact

**Your Name** - [@yourusername](https://github.com/Ctrl-kurth)

Project Link: [https://github.com/Ctrl-kurth/TaskMateAI](https://github.com/Ctrl-kurth/TaskMateAI)

---

⭐ **Star this repo if you find it useful!**

Built with ❤️ using Next.js and MongoDB
