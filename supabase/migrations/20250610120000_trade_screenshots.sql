/*
  # Trade screenshots storage

  1. New Tables
    - `trade_screenshots` - metadata for screenshots linked to trades

  2. Storage
    - `trade-screenshots` bucket (private)
    - RLS policies scoped to user folder: {user_id}/{trade_id}/...

  3. Security
    - Users can manage screenshots for their own trades only
*/

CREATE TABLE trade_screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX trade_screenshots_trade_id_idx ON trade_screenshots(trade_id);

ALTER TABLE trade_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trade screenshots"
  ON trade_screenshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade screenshots"
  ON trade_screenshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_screenshots.trade_id
      AND trades.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own trade screenshots"
  ON trade_screenshots
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload trade screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'trade-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own trade screenshots"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trade-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own trade screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'trade-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
