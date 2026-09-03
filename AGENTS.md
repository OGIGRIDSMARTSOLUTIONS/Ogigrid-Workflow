# AGENTS.md — Ogigrid Workflow Development Guidelines

Welcome to the **Ogigrid Workflow** repository. This document is the persistent specification, architectural guide, and coding convention manual for AI agents and developers working on this codebase.

---

## 1. Project Overview & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI & Styling**: React 18, Tailwind CSS, Headless Form Controls & Badges
- **Language**: TypeScript (strict typing across all models)
- **Database**: PostgreSQL with parameterized queries via `lib/db.ts`
- **State Management**: React Context + optimistic mutations in `lib/store.tsx`
- **Authentication & Security**: Custom session cookies + bcrypt-hashed passwords (`lib/server/session.ts`, `lib/server/password.ts`)
- **Hosting**: Production commonly on Vercel; database via `DATABASE_URL` (e.g. Supabase Postgres)

---

## 2. Directory Structure & Key Files

```
├── app/
│   ├── api/
│   │   ├── account/route.ts              # Self-service account / password updates
│   │   ├── auth/                         # login, signup, logout, me, forgot/reset password
│   │   ├── daily-reports/                # Standups + comments
│   │   ├── documents/                    # Project-linked uploads (size/MIME limits)
│   │   ├── employees/                    # Team directory & admin workspace tools
│   │   ├── meetings/                     # Scheduled meetings
│   │   ├── notifications/                # Mark read / mark all read
│   │   ├── projects/                     # Project CRUD + members
│   │   ├── state/route.ts                # Bootstrap payload for the client store
│   │   ├── tasks/                        # Task CRUD & status/progress updates
│   │   └── workspace/invite-code/        # Admin invite-code get/update
│   ├── daily-reports/, dashboard/, documents/, employees/, meetings/
│   ├── projects/, schedule/, settings/, tasks/
│   ├── login/, forgot-password/, reset-password/
├── components/
│   ├── dashboard/, layout/, schedule/, tasks/, daily-reports/, ui/, auth/
├── db/migrations/                        # Ordered SQL (001 → 009+)
├── lib/
│   ├── auth.tsx                          # Client AuthContext
│   ├── clientSession.ts                  # Idle logout message / browser data clear
│   ├── data.ts                           # Helpers, badges data, task progress normalize
│   ├── db.ts                             # pg Pool + query helpers
│   ├── emailValidation.ts                # Light email format + typo checks
│   ├── passwordValidation.ts             # Shared password policy
│   ├── sessionTiming.ts                  # IDLE_TIMEOUT_MS, MAX_DAILY_REPORTS_PER_DAY
│   ├── store.tsx                         # App state + API mutators
│   ├── types.ts                          # Domain models
│   ├── useIdleLogout.ts                  # Client idle logout hook
│   └── server/
│       ├── fileSafety.ts                 # MIME allow/deny + max upload size
│       ├── guard.ts                      # requireAuth() / requireAdmin()
│       ├── ids.ts                        # UUID validation helpers
│       ├── mappers.ts                    # snake_case DB → camelCase app
│       ├── password.ts                   # hashPassword / verifyPassword
│       ├── rateLimit.ts                  # In-memory rate limits (auth routes)
│       ├── repo.ts                       # Business logic + DB access
│       └── session.ts                    # Session create / slide / destroy
├── scripts/migrate.js                    # Runs db/migrations/*.sql in order
└── .cursor/rules/workflow-rules.mdc      # Always-on Cursor project rules
```

---

## 3. Core Business & Security Rules

### A. Authorization & Access Control
1. **Route Protection**: All protected API routes MUST call `requireAuth()`. Admin-only operations MUST call `requireAdmin()`.
2. **Public auth routes** (no session required): login, signup, forgot-password, reset-password, logout, and session discovery (`/api/auth/me`).
3. **Project Visibility vs. Access**:
   - **Visibility**: All authenticated users can see that projects exist (list / dashboard).
   - **Access**: Only project members and Admins may open project details, project tasks, or download project documents.
   - Enforce on the server (`/api/projects/[id]`, `/api/documents/[id]`, etc.), not only in the UI.
4. **Two Admins**: Multiple users may have `role = 'Admin'`. One account may be `isPrimaryAdmin` (cannot be deleted/demoted/deactivated). Other Admins have the same operational power otherwise.

### B. Signup & Invite Code
1. After the first account exists, public signup **requires a workspace invite code**.
2. Invite code is stored in `workspace_settings` (`key = 'invite_code'`). Default seed: `OGIGRID2026`.
3. Admins manage the code in **Settings → Invite Code** via `/api/workspace/invite-code`.
4. The first account in an empty workspace skips the invite code and becomes Primary Admin.
5. New public signups after the first account are forced to **Employee** (Partner); Admins promote roles later.

### C. Passwords
1. Use shared helpers in `lib/passwordValidation.ts` everywhere passwords are set:
   - Signup, admin-created employees, settings password change, reset-password.
