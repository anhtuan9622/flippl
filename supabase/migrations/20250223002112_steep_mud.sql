/*
  # Move share_id to profiles table

  1. Changes
    - Add share_id column to profiles table
    - Move existing share_ids from shared_summaries to profiles
    - Drop shared_summaries table
    - Update RLS policies

  2. Security
    - Add RLS policies for share_id in profiles table
    - Ensure public access to shared profiles
*/

-- Add share_id column to profiles
ALTER TABLE profiles
ADD COLUMN share_id text UNIQUE,
ADD COLUMN total_profit numeric DEFAULT 0,
ADD COLUMN total_trades integer DEFAULT 0,
ADD COLUMN trading_days integer DEFAULT 0,
ADD COLUMN win_rate numeric DEFAULT 0,
ADD COLUMN stats_updated_at timestamptz DEFAULT now();

-- Move existing share_ids and stats from shared_summaries to profiles
UPDATE profiles p
SET 
  share_id = ss.share_id,
  total_profit = ss.total_profit,
  total_trades = ss.total_trades,
  trading_days = ss.trading_days,
  win_rate = ss.win_rate,
  stats_updated_at = ss.updated_at
FROM shared_summaries ss
WHERE p.id = ss.user_id;

-- Drop shared_summaries table and its policies
DROP TABLE IF EXISTS shared_summaries CASCADE;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;

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

-- Add policy for updating share stats
CREATE POLICY "Users can update own share stats"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update trades policy for public access
DROP POLICY IF EXISTS "Public can view trades of shared summaries" ON trades;

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