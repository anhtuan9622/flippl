/*
  # Update shared_summaries table structure

  1. Changes
    - Remove expires_at column since links are now permanent
    - Add updated_at column for tracking last update
    - Add unique constraint on user_id to ensure one summary per user
    - Clean up duplicate entries before adding constraint

  2. Security
    - Update RLS policies to remove expiration check
*/

-- First drop the policy that depends on expires_at
DROP POLICY IF EXISTS "Public can view valid shared summaries" ON shared_summaries;

-- Now we can safely remove expires_at and add updated_at
ALTER TABLE shared_summaries
DROP COLUMN IF EXISTS expires_at,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Clean up duplicate entries by keeping only the most recent one for each user
DELETE FROM shared_summaries a USING (
  SELECT user_id, MAX(created_at) as max_created_at
  FROM shared_summaries
  GROUP BY user_id
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id
AND a.created_at < b.max_created_at;

-- Now we can safely add the unique constraint
ALTER TABLE shared_summaries
ADD CONSTRAINT unique_user_summary UNIQUE (user_id);

-- Create new public view policy without expiration check
CREATE POLICY "Public can view valid shared summaries"
  ON shared_summaries
  FOR SELECT
  TO anon
  USING (share_id IS NOT NULL);

-- Add policy for users to update their own summaries
DROP POLICY IF EXISTS "Users can update shared summaries" ON shared_summaries;
CREATE POLICY "Users can update shared summaries"
  ON shared_summaries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);