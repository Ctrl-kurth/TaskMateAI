# TaskMate AI 🚀

A full-stack task management application with AI-powered task breakdown, friend collaboration, real-time notifications, Kanban dashboard, and dark mode UI.

## Features ✨

- **AI-Powered Task Breakdown**: Automatically break down complex tasks into actionable subtasks using OpenAI
- **Kanban Dashboard**: Drag-and-drop interface for intuitive task management
- **Team Collaboration**: Invite friends and assign tasks to team members
- **Real-time Notifications**: Stay updated with task assignments and updates
- **Dark Mode UI**: Beautiful dark theme with Tailwind CSS
- **Priority Management**: Set task priorities (low, medium, high)
- **Subtask Tracking**: Create and track subtasks for better organization
- **Due Date Management**: Set and track task deadlines

## Tech Stack 🛠️

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API
- **Drag & Drop**: @hello-pangea/dnd
- **Icons**: React Icons

## Getting Started 🏁

### Prerequisites

- Node.js 20 or higher
- MongoDB instance (local or cloud)
- OpenAI API key (optional, falls back to mock data)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ctrl-kurth/TaskMateAI.git
cd TaskMateAI
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/taskmateai
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key-here  # Optional
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure 📁

```
TaskMateAI/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── tasks/        # Task CRUD operations
│   │   ├── friends/      # Friend management
│   │   ├── notifications/# Notification system
│   │   └── ai/           # AI task breakdown
│   ├── auth/             # Auth pages (signin/signup)
│   ├── dashboard/        # Main dashboard
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── KanbanBoard.tsx
│   ├── TaskCard.tsx
│   └── TaskModal.tsx
├── lib/
│   ├── db/              # Database connection
│   └── models/          # Mongoose models
└── types/               # TypeScript definitions
```

## Usage 📖

### Creating a Task

1. Navigate to the dashboard
2. Click "New Task" button
3. Fill in task details (title, description, priority, due date)
4. Optionally use "AI Generate" to create subtasks automatically
5. Click "Create Task"

### Using AI Task Breakdown

1. When creating or editing a task, enter the task title and description
2. Click the "AI Generate" button in the Subtasks section
3. AI will automatically generate 3-5 relevant subtasks
4. Review and modify the generated subtasks as needed

### Managing Tasks

- **Drag & Drop**: Move tasks between columns (To Do, In Progress, Done)
- **Edit**: Click on any task card to view and edit details
- **Subtasks**: Track progress with checkable subtasks
- **Priority**: Color-coded priority indicators (green=low, yellow=medium, red=high)

### Collaboration

1. Navigate to Friends section (user icon in header)
2. Send friend requests by email
3. Accept/reject incoming friend requests
4. Assign tasks to friends by selecting them in the task form

## API Endpoints 🔌

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Tasks
- `GET /api/tasks` - Get all tasks for current user
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get specific task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### AI
- `POST /api/ai/breakdown` - Generate task subtasks with AI

### Friends
- `GET /api/friends` - Get friends and pending requests
- `POST /api/friends` - Send friend request
- `PUT /api/friends/[id]` - Accept/reject friend request
- `DELETE /api/friends/[id]` - Remove friendship

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications` - Mark notifications as read

## Environment Variables 🔐

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No |

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is open source and available under the MIT License.

## Support 💬

For support, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js, MongoDB, and TypeScript
