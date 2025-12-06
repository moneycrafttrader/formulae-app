-- ============================================
-- MIGRATION: Add last_session_token column to profiles table
-- Run this if your profiles table already exists but is missing the column
-- ============================================

-- Add last_session_token column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_session_token TEXT;

-- Create index on last_session_token for faster session validation
CREATE INDEX IF NOT EXISTS idx_profiles_session_token ON profiles(last_session_token);

