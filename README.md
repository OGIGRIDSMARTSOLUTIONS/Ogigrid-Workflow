# Ogigrid Workflow

An internal work-management application for Ogigrid, backed by a real local
**PostgreSQL** database: Login/Signup, Roles (Admin/Employee + a protected
Primary Administrator), Projects, Tasks, Team Schedule, Daily Reports,
Meetings, Documents, Employees, personal Notifications, and a Dashboard.

## Architecture

```
Browser (React client components)
   │  fetch() — no DB credentials ever reach the browser
   ▼
Next.js Route Handlers (app/api/**/route.ts)
   │  every route calls requireAuth()/requireAdmin() first
   ▼
lib/server/repo.ts  (data-access + business logic layer)
   │
   ▼
lib/db.ts  (pg connection pool)
   │
   ▼
Local PostgreSQL  (db/migrations/001_init.sql)
```

- `lib/store.tsx` / `lib/auth.tsx` — client-side React Context. They no
  longer hold data themselves; they fetch from `/api/state` and call the
  API for every mutation, then refetch so every page stays in sync.
- `lib/server/repo.ts` — the only place that talks SQL. All notification
  and activity-feed side effects (task assigned, report submitted, etc.)
  live here, next to the queries that trigger them.
- `lib/server/session.ts` — cookie-based sessions backed by a `sessions`
  table (not localStorage). The cookie is `httpOnly`, so client-side
  JavaScript can't read it.
- `lib/server/guard.ts` — `requireAuth()` / `requireAdmin()`, called at the
  top of every API route. Permissions are enforced **server-side**, not
  just by hiding buttons in the UI.
- Passwords are hashed with **bcrypt** (`lib/server/password.ts`) — nothing
  plaintext is ever stored or sent to the browser.

## Manual setup you need to do

**1. Install PostgreSQL** (if you don't already have it) — e.g. on macOS:
`brew install postgresql@16 && brew services start postgresql@16`. On
Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`.

**2. Create a database and user** (adjust the password to your own):

```bash
psql postgres -c "ALTER USER postgres PASSWORD 'postgres';"
psql postgres -c "CREATE DATABASE ogigrid_workflow;"
```

(Or use whatever Postgres user/role you already have — the app doesn't
require a user named `postgres`.)

**3. Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to match your local database, e.g.:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ogigrid_workflow
```

**4. Install dependencies and run the migration:**

```bash
npm install
npm run db:migrate
```

This runs every `.sql` file in `db/migrations/` in order (currently just
`001_init.sql`, which creates all tables/constraints). It's safe to run
again later — every statement uses `IF NOT EXISTS`.

**5. Start the app:**

```bash
npm run dev
```

Open `http://localhost:3000`. Since the database is empty, you'll land on
a "Create Workspace" screen — the account you create there becomes the
permanent **Primary Administrator**.

## What's real vs. what's still MVP-level

**Real:**
- Data lives in PostgreSQL — verified by creating accounts/projects/tasks,
  killing the app process entirely, starting a brand-new process, and
  confirming login + all data survived unchanged.
- Passwords are bcrypt-hashed; the connection string and all queries stay
  server-side; the browser only ever talks to `/api/*`.
- Every mutating API route re-checks the caller's role from their session
  — an Employee calling the Admin-only endpoints directly (not through the
  UI) gets a `403`, not just a hidden button.
- The Primary Administrator (the very first account created) cannot be
  removed, demoted, or deactivated by anyone — enforced by both a
  Postgres unique index (`one_primary_admin`, tested to reject a second
  primary admin at the database level) and application-level checks in
  every relevant route.
- Employee removal is a **soft delete** (`status = 'Inactive'`): the
  account can no longer log in, but their completed tasks, daily reports,
  and activity history stay intact and attributed to them. Their
  unfinished tasks are unassigned or reassigned (your choice in the UI)
  and their project memberships are cleared.
- Project progress is `completed tasks ÷ total tasks × 100`, computed live
  from the `tasks` table — verified end-to-end going 0%→25%→50%→75%→100%
  as tasks were marked Completed, with the project auto-flipping to
  "Completed" status at 100%.
- Notifications are rows in a `notifications` table with a `user_id`
  column — verified that only the intended recipient's session ever sees
  their notifications (each account only ever received its own).

**Still MVP-level (by design, called out explicitly rather than hidden):**
- No connection pooling tuning, rate limiting, or CSRF token beyond
  `sameSite: "lax"` cookies — fine for an internal tool, not hardened for
  a public-facing product.
- No database migrations *framework* (no rollback/versioning table) — just
  a simple, reproducible, ordered list of `.sql` files. Good enough for
  this stage; consider a real migration tool if the schema starts
  changing frequently with a team.
- No connection to Supabase yet, by design — the whole point of the
  `lib/db.ts` → `lib/server/repo.ts` layering is that switching to Supabase
  later should only mean changing `DATABASE_URL` (Supabase is Postgres) and
  possibly swapping `pg` for `@supabase/supabase-js` inside `lib/db.ts` —
  the API routes and everything above them stay the same.

## Project structure

```
db/migrations/001_init.sql   Full schema: employees, sessions, projects,
                              project_members, tasks, meetings,
                              meeting_attendees, documents, daily_reports,
                              notifications, activity
scripts/migrate.js           Dependency-free runner for db/migrations/*.sql

lib/db.ts                    pg Pool (server-only)
lib/server/
  password.ts                 bcrypt hash/verify
  mappers.ts                  DB row -> app TS type conversion
  session.ts                  httpOnly cookie session, backed by `sessions`
  guard.ts                    requireAuth() / requireAdmin()
  repo.ts                     all queries + notification/activity side effects
lib/store.tsx                 client Context — fetches /api/state, calls API
lib/auth.tsx                  client Context — calls /api/auth/*
lib/types.ts                  shared TS types (Employee has no password field)

app/api/
  auth/{signup,login,logout,me}
  state                        aggregate, role-scoped read
  employees, employees/[id]    admin-only manage
  account                      self-service profile edit / delete
  projects, projects/[id], projects/[id]/members(/[employeeId])
  tasks, tasks/[id]
  meetings, meetings/[id]
  documents, documents/[id]
  daily-reports
  notifications/[id]/read, notifications/mark-all-read

app/{dashboard,projects,tasks,schedule,meetings,documents,daily-reports,
     employees,settings,login}   pages (unchanged visual design)
```

## Getting started (quick reference)

```bash
cp .env.example .env      # then edit DATABASE_URL
npm install
npm run db:migrate
npm run dev
```

Requires Node.js 18.18+ and a running local PostgreSQL server.
