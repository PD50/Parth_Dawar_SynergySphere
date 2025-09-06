# SynergySphere - Implementation Plan

## Overview
This document provides a sprint-based implementation plan for building SynergySphere from scratch, following the design document specifications. Each sprint is designed to be completed by Claude Code with minimal risk of hallucinations, with clear boundaries and testable deliverables.

## Project Timeline
- **Total Duration**: 8 Sprints
- **Sprint Duration**: Each sprint represents a focused work session (2-3 hours)
- **Total Estimated Time**: 16-24 hours

## Pre-Implementation Checklist
Before starting Sprint 1, ensure:
- [ ] Remove or backup existing codebase
- [ ] Have PostgreSQL installed locally or Supabase account ready
- [ ] Have Node.js 18+ installed
- [ ] Have a Google AI Studio account and Gemini API key

### Getting Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Navigate to "Get API Key" section
4. Create a new API key for your project
5. Store the key securely in your `.env.local` file

---

## Sprint 1: Project Foundation & Setup
**Duration**: 2-3 hours  
**Goal**: Create Next.js project with TypeScript, configure essential tools, and establish project structure

### Tasks
1. **Initialize Next.js Project**
   ```bash
   npx create-next-app@latest synergysphere --typescript --tailwind --app --src-dir --import-alias "@/*"
   ```
   - Choose: Yes to TypeScript, ESLint, Tailwind CSS, App Router
   - Choose: No to customizing import alias

2. **Install Core Dependencies**
   ```bash
   npm install @tanstack/react-query @tanstack/react-query-devtools
   npm install zustand immer
   npm install react-hook-form @hookform/resolvers zod
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   npm install socket.io-client
   npm install date-fns
   npm install clsx tailwind-merge
   npm install lucide-react
   ```

3. **Install Development Dependencies**
   ```bash
   npm install -D @types/node
   npm install -D prettier prettier-plugin-tailwindcss
   npm install -D husky lint-staged
   ```

4. **Setup shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   ```
   - Choose: Default style, Slate base color, CSS variables

5. **Install Initial shadcn Components**
   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add dropdown-menu
   npx shadcn-ui@latest add form
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add label
   npx shadcn-ui@latest add select
   npx shadcn-ui@latest add separator
   npx shadcn-ui@latest add skeleton
   npx shadcn-ui@latest add tabs
   npx shadcn-ui@latest add toast
   npx shadcn-ui@latest add avatar
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add popover
   npx shadcn-ui@latest add textarea
   ```

6. **Create Project Structure**
   ```
   src/
   ├── app/
   │   ├── (auth)/
   │   │   ├── login/
   │   │   │   └── page.tsx
   │   │   └── register/
   │   │       └── page.tsx
   │   ├── (dashboard)/
   │   │   ├── layout.tsx
   │   │   ├── page.tsx
   │   │   └── projects/
   │   │       └── [id]/
   │   │           ├── page.tsx
   │   │           ├── tasks/page.tsx
   │   │           ├── discussions/page.tsx
   │   │           └── settings/page.tsx
   │   ├── api/
   │   │   └── (routes will be added in Sprint 2)
   │   ├── layout.tsx
   │   └── page.tsx
   ├── components/
   │   ├── ui/ (shadcn components)
   │   └── (custom components folders)
   ├── hooks/
   ├── lib/
   │   ├── api.ts
   │   ├── utils.ts
   │   └── constants.ts
   ├── stores/
   └── types/
   ```

7. **Configure Environment Variables**
   Create `.env.local`:
   ```env
   # Database
   DATABASE_URL=""
   
   # Auth
   JWT_SECRET=""
   
   # API Keys
   GOOGLE_GEMINI_API_KEY=""
   
   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

### Deliverables
- Next.js project with TypeScript configured
- All dependencies installed
- shadcn/ui components ready
- Proper folder structure created
- Environment variables template

### Validation
```bash
npm run dev
# Should see Next.js welcome page at localhost:3000
```

---

## Sprint 2: Database Setup & Authentication System
**Duration**: 3 hours  
**Goal**: Setup PostgreSQL with Prisma, implement JWT authentication with httpOnly cookies

### Tasks
1. **Install Database Dependencies**
   ```bash
   npm install prisma @prisma/client
   npm install bcryptjs jsonwebtoken
   npm install -D @types/bcryptjs @types/jsonwebtoken
   npm install cookies-next
   ```

2. **Initialize Prisma**
   ```bash
   npx prisma init
   ```

3. **Create Prisma Schema**
   - Copy the complete Prisma schema from DESIGN_DOCUMENT.md
   - Place in `prisma/schema.prisma`

4. **Setup Database Connection**
   - Configure DATABASE_URL in `.env.local`
   - For local: `postgresql://user:password@localhost:5432/synergysphere`
   - For Supabase: Use connection string from Supabase dashboard

