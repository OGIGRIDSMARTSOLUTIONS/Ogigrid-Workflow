-- Add platform and meeting_link columns to meetings table
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Google Meet',
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;
