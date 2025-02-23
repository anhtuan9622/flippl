/*
  # Add shared summaries table

  1. New Tables
    - `shared_summaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `share_id` (text, unique identifier for sharing)
      - `year` (integer)
      - `total_profit` (numeric)
      - `total_trades` (integer)
      - `trading_days` (integer)
      - `win_rate` (numeric)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS on `shared_summaries` table
    - Add policies for authenticated users to manage their shares
    - Add policy for public access to valid shares
*/

CREATE TABLE shared_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  share_id text UNIQUE NOT NULL,
  year integer NOT NULL,
  total_profit numeric NOT NULL,
  total_trades integer NOT NULL,
  trading_days integer NOT NULL,
  win_rate numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE shared_summaries ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own shared summaries
CREATE POLICY "Users can read own shared summaries"
  ON shared_summaries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create shared summaries
CREATE POLICY "Users can create shared summaries"
  ON shared_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their shared summaries
CREATE POLICY "Users can delete shared summaries"
  ON shared_summaries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow public access to valid shared summaries
CREATE POLICY "Public can view valid shared summaries"
  ON shared_summaries
  FOR SELECT
  TO anon
  USING (
    share_id IS NOT NULL AND
    expires_at > now()
  );