-- Ogigrid Workflow — initial schema
-- Run with: psql "$DATABASE_URL" -f db/migrations/001_init.sql
-- (or via `npm run db:migrate`, which runs every file in db/migrations in order)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Employees (the app's users). Soft-deleted via status/deactivated_at —
-- an employee is never hard-deleted so historical reports/activity that
-- reference them stay intact.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('Admin', 'Employee')),
  is_primary_admin BOOLEAN NOT NULL DEFAULT FALSE,
  departments      TEXT[] NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  deactivated_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one primary admin can exist at a time.
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_admin
  ON employees ((is_primary_admin))
  WHERE is_primary_admin = TRUE;

-- ---------------------------------------------------------------------
-- Sessions (cookie-based auth, backed by the database rather than
-- browser-only storage).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_employee_id_idx ON sessions(employee_id);

-- ---------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'To Do',
  start_date  DATE,
  deadline    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project <-> Employee membership (many-to-many)
CREATE TABLE IF NOT EXISTS project_members (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, employee_id)
);

CREATE INDEX IF NOT EXISTS project_members_employee_idx ON project_members(employee_id);

-- ---------------------------------------------------------------------
-- Tasks — always belong to a project; assignee is nullable (unassigned).
-- On employee deactivation, unfinished tasks are unassigned/reassigned by
-- the application layer rather than the database deleting anything.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id       UUID REFERENCES employees(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'To Do'
                     CHECK (status IN ('To Do', 'In Progress', 'Review', 'Completed', 'Blocked')),
  priority          TEXT NOT NULL DEFAULT 'Medium'
                     CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  start_date        DATE,
  duration_days     INTEGER NOT NULL DEFAULT 1,
  deadline          DATE,
  progress          INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id);

-- ---------------------------------------------------------------------
-- Meetings + attendees (many-to-many)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meetings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  date       DATE NOT NULL,
  time       TEXT NOT NULL DEFAULT '09:00',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  details    TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, employee_id)
);

CREATE INDEX IF NOT EXISTS meeting_attendees_employee_idx ON meeting_attendees(employee_id);

-- ---------------------------------------------------------------------
-- Documents (metadata records)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Daily reports — historical records, preserved even after an employee
-- is deactivated (ON DELETE RESTRICT would be too strict since we never
-- hard-delete employees; kept as a normal FK for referential integrity).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  worked_on    TEXT NOT NULL DEFAULT '',
  completed    TEXT NOT NULL DEFAULT '',
  remaining    TEXT NOT NULL DEFAULT '',
  blockers     TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_reports_employee_idx ON daily_reports(employee_id);

-- ---------------------------------------------------------------------
-- Notifications — always belong to exactly one recipient.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  related_type TEXT,
  related_id   UUID,
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, read);

-- ---------------------------------------------------------------------
-- Activity feed — company-wide history, not tied to one recipient.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
