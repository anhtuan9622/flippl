/*
  # Implement trade pair validation

  1. Changes
    - Add validation to ensure both buy and sell transactions exist for each symbol
    - Only calculate profit when both transactions are present
    - Prevent saving incomplete trade pairs
*/

-- Function to validate trade pairs
CREATE OR REPLACE FUNCTION validate_trade_pairs(p_trade_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_symbol record;
  v_has_buy boolean;
  v_has_sell boolean;
BEGIN
  -- Check each symbol has both buy and sell transactions
  FOR v_symbol IN 
    SELECT DISTINCT symbol 
    FROM trade_entries 
    WHERE trade_id = p_trade_id
  LOOP
    SELECT 
      EXISTS (
        SELECT 1 
        FROM trade_entries 
        WHERE trade_id = p_trade_id 
        AND symbol = v_symbol.symbol 
        AND transaction_type = 'Buy'
      ),
      EXISTS (
        SELECT 1 
        FROM trade_entries 
        WHERE trade_id = p_trade_id 
        AND symbol = v_symbol.symbol 
        AND transaction_type = 'Sell'
      )
    INTO v_has_buy, v_has_sell;

    IF NOT (v_has_buy AND v_has_sell) THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- Function to calculate trade profit with validation
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
  v_is_valid boolean;
BEGIN
  -- Validate trade pairs
  SELECT validate_trade_pairs(NEW.trade_id) INTO v_is_valid;

  IF NOT v_is_valid THEN
    -- If validation fails, set profit and trades to 0
    UPDATE trades
    SET 
      profit = 0,
      trades_count = 0
    WHERE id = NEW.trade_id;
    
    RETURN NEW;
  END IF;

  -- Calculate profit for each symbol with complete pairs
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

    -- Only add to totals if we have both buy and sell
    IF v_buy_amount > 0 AND v_sell_amount > 0 THEN
      -- Add profit/loss for this symbol
      v_total_profit := v_total_profit + (v_sell_amount - v_buy_amount);
      -- Count this as a completed trade
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