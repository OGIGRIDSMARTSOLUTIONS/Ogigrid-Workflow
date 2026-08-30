-- Add file storage and metadata columns to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_data TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Enforce project association for any future documents
-- If any orphan documents exist, clean or assign them
DELETE FROM documents WHERE project_id IS NULL;

ALTER TABLE documents
  ALTER COLUMN project_id SET NOT NULL;
