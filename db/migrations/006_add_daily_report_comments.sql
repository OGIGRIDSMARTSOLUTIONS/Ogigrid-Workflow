<<<<<<< HEAD
CREATE TABLE IF NOT EXISTS daily_report_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
=======
-- Comments thread on daily reports for team feedback and discussion
CREATE TABLE IF NOT EXISTS daily_report_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  body       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
>>>>>>> 4b5b146cb59da56315b0b76f846056cfb5f4e25c
);

CREATE INDEX IF NOT EXISTS daily_report_comments_report_idx ON daily_report_comments(report_id);
