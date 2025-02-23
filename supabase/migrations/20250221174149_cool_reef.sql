/*
  # Update shared_summaries table and policies

  1. Changes
    - Add conditional table creation
    - Add conditional policy creation
    - Ensure idempotent execution
*/

-- Check if the table doesn't exist before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'shared_summaries'
  ) THEN
    -- Create shared_summaries table
    CREATE TABLE shared_summaries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      share_id text UNIQUE NOT NULL,
      year integer NOT NULL,
      total_profit numeric NOT NULL,
      total_trades integer NOT NULL,
      trading_days integer NOT NULL,
      win_rate numeric NOT NULL,
      created_at timestamptz DEFAULT now(),
      expires_at timestamptz DEFAULT (now() + interval '7 days'),
      CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users (id)
        ON DELETE CASCADE
    );

    -- Enable RLS
    ALTER TABLE shared_summaries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Users can read own shared summaries
  DROP POLICY IF EXISTS "Users can read own shared summaries" ON shared_summaries;
  CREATE POLICY "Users can read own shared summaries"
    ON shared_summaries
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  -- Users can create shared summaries
  DROP POLICY IF EXISTS "Users can create shared summaries" ON shared_summaries;
  CREATE POLICY "Users can create shared summaries"
    ON shared_summaries
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  -- Users can delete shared summaries
  DROP POLICY IF EXISTS "Users can delete shared summaries" ON shared_summaries;
  CREATE POLICY "Users can delete shared summaries"
    ON shared_summaries
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

  -- Public can view valid shared summaries
  DROP POLICY IF EXISTS "Public can view valid shared summaries" ON shared_summaries;
  CREATE POLICY "Public can view valid shared summaries"
    ON shared_summaries
    FOR SELECT
    TO anon
    USING (
      share_id IS NOT NULL AND
      expires_at > now()
    );
END $$;