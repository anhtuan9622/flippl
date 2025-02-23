/*
  # Fix shared_summaries and profiles relationship

  1. Changes
    - Create profiles for existing users if they don't exist
    - Update foreign key to reference profiles table
    - Ensure data integrity during migration

  2. Security
    - Maintain existing RLS policies
    - Add policy for public profile access
*/

-- First, ensure all auth users have corresponding profiles
INSERT INTO profiles (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Drop existing foreign key if it exists
ALTER TABLE shared_summaries
DROP CONSTRAINT IF EXISTS fk_user;

-- Update user_id to reference profiles
UPDATE shared_summaries ss
SET user_id = (
  SELECT p.id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.id = ss.user_id
);

-- Add new foreign key constraint
ALTER TABLE shared_summaries
ADD CONSTRAINT fk_shared_summaries_profile
FOREIGN KEY (user_id)
REFERENCES profiles (id)
ON DELETE CASCADE;

-- Ensure RLS policies are up to date
DROP POLICY IF EXISTS "Public can view valid shared summaries" ON shared_summaries;
CREATE POLICY "Public can view valid shared summaries"
  ON shared_summaries
  FOR SELECT
  TO anon
  USING (
    share_id IS NOT NULL AND
    expires_at > now()
  );

-- Add policy to allow profiles to be read by anyone
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);