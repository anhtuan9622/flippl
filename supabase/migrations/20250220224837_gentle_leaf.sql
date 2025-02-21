/*
  # Create trades table for storing daily trading data

  1. New Tables
    - `trades`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date, not null)
      - `profit` (numeric, not null)
      - `trades_count` (integer, not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `trades` table
    - Add policies for authenticated users to:
      - Read their own trades
      - Insert their own trades
      - Update their own trades
      - Delete their own trades
*/

CREATE TABLE trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  profit numeric NOT NULL,
  trades_count integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own trades
CREATE POLICY "Users can read own trades"
  ON trades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own trades
CREATE POLICY "Users can insert own trades"
  ON trades
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own trades
CREATE POLICY "Users can update own trades"
  ON trades
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own trades
CREATE POLICY "Users can delete own trades"
  ON trades
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);