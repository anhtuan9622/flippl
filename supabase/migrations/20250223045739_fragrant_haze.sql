/*
  # Add browser and device logging

  1. Changes
    - Add columns to profiles table:
      - last_browser: Browser information
      - last_device: Device information
      - last_login_at: Timestamp of last login
      - login_count: Number of times logged in

  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_browser text,
ADD COLUMN IF NOT EXISTS last_device text,
ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;