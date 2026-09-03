-- Workspace-level key/value settings (invite code, workspace name, etc.)
CREATE TABLE IF NOT EXISTS workspace_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Default invite code — admin should change this
INSERT INTO workspace_settings (key, value)
VALUES ('invite_code', 'OGIGRID2026')
ON CONFLICT (key) DO NOTHING;
