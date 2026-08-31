-- Password reset tokens: short-lived, single-use tokens tied to an employee.
-- We store only a SHA-256 hash of the raw token (the raw token is what gets
-- emailed to the user), so a database leak alone can't be used to reset
-- anyone's account.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_employee_idx
  ON password_reset_tokens(employee_id);
