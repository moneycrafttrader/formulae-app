-- ============================================
-- DEVICE_LOCK TABLE
-- Stores active device sessions for single-device login
-- ============================================

-- Create device_lock table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_lock (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on session_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_lock_session_token ON device_lock(session_token);

-- Create index on user_id (already primary key, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_device_lock_user_id ON device_lock(user_id);

-- Note: No RLS policies needed - this table is only accessed via service_role key
-- The primary key on user_id ensures only one active session per user

-- ============================================
-- VERIFY TABLE STRUCTURE
-- ============================================
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable,
--   column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'device_lock'
-- ORDER BY ordinal_position;
