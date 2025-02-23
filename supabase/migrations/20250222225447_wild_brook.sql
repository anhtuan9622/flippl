/*
  # Add public access policy for shared trades

  1. Changes
    - Add a new RLS policy to allow public access to trades for users who have shared their summaries
    - The policy joins with shared_summaries table to verify the trade belongs to a user who has shared their data

  2. Security
    - Only allows read access to trades that belong to users who have explicitly shared their data
    - No modification of trades is allowed for public users
*/

-- Add policy to allow public access to trades for shared summaries
CREATE POLICY "Public can view trades of shared summaries"
  ON trades
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM shared_summaries
      WHERE shared_summaries.user_id = trades.user_id
    )
  );