5. **Run Initial Migration**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

6. **Create Authentication Library**
   Create `src/lib/auth.ts`:
   - JWT token generation/verification
   - Password hashing/comparison
   - Cookie management helpers

7. **Implement Auth API Routes**
   Create:
   - `src/app/api/auth/register/route.ts`
   - `src/app/api/auth/login/route.ts`
   - `src/app/api/auth/logout/route.ts`
   - `src/app/api/auth/me/route.ts`
   - `src/app/api/auth/refresh/route.ts`

8. **Create Auth Middleware**
   Create `src/lib/middleware/auth.ts`:
   - Token verification middleware
   - User session validation
   - Protected route helper

9. **Create Auth Store (Zustand)**
   Create `src/stores/authStore.ts`:
   - User state management
   - Login/logout actions
   - Token refresh logic

10. **Create Auth Hook**
    Create `src/hooks/useAuth.ts`:
    - Auth state access
    - Login/logout helpers
    - Auto-refresh setup

### Deliverables
- Prisma configured with PostgreSQL
- Complete database schema migrated
- JWT authentication system
- Auth API endpoints
- Auth state management

### Validation
```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Sprint 3: Core UI Components & Layouts
**Duration**: 2-3 hours  
**Goal**: Build responsive layouts, navigation components, and core UI elements

### Tasks
1. **Create Layout Components**
   - `src/components/layout/Header.tsx`
   - `src/components/layout/Sidebar.tsx`
   - `src/components/layout/MobileNav.tsx`
   - `src/components/layout/DashboardLayout.tsx`

2. **Create Auth Components**
   - `src/components/auth/LoginForm.tsx`
   - `src/components/auth/RegisterForm.tsx`
   - `src/components/auth/AuthGuard.tsx`

3. **Implement Auth Pages**
   - Update `src/app/(auth)/login/page.tsx`
   - Update `src/app/(auth)/register/page.tsx`
   - Add form validation with Zod
   - Connect to auth API

4. **Create Dashboard Layout**
   Update `src/app/(dashboard)/layout.tsx`:
   - Sidebar navigation
   - Header with user menu
   - Mobile responsive design
   - Protected route wrapper

5. **Install Additional UI Components**
   ```bash
   npx shadcn-ui@latest add navigation-menu
   npx shadcn-ui@latest add sheet
   npx shadcn-ui@latest add tooltip
   npx shadcn-ui@latest add alert
   npx shadcn-ui@latest add alert-dialog
   ```

6. **Create Common Components**
   - `src/components/common/LoadingSpinner.tsx`
   - `src/components/common/ErrorBoundary.tsx`
   - `src/components/common/EmptyState.tsx`
   - `src/components/common/PageHeader.tsx`

7. **Setup Global Styles**
   Update `src/app/globals.css`:
   - Custom utility classes
   - Animation classes
   - Responsive breakpoints

8. **Create Theme Provider**
   - Dark/light mode support
   - System preference detection
   - Theme persistence

### Deliverables
- Complete authentication UI
- Responsive dashboard layout
- Navigation components
- Core UI components library
- Theme system

### Validation
- Login/register flow works end-to-end
- Dashboard shows after authentication
- Responsive on mobile/desktop
- Theme switching works

---

## Sprint 4: Project Management Features
**Duration**: 3 hours  
**Goal**: Implement project CRUD, member management, and project dashboard

### Tasks
1. **Create Project API Routes**
   - `src/app/api/projects/route.ts` (GET, POST)
   - `src/app/api/projects/[id]/route.ts` (GET, PATCH, DELETE)
   - `src/app/api/projects/[id]/members/route.ts` (GET, POST)
   - `src/app/api/projects/[id]/members/[userId]/route.ts` (DELETE)

2. **Create Project Store**
   Create `src/stores/projectStore.ts`:
   - Projects list state
   - Current project state
   - CRUD operations
   - Member management

3. **Create Project Components**
   - `src/components/projects/ProjectCard.tsx`
   - `src/components/projects/ProjectGrid.tsx`
   - `src/components/projects/CreateProjectModal.tsx`
   - `src/components/projects/ProjectSettings.tsx`
   - `src/components/projects/MembersList.tsx`
   - `src/components/projects/AddMemberModal.tsx`

4. **Implement Project Pages**
   - `src/app/(dashboard)/page.tsx` - Projects list
   - `src/app/(dashboard)/projects/[id]/page.tsx` - Project overview
   - `src/app/(dashboard)/projects/[id]/settings/page.tsx` - Project settings

5. **Create Project Hooks**
   - `src/hooks/useProjects.ts`
   - `src/hooks/useProject.ts`
   - `src/hooks/useProjectMembers.ts`

6. **Setup React Query**
   - Configure QueryClient
   - Add providers to layout
   - Implement data fetching hooks
   - Add optimistic updates

7. **Add Project Navigation**
   - Project switcher in sidebar
   - Breadcrumbs component
   - Project tabs navigation

### Deliverables
- Project CRUD functionality
- Member invitation system
- Project dashboard
- Project settings page
- Member management UI

### Validation
- Can create/edit/delete projects
- Can add/remove members
- Project data persists
- UI updates optimistically

---

## Sprint 5: Task Management System (Kanban Board)
**Duration**: 3-4 hours  
**Goal**: Build drag-and-drop Kanban board with task management

### Tasks
1. **Create Task API Routes**
   - `src/app/api/projects/[id]/tasks/route.ts` (GET, POST)
   - `src/app/api/tasks/[id]/route.ts` (GET, PATCH, DELETE)
   - `src/app/api/tasks/[id]/status/route.ts` (PATCH)
   - `src/app/api/tasks/batch/route.ts` (PATCH) - for bulk updates

2. **Create Task Store**
   Create `src/stores/taskStore.ts`:
   - Tasks by status
   - Drag and drop state
   - Optimistic updates
   - Filter/sort state

3. **Implement Kanban Components**
   - `src/components/tasks/KanbanBoard.tsx`
   - `src/components/tasks/KanbanColumn.tsx`
   - `src/components/tasks/TaskCard.tsx`
   - `src/components/tasks/TaskModal.tsx`
   - `src/components/tasks/CreateTaskModal.tsx`
   - `src/components/tasks/TaskFilters.tsx`

4. **Setup Drag and Drop**
   Using @dnd-kit:
   - Draggable task cards
   - Droppable columns
   - Auto-scroll support
   - Touch support
   - Optimistic updates

5. **Create Task Form Components**
   - Task title/description fields
   - Assignee selector
   - Due date picker
   - Priority selector
   - Status selector

6. **Install Date Components**
   ```bash
   npx shadcn-ui@latest add calendar
   npx shadcn-ui@latest add date-picker
   ```

7. **Implement Task Pages**
   Update `src/app/(dashboard)/projects/[id]/tasks/page.tsx`:
   - Kanban board view
   - Task filters
   - Quick add task

8. **Add Real-time Updates**
   - WebSocket connection for task updates
   - Optimistic UI updates
   - Conflict resolution

### Deliverables
- Fully functional Kanban board
- Drag-and-drop task management
- Task CRUD operations
- Real-time task updates
- Task filtering/sorting

### Validation
- Can create/edit/delete tasks
- Drag-and-drop works smoothly
- Status changes persist
- Multiple users see updates

---

## Sprint 6: Communication System
**Duration**: 3 hours  
**Goal**: Build threaded discussions with @mentions and notifications

### Tasks
1. **Create Message API Routes**
   - `src/app/api/projects/[id]/messages/route.ts` (GET, POST)
   - `src/app/api/messages/[id]/route.ts` (GET, PATCH, DELETE)
   - `src/app/api/messages/[id]/thread/route.ts` (GET)

2. **Create Notification API Routes**
   - `src/app/api/notifications/route.ts` (GET)
   - `src/app/api/notifications/[id]/read/route.ts` (PATCH)
   - `src/app/api/notifications/mark-all-read/route.ts` (POST)

3. **Create Message Components**
   - `src/components/messages/MessageFeed.tsx`
   - `src/components/messages/MessageItem.tsx`
   - `src/components/messages/MessageComposer.tsx`
   - `src/components/messages/ThreadView.tsx`
   - `src/components/messages/MentionAutocomplete.tsx`

4. **Create Notification Components**
   - `src/components/notifications/NotificationCenter.tsx`
   - `src/components/notifications/NotificationItem.tsx`
   - `src/components/notifications/NotificationBell.tsx`

5. **Implement @Mentions**
   - User search API
   - Autocomplete component
   - Mention parsing
   - Notification creation

6. **Setup WebSocket for Messages**
   - Real-time message delivery
   - Typing indicators
   - Online presence
   - Read receipts

7. **Create Message Store**
   Create `src/stores/messageStore.ts`:
   - Messages state
   - Thread management
   - Real-time updates

8. **Create Notification Store**
   Create `src/stores/notificationStore.ts`:
   - Notifications list
   - Unread count
   - Real-time updates

### Deliverables
- Threaded messaging system
- @mentions with autocomplete
- Real-time message updates
- Notification system
- Unread indicators

### Validation
- Can send/receive messages
- Threading works correctly
- @mentions trigger notifications
- Real-time updates work

---

## Sprint 7: AI Agents Implementation
**Duration**: 3-4 hours  
**Goal**: Integrate AI agents using Google Gemini for standup summaries, task extraction, and risk analysis

### Tasks
1. **Setup Google Gemini Infrastructure**
   ```bash
   npm install @google/genai
   ```
   - Configure Google Gemini client
   - Create AI service layer
   - Add rate limiting
   - Error handling

2. **Create AI API Routes**
   - `src/app/api/projects/[id]/ai/standup/route.ts`
   - `src/app/api/projects/[id]/ai/extract-tasks/route.ts`
   - `src/app/api/projects/[id]/ai/risk-analysis/route.ts`

3. **Implement AI Agents with Google Gemini**
   Create `src/lib/ai/`:
   - `geminiClient.ts` - Gemini configuration
   - `agents/standupBot.ts`
   - `agents/taskExtractor.ts`
   - `agents/riskSentinel.ts`
   
   Example Gemini client setup:
   ```typescript
   // src/lib/ai/geminiClient.ts
   import { GoogleGenerativeAI } from "@google/generative-ai";
   
   const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
   
   export const geminiPro = genAI.getGenerativeModel({ 
     model: "gemini-1.5-pro" 
   });
   
   export const geminiFlash = genAI.getGenerativeModel({ 
     model: "gemini-1.5-flash" 
   });
   ```

4. **Create AI Components**
   - `src/components/ai/StandupGenerator.tsx`
   - `src/components/ai/TaskExtractor.tsx`
   - `src/components/ai/RiskAnalysis.tsx`
   - `src/components/ai/AIAgentPanel.tsx`

5. **Add AI UI Elements**
   - Standup button in project header
   - Extract tasks from message composer
   - Risk indicators on task cards
   - AI insights dashboard widget

6. **Implement Agent Logic with Gemini**
   - Standup: Analyze last 24h activity using Gemini
   - Task Extraction: Parse natural language with structured output
   - Risk Analysis: Identify at-risk tasks
   
   Example agent implementation:
   ```typescript
   // src/lib/ai/agents/standupBot.ts
   import { geminiPro } from '../geminiClient';
   
   export async function generateStandup(context: ProjectContext) {
     const prompt = `Generate a standup summary for these tasks...`;
     const result = await geminiPro.generateContent(prompt);
     return result.response.text();
   }
   ```

7. **Create AI Store**
   Create `src/stores/aiStore.ts`:
   - AI generation state
   - History tracking
   - Suggestion management

8. **Add Loading States**
   - Generation progress indicators
   - Streaming responses
   - Error recovery

### Deliverables
- Three functional AI agents
- UI integration for AI features
- Proper error handling
- Loading/streaming states
- AI history tracking

### Validation
- Standup bot generates summaries
- Task extraction works from text
- Risk analysis identifies issues
- AI responses are contextual

---

## Sprint 8: Polish, Testing & Local Optimization
**Duration**: 2-3 hours  
**Goal**: Final polish, performance optimization, comprehensive testing, and local development refinement

### Tasks
1. **Performance Optimization**
   - Add React.memo to components
   - Implement virtual scrolling for lists
   - Optimize bundle size
   - Add image optimization
   - Implement lazy loading

2. **Add Progress Dashboard**
   Create `src/app/(dashboard)/projects/[id]/progress/page.tsx`:
   - Task completion metrics
   - Team velocity chart
   - Overdue tasks list
   - Member workload

3. **Mobile Optimization**
   - Touch gesture improvements
   - Mobile-specific layouts
   - PWA configuration
   - Offline support basics

4. **Error Handling**
   - Global error boundary
   - API error handling
   - Toast notifications
   - Retry mechanisms

5. **Add Loading States**
   - Skeleton screens
   - Progress indicators
   - Optimistic UI everywhere

6. **Setup Testing**
   ```bash
   npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
   npm install -D @playwright/test
   ```
   - Unit tests for utilities
   - Component tests
   - E2E test for critical paths

7. **Environment Configuration**
   - Development & production environment setup
   - API rate limiting implementation
   - CORS configuration for local development
   - Security headers setup

8. **Local Development Enhancement**
   - Create docker-compose for local services
   - Setup development database seeding
   - Configure hot reload optimization
   - Add development utilities

9. **Create Documentation**
   - Update README.md
   - API documentation
   - Deployment guide
   - Contributing guidelines

### Deliverables
- Optimized application performance
- Comprehensive test coverage
- Complete documentation
- Development environment perfected
- Performance metrics dashboard

### Validation
- Lighthouse score > 90
- All tests passing
- No console errors
- Mobile responsive
- Development environment stable

---

## Implementation Guidelines for Claude Code

### General Rules
1. **Complete one sprint at a time** - Don't jump ahead
2. **Test after each major feature** - Ensure functionality before moving on
3. **Commit frequently** - After each completed component
4. **Follow the exact structure** - Don't deviate from the plan
5. **Ask for clarification** - If something is unclear, ask before implementing

### Sprint Execution Pattern
For each sprint:
1. Read the entire sprint section
2. Create a checklist of tasks
3. Implement tasks in order
4. Test each feature as completed
5. Commit with descriptive messages
6. Validate deliverables
7. Only then move to next sprint

### Error Recovery
If errors occur:
1. Don't skip or work around - fix the root cause
2. Ensure database migrations are run
3. Check environment variables
4. Verify dependencies are installed
5. Clear cache if needed (`.next`, `node_modules`)

### Code Quality Standards
- TypeScript strict mode always
- No `any` types unless absolutely necessary
- Proper error handling in all API routes
- Loading states for all async operations
- Responsive design for all components
- Accessibility (ARIA labels, keyboard navigation)

### Testing Approach
After each sprint:
1. Manual testing of new features
2. Check browser console for errors
3. Test on mobile viewport
4. Verify data persistence
5. Check real-time features with multiple tabs

---

## Post-Implementation Checklist

### Final Validation
- [ ] All authentication flows work
- [ ] Projects can be created/managed
- [ ] Tasks drag-and-drop smoothly
- [ ] Messages send in real-time
- [ ] AI agents generate useful output using Gemini
- [ ] Mobile experience is smooth
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All tests pass
- [ ] Local development environment stable

### Performance Targets
- [ ] Initial load < 3 seconds
- [ ] Task drag < 100ms response
- [ ] API responses < 500ms
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB

### Security Checklist
- [ ] JWT tokens in httpOnly cookies
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Environment variables secured

---

## Troubleshooting Guide

### Common Issues and Solutions

1. **Database Connection Issues**
   ```bash
   npx prisma db push --force-reset
   npx prisma generate
   ```

2. **Module Not Found Errors**
   ```bash
   rm -rf node_modules .next
   npm install
   ```

3. **TypeScript Errors**
   ```bash
   npx tsc --noEmit
   # Fix reported errors
   ```

4. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify Socket.io client/server versions match
   - Check firewall/proxy settings

5. **AI Agent Errors (Google Gemini)**
   - Verify GOOGLE_GEMINI_API_KEY is set correctly
   - Check Google AI Studio quota/rate limits
   - Implement exponential backoff for Gemini API
   - Ensure proper model selection (gemini-1.5-pro vs gemini-1.5-flash)

---

## Success Metrics

### Sprint Completion Criteria
Each sprint is considered complete when:
1. All tasks are implemented
2. No blocking errors exist
3. Features work as described
4. Code is committed
5. Basic testing passes

### Project Success Criteria
The project is ready when:
1. All 8 sprints are complete
2. Application is deployed
3. Core workflow is functional
4. Real-time features work
5. AI agents provide value
6. Mobile experience is good

---

This implementation plan is designed to be executed sequentially by Claude Code. Each sprint builds on the previous one, with clear boundaries and specific deliverables. The modular approach reduces the risk of hallucinations and ensures steady progress toward a complete, production-ready application.