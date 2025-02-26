/*
  # Implement trade profit calculation

  1. Changes
    - Add function to calculate trade profit based on buy/sell pairs
    - Update trigger to properly handle profit calculation
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
  v_symbol record;
  v_buy_amount numeric;
  v_sell_amount numeric;
BEGIN
  -- Calculate profit for each symbol
  FOR v_symbol IN 
    SELECT DISTINCT symbol 
    FROM trade_entries 
    WHERE trade_id = NEW.trade_id
  LOOP
    -- Calculate total buy amount
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_buy_amount
    FROM trade_entries
    WHERE trade_id = NEW.trade_id
    AND symbol = v_symbol.symbol
    AND transaction_type = 'Buy';

    -- Calculate total sell amount
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_sell_amount
    FROM trade_entries
    WHERE trade_id = NEW.trade_id
    AND symbol = v_symbol.symbol
    AND transaction_type = 'Sell';

    -- Add profit/loss for this symbol
    v_total_profit := v_total_profit + (v_sell_amount - v_buy_amount);
    
    -- Count completed trades (pairs of buy/sell)
    IF v_buy_amount > 0 AND v_sell_amount > 0 THEN
      v_total_trades := v_total_trades + 1;
    END IF;
  END LOOP;

  -- Update the trade record
  UPDATE trades
  SET 
    profit = v_total_profit,
    trades_count = v_total_trades
  WHERE id = NEW.trade_id;

  RETURN NEW;
END;
$$;

-- Recreate trigger for trade entries
DROP TRIGGER IF EXISTS update_trade_summary ON trade_entries;
CREATE TRIGGER update_trade_summary
  AFTER INSERT OR UPDATE OR DELETE ON trade_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trade_profit();