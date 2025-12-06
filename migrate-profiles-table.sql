-- ============================================
-- COMPLETE MIGRATION: Update profiles table with all required columns
-- Run this to ensure your profiles table has all necessary columns
-- ============================================

-- Add last_session_token column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_session_token TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add created_at column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add role column if it doesn't exist (with default and constraint)
DO $$
BEGIN
    -- Check if role column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        -- Add role column
        ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
        
        -- Add check constraint if it doesn't exist
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- Set default values for existing rows if columns were just added
UPDATE profiles 
SET 
    updated_at = NOW() 
WHERE updated_at IS NULL;

UPDATE profiles 
SET 
    created_at = NOW() 
WHERE created_at IS NULL;

UPDATE profiles 
SET 
    role = 'user' 
WHERE role IS NULL OR role = '';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_session_token ON profiles(last_session_token);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

