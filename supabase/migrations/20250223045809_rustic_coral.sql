/*
  # Add increment_login_count function

  1. Changes
    - Add PostgreSQL function to safely increment login count
    
  2. Security
    - Function is marked as SECURITY DEFINER to run with elevated privileges
    - Restricted to authenticated users only
*/

CREATE OR REPLACE FUNCTION increment_login_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE profiles
  SET login_count = COALESCE(login_count, 0) + 1
  WHERE id = auth.uid()
  RETURNING login_count INTO new_count;
  
  RETURN new_count;
END;
$$;