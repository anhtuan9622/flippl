-- Function to validate trade quantities
CREATE OR REPLACE FUNCTION validate_trade_quantities(p_trade_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_symbol record;
  v_buy_quantity numeric;
  v_sell_quantity numeric;
BEGIN
  -- Check each symbol has matching buy and sell quantities
  FOR v_symbol IN 
    SELECT DISTINCT symbol 
    FROM trade_entries 
    WHERE trade_id = p_trade_id
  LOOP
    -- Calculate total buy quantity
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_buy_quantity
    FROM trade_entries 
    WHERE trade_id = p_trade_id 
    AND symbol = v_symbol.symbol 
    AND transaction_type = 'Buy';

    -- Calculate total sell quantity
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_sell_quantity
    FROM trade_entries 
    WHERE trade_id = p_trade_id 
    AND symbol = v_symbol.symbol 
    AND transaction_type = 'Sell';

    -- If quantities don't match, return false
    IF v_buy_quantity != v_sell_quantity THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- Update calculate_trade_profit to include quantity validation
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
  v_quantities_match boolean;
BEGIN
  -- Validate trade pairs
  SELECT validate_trade_pairs(NEW.trade_id) INTO v_is_valid;
  
  -- Validate quantities match
  SELECT validate_trade_quantities(NEW.trade_id) INTO v_quantities_match;

  IF NOT v_is_valid OR NOT v_quantities_match THEN
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