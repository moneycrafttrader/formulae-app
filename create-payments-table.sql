-- ============================================
-- PAYMENTS TABLE
-- Stores Razorpay payment orders & results
-- ============================================

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('1m', '6m', '12m')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);

-- ============================================
-- ADD MISSING COLUMNS (if table already exists)
-- Run this if you need to add columns to existing table
-- ============================================

-- Add columns if they don't exist (safe to run multiple times)
DO $$ 
BEGIN
  -- Add user_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add status check constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'payments' 
    AND constraint_name = 'payments_status_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'completed', 'failed'));
  END IF;

  -- Add plan check constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'payments' 
    AND constraint_name = 'payments_plan_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_plan_check 
    CHECK (plan IN ('1m', '6m', '12m'));
  END IF;

  -- Ensure currency has default value
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'currency' 
    AND column_default IS NULL
  ) THEN
    ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'INR';
  END IF;

  -- Ensure status has default value
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'status' 
    AND column_default IS NULL
  ) THEN
    ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending';
  END IF;
END $$;

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- (reuse if already exists, or create)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

-- Policy: Users can view only their own payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own payments
CREATE POLICY "Users can insert own payments"
  ON payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own payments (if needed)
CREATE POLICY "Users can update own payments"
  ON payments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: Webhook uses service_role key which bypasses RLS
-- So webhook can update any payment regardless of RLS policies

-- ============================================
-- VERIFY TABLE STRUCTURE
-- Run this to check the table columns
-- ============================================
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable,
--   column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'payments'
-- ORDER BY ordinal_position;
