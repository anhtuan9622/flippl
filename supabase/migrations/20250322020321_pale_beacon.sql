/*
  # Add notes and tags to trades and trade_entries tables

  1. Changes
    - Add notes column to trades table
    - Add tags column to trades table
    - Add notes column to trade_entries table
    - Add tags column to trade_entries table

  2. Security
    - Maintain existing RLS policies
*/

-- Add columns to trades table
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS tags text[];

-- Add columns to trade_entries table
ALTER TABLE trade_entries
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS tags text[];