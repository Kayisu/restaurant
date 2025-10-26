-- Migration: Remove customer role from system
-- Customer data model (customers table) remains, but customer cannot login

-- Step 1: Check if any users have role_id = 3 (customer)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE role_id = 3) THEN
    RAISE EXCEPTION 'Cannot remove customer role: users with role_id = 3 exist. Please reassign or delete these users first.';
  END IF;
END $$;

-- Step 2: Delete customer role from roles table (if exists)
DELETE FROM roles WHERE role_id = 3 OR role_name = 'customer';

-- Step 3: Add CHECK constraint to users table to prevent role_id = 3
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS check_user_role_valid;

ALTER TABLE users 
  ADD CONSTRAINT check_user_role_valid 
  CHECK (role_id IN (1, 2));

-- Note: customers table remains unchanged
-- It stores customer information (name, phone, email) for reservations and orders
-- But customers cannot login to the system (no user account with role_id = 3)