2. **Policy**: 8+ characters, at least one uppercase, one lowercase, one number. **Special characters optional.** Max length 128.
3. Always hash with `hashPassword()` from `lib/server/password.ts`. Never store or log plaintext.
4. **Password change in Settings** must revoke **all** sessions for that user, then create a fresh session for the current browser (`destroyAllSessionsForEmployee` + `createSession`).
5. Forgot-password reset already clears all sessions for that employee.

### D. Email Validation
1. Use `validateEmail()` from `lib/emailValidation.ts` on signup, admin employee create, account email update, and forgot-password (client may show typos; forgot-password API still returns a generic success message for privacy).
2. Light checks only: format + common domain typos (e.g. `gmail.co` → suggest `gmail.com`).

### E. Sessions & Idle Timeout
1. Shared constant: `IDLE_TIMEOUT_MS` in `lib/sessionTiming.ts` (**15 minutes**).
2. **Client**: `useIdleLogout` logs out after 15 minutes with no click/key/touch; message via `clientSession.ts`.
3. **Server**: Session cookie/DB row slides on each authenticated request and expires after 15 minutes without requests (`lib/server/session.ts`). Do not reintroduce a multi-day server TTL without an explicit product decision.

### F. Documents
1. Every document MUST belong to a valid `projectId`.
2. Enforce upload limits via `lib/server/fileSafety.ts`:
   - Max size **10 MB** (client + server; server estimates from base64 data URL).
   - Dangerous MIME types blocked; allowlist for PDF/images/office/archives/text.
3. Document binaries are stored as base64 fields in Postgres for this stage of the product.

### G. Tasks — Status & Progress
1. Always normalize with `normalizeTaskProgressStatus()` from `lib/data.ts` on **create and update** in `lib/server/repo.ts` (not only in the UI).
2. Rules of thumb:
   - `Completed` ⇒ progress `100`
   - Progress `100` on In Progress/Review ⇒ `Completed`
   - Switching to `To Do` clears leftover 100% to `0`
   - Progress > 0 while `To Do` ⇒ `In Progress`
   - `Blocked` cannot sit at 100% (cap at 99)
3. Project progress is the average of task progress; keep task fields honest so project % stays correct.

### H. Daily Reports
1. Max **3 reports per employee per calendar day** (`MAX_DAILY_REPORTS_PER_DAY` in `lib/sessionTiming.ts`).
2. Enforce in `createDailyReport` / date changes on update, and give clear client feedback on `/daily-reports`.
3. Editing an existing report is allowed; creating a 4th for the same day is not.

### I. IDs & Request Hygiene
1. Dynamic route IDs and related body IDs (project, assignee, attendees, etc.) must be validated with `lib/server/ids.ts` (`isUuid` / `invalidUuidResponse`).
2. Invalid format ⇒ **400**. Valid UUID but missing row ⇒ **404**. Do not let Postgres UUID cast errors become raw **500**s.

### J. Personal Credentials & Privacy
1. Only the user may change their name, email, and password via `/settings` (`/api/account`).
2. Admins may change role, job title, status, departments — not another user’s password or personal identity fields.
3. Job titles are display strings (`job_title` / `jobTitle`); show them in uppercase via `displayJobTitle()`.

### K. Tasks Visibility by Role
1. Regular employees: `/tasks` shows tasks assigned to them.
2. Admins: see all company tasks with filters.

---

## 4. Coding Conventions & Best Practices

1. **Database Queries**: Always parameterized (`$1, $2, ...`) in `lib/server/repo.ts` / `lib/db.ts`.
2. **Mapping**: DB `snake_case` → app `camelCase` via `lib/server/mappers.ts` before API responses.
3. **UI**: Reuse `Panel`, `Modal`, `Field`, `PrimaryButton`, `SecondaryButton`, `StatusBadge`, `PriorityBadge`, `DepartmentBadge` from `components/ui/`.
4. **Shared validators**: Prefer `lib/emailValidation.ts`, `lib/passwordValidation.ts`, `lib/server/ids.ts`, `lib/server/fileSafety.ts`, `lib/data.ts` normalizers — do not invent one-off copies in routes.
5. **Brand / layout**: Follow `tailwind.config.ts` and the dark navy sidebar in `components/layout/Sidebar.tsx`.

---

## 5. Development & Deployment Workflows

- **Dev**: `npm run dev` → `http://localhost:3000`
- **Build**: `npm run build`
- **Migrations**: `npm run db:migrate` (runs `db/migrations/*.sql` in order via `scripts/migrate.js`)
  - Current set includes through **009_add_workspace_settings.sql** (invite code table)
- **Env**: `DATABASE_URL` required; email reset needs `RESEND_API_KEY` (+ optional from-address vars)
- **Deploy**: Push to the company GitHub remote / deploy host (e.g. Vercel). Migrations are **not** auto-run by the host — run `npm run db:migrate` against the production `DATABASE_URL` when schema changes.

---

## 6. Known Follow-ups (do not assume already done)

These may still be open from audits; confirm before claiming they are fixed:

- Scoping `/api/state` so Partners do not receive full company payloads
- Stronger rate limiting / CSRF / security headers
- Meeting past-date rules, loading states on all destructive actions, etc.
