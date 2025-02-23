/*
  # Remove stats columns from profiles table
  
  1. Changes
    - Remove columns that store calculated stats from profiles table since they can be computed from trades table:
      - total_profit
      - total_trades
      - trading_days
      - win_rate
      - stats_updated_at
*/

-- Remove stats columns from profiles table
ALTER TABLE profiles
DROP COLUMN total_profit,
DROP COLUMN total_trades,
DROP COLUMN trading_days,
DROP COLUMN win_rate,
DROP COLUMN stats_updated_at;