/*
  # Fix trade entries updates

  1. Changes
    - Add trigger to update trade summary after trade entry changes
    - Add function to calculate trade profit and update summary
*/

-- Function to calculate trade profit
CREATE OR REPLACE FUNCTION calculate_trade_profit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_profit numeric := 0;
  v_total_trades integer := 0;
BEGIN
  -- Calculate total profit and trades count
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*)
  INTO v_total_profit, v_total_trades
  FROM trade_entries
  WHERE trade_id = NEW.trade_id;

  -- Update the trade record
  UPDATE trades
  SET 
    profit = v_total_profit,
    trades_count = v_total_trades
  WHERE id = NEW.trade_id;

  RETURN NEW;
END;
$$;

-- Create trigger for trade entries
DROP TRIGGER IF EXISTS update_trade_summary ON trade_entries;
CREATE TRIGGER update_trade_summary
  AFTER INSERT OR UPDATE OR DELETE ON trade_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trade_profit();