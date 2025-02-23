/*
  # Update profile sharing system
  
  1. Changes
    - Drop shared_summaries table and its references
    - Ensure profiles has share_id column
    - Update RLS policies for profiles and trades
  
  2. Security
    - Update policies for public access to shared profiles
    - Update policies for authenticated users
    - Update policies for trades visibility
*/

-- First, ensure we drop any remaining references to shared_summaries
DROP TABLE IF EXISTS shared_summaries CASCADE;

-- Ensure profiles has share_id column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'share_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN share_id text UNIQUE;
  END IF;
END $$;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read shared profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own share stats" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies
CREATE POLICY "Anyone can read shared profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (share_id IS NOT NULL);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update trades policy for public access
DROP POLICY IF EXISTS "Public can view trades of shared summaries" ON trades;
DROP POLICY IF EXISTS "Public can view trades of shared profiles" ON trades;

CREATE POLICY "Public can view trades of shared profiles"
  ON trades
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = trades.user_id
      AND profiles.share_id IS NOT NULL
    )
  );