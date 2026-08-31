# AGENTS.md — Ogigrid Workflow Development Guidelines

Welcome to the **Ogigrid Workflow** repository. This document serves as the persistent specification, architectural guide, and coding convention manual for AI agents and developers working on this codebase.

---

## 1. Project Overview & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI & Styling**: React 18, Tailwind CSS, Headless Form Controls & Badges
- **Language**: TypeScript (strict typing across all models)
- **Database**: PostgreSQL with parameterized queries via `lib/db.ts`
- **State Management**: React Context + SWR-style optimistic mutations in `lib/store.tsx`
- **Authentication & Security**: Custom session management with bcrypt-hashed passwords in `lib/server/session.ts` and `lib/server/password.ts`

---

## 2. Directory Structure & Key Files

```
├── app/
│   ├── api/                     # REST API Route Handlers (Server-side)
│   │   ├── account/route.ts     # User self-service account updates
│   │   ├── documents/           # Project-linked document upload/download/delete
│   │   ├── employees/           # Team directory & workspace administration
│   │   ├── meetings/            # Multi-platform scheduled meetings
│   │   ├── projects/            # Project CRUD with access enforcement
│   │   ├── reports/             # Daily standup reports
│   │   ├── tasks/               # Tasks management & status updates
│   │   └── state/route.ts       # Single-roundtrip bootstrap endpoint
│   ├── dashboard/page.tsx       # Executive Team Dashboard ("Who Is Working on What?")
│   ├── documents/page.tsx       # Document repository
│   ├── employees/page.tsx       # Team directory & Admin workspace tools
│   ├── employees/[id]/page.tsx  # Role-aware profile card & assignments
│   ├── meetings/page.tsx        # Meeting scheduler & platform integration
│   ├── schedule/page.tsx        # Synchronized weekly grid (Tasks + Meetings)
│   ├── settings/page.tsx        # Self-serve account details & password management
│   └── tasks/page.tsx           # Tasks view (Employee: mine / Admin: all + filters)
├── components/
│   ├── dashboard/               # Team workload, metrics, meetings, report panels
│   ├── layout/                  # Dark Navy Sidebar, Topbar, NotificationsPanel popover
│   ├── schedule/                # ScheduleGrid and MeetingDetailPanel
│   ├── tasks/                   # TaskDetailPanel, NewTaskModal
│   └── ui/                      # Panel, Modal, FormControls, StatusBadge, DepartmentBadge
├── db/migrations/               # Version-controlled SQL migration scripts (001 -> 004)
├── lib/
│   ├── auth.tsx                 # Client AuthContext & session state
│   ├── data.ts                  # Date formatting, helpers, department definitions
│   ├── db.ts                    # PostgreSQL connection pool and query helpers
│   ├── store.tsx                # App state context & CRUD action dispatchers
│   ├── types.ts                 # Core TypeScript domain model definitions
│   └── server/
│       ├── guard.ts             # requireAuth() & requireAdmin() route guards
│       ├── mappers.ts           # DB snake_case <-> App camelCase mappers
│       ├── password.ts          # Password hashing & verification with bcryptjs
│       ├── repo.ts              # Central business logic and database access layer
│       └── session.ts           # Token/Cookie session verification
└── tailwind.config.ts           # Custom brand palette, slate canvas & status colors
```

---

## 3. Core Business & Security Rules

### A. Authorization & Access Control
1. **Route Protection**: All API routes (except `/api/auth/login`) MUST invoke `requireAuth()`. Admin-specific operations must invoke `requireAdmin()`.
2. **Project Visibility vs. Access**:
   - **Visibility**: All authenticated users can see the existence of all projects in `/projects` and on the dashboard.
   - **Access**: Only project members and Admins can access project details, tasks inside the project, or download project documents.
   - **Server-side Enforcement**: Endpoints (`/api/projects/[id]`, `/api/documents/[id]`) MUST enforce this check on the server, not just in UI.

### B. Mandatory Project Association for Documents
- Every document MUST belong to a valid `projectId`. Orphan documents are strictly disallowed.
- Document binaries (`fileData` base64, `fileName`, `fileSize`, `mimeType`) are stored and accessible only to authorized project members.

### C. Personal Credentials & Privacy
- **Self-Serve Only**: Only the user themselves can view or change their first name, last name, work email, and password via `/settings`.
- **Admin Boundaries**: Admins can promote/demote roles, assign departments, and deactivate accounts, but CANNOT change or inspect another employee's private password or personal details.
- **Password Security**: Passwords must always be hashed using `hashPassword()` from `lib/server/password.ts`. Never store or log plaintext passwords.

### D. Tasks & Roles
- **Regular Employees**: On `/tasks`, only tasks assigned to them are displayed.
- **Admins**: See all company tasks across all projects with a smart filter toolbar (search, assignee, project, priority, status).

---

## 4. Coding Conventions & Best Practices

1. **Database Queries**:
   - ALWAYS use parameterized queries with `$1, $2, ...` to prevent SQL injection.
   - Example: `await query("SELECT * FROM tasks WHERE project_id = $1", [projectId]);`
2. **Data Mapping**:
   - Database columns use `snake_case`. Frontend TypeScript interfaces use `camelCase`.
   - Always run raw DB rows through `lib/server/mappers.ts` before returning in API responses.
3. **UI Components & Badges**:
   - Use `StatusBadge` for Task/Project statuses (`To Do`, `In Progress`, `Review`, `Completed`, `Blocked`).
   - Use `PriorityBadge` for priorities (`Low`, `Medium`, `High`, `Urgent`).
   - Use `DepartmentBadge` for smart-colored department pills.
   - Avoid creating custom duplicate buttons/inputs — reuse `PrimaryButton`, `SecondaryButton`, `Field`, and `Panel` from `components/ui/`.

---

## 5. Development & Deployment Workflows

- **Dev Server**: `npm run dev` (starts on `http://localhost:3000`)
- **Typecheck / Build**: `npm run build`
- **Database Migrations**: Run SQL scripts in `db/migrations/` in sequential order (`001_init.sql`, `002_...`, `003_...`, `004_...`).
