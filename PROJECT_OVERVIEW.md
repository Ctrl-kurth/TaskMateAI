# TaskMate AI - Project Overview

## 🏗️ Architecture

### Frontend (Next.js App Router)
- **Location**: `src/app/`
- **Pages**: Dashboard, Login, Register
- **Features**: 
  - Kanban-style task board
  - Real-time notifications
  - AI task breakdown
  - Friends management

### Backend (API Routes)
- **Location**: `src/app/api/`
- **Endpoints**:
  - `/api/auth/*` - Authentication
  - `/api/tasks/*` - Task CRUD
  - `/api/team/*` - Friends system
  - `/api/notifications/*` - Notifications
  - `/api/ai/*` - AI features

### Database (MongoDB)
- **Models**: `src/models/`
  - User
  - Task
  - TeamMember (Friends)
  - Notification

## 🔐 Security

- JWT tokens for authentication
- bcryptjs for password hashing
- Protected API routes with middleware
- Environment variables for secrets

## 🎨 Design System

- **Framework**: Tailwind CSS v4
- **Theme**: Dark mode (Vercel-inspired)
- **Colors**:
  - Background: `#000000`
  - Surface: `#0a0a0a`
  - Border: `#808080`
  - Accent: `#0070f3` (Blue)

## 📝 Key Features

1. **Authentication System**
   - JWT-based auth
   - Password hashing
   - Protected routes

2. **Task Management**
   - CRUD operations
   - Status: Todo, In Progress, Done
   - Priority levels
   - Due dates
   - Assignee support

3. **AI Integration**
   - Task breakdown
   - Smart suggestions

4. **Friends System**
   - Send friend requests
   - Accept/decline invitations
   - Two-way friendship
   - Task assignment to friends

5. **Notifications**
   - Real-time updates (10s polling)
   - Friend requests
   - Task assignments
   - Task completions
   - Unread count badge

## 🚀 Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Run Production Build**
   ```bash
   npm start
   ```

## 📚 Code Organization

- `src/app/` - Pages and API routes
- `src/components/` - Reusable React components
- `src/lib/` - Utilities and helpers
- `src/models/` - Database schemas
- `src/types/` - TypeScript definitions
- `public/` - Static assets
- `docs/` - Feature documentation

## 🧪 Testing

Currently no test suite. Recommended additions:
- Unit tests (Jest)
- Integration tests (Playwright)
- API tests (Supertest)

## 🔄 Future Enhancements

- [ ] Real-time updates (WebSocket/SSE)
- [ ] Email notifications
- [ ] File attachments
- [ ] Task comments
- [ ] Activity timeline
- [ ] Dark/Light mode toggle
- [ ] Export/Import tasks
- [ ] Calendar view
- [ ] Task templates

## 📦 Dependencies

### Production
- next (^15.0.1)
- react (^19.0.0)
- mongoose (^8.8.3)
- jsonwebtoken (^9.0.2)
- bcryptjs (^2.4.3)

### Development
- typescript (^5)
- tailwindcss (^4.0.0)
- @types/* (Type definitions)

## 🌍 Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 👥 Team Structure

This is a full-stack project with:
- Frontend: React/Next.js
- Backend: Next.js API Routes
- Database: MongoDB
- Auth: JWT

All in one monorepo for simplicity and fast development.
