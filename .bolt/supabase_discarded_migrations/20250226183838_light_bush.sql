/*
  # Add trade summary trigger

  1. Changes
    - Add trigger to automatically update trade summary after trade entries change
    - Calculate total profit and trades count from trade entries
    - Update parent trade record with calculated values

  2. Security
    - Trigger runs with security definer to ensure proper access
*/

-- Function to calculate trade summary
CREATE OR REPLACE FUNCTION calculate_trade_summary(trade_id_param uuid)
RETURNS TABLE (total_profit numeric, total_trades bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(trade_profit), 0) as total_profit,
    COUNT(*) as total_trades
  FROM trade_entries
  WHERE trade_id = trade_id_param
  AND transaction_type = 'Sell';
END;
$$;

-- Function to update trade summary
CREATE OR REPLACE FUNCTION update_trade_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  summary_record RECORD;
BEGIN
  -- Get the trade_id based on the operation
  WITH trade_id_cte AS (
    SELECT 
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.trade_id
        ELSE NEW.trade_id
      END as trade_id
  )
  SELECT * FROM calculate_trade_summary((SELECT trade_id FROM trade_id_cte))
  INTO summary_record;

  -- Update the trades table
  UPDATE trades
  SET 
    profit = summary_record.total_profit,
    trades_count = summary_record.total_trades,
    updated_at = now()
  WHERE id = (
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.trade_id
      ELSE NEW.trade_id
    END
  );

  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trade_entries_summary_trigger ON trade_entries;

-- Create new trigger
CREATE TRIGGER trade_entries_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trade_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_summary();