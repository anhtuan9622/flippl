/*
  # Add Detailed Trade Entry Support

  1. Changes
    - Add entry_mode to trades table
    - Create trade_entries table for detailed buy/sell transactions
    - Add RLS policies for trade_entries
    - Create functions for profit calculation and summary updates

  2. New Tables
    - trade_entries
      - id (uuid, primary key)
      - trade_id (uuid, references trades)
      - transaction_type (text, Buy/Sell)
      - symbol (text)
      - quantity (integer)
      - price (numeric)
      - total_amount (numeric)
      - commission (numeric)
      - linked_buy_id (uuid)
      - trade_profit (numeric)
      - created_at (timestamptz)

  3. Security
    - Enable RLS on trade_entries
    - Add policies for CRUD operations
*/

-- Add entry_mode to trades table
ALTER TABLE trades
ADD COLUMN entry_mode text DEFAULT 'manual'
CHECK (entry_mode IN ('manual', 'detailed'));

-- Create trade_entries table
CREATE TABLE trade_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id uuid REFERENCES trades(id) ON DELETE CASCADE,
    transaction_type text CHECK (transaction_type IN ('Buy', 'Sell')),
    symbol text NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    price numeric NOT NULL CHECK (price > 0),
    total_amount numeric NOT NULL,
    commission numeric DEFAULT 0 CHECK (commission >= 0),
    linked_buy_id uuid REFERENCES trade_entries(id),
    trade_profit numeric,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trade_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_entries
CREATE POLICY "Users can read own trade entries"
    ON trade_entries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_entries.trade_id
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own trade entries"
    ON trade_entries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_entries.trade_id
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own trade entries"
    ON trade_entries
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_entries.trade_id
            AND trades.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_entries.trade_id
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own trade entries"
    ON trade_entries
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_entries.trade_id
            AND trades.user_id = auth.uid()
        )
    );

-- Function to calculate trade profit
CREATE OR REPLACE FUNCTION calculate_trade_profit(
    p_symbol text,
    p_quantity integer,
    p_sell_price numeric,
    p_commission numeric,
    p_trade_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_cost numeric := 0;
    v_remaining_quantity integer := p_quantity;
    v_buy_record record;
BEGIN
    FOR v_buy_record IN
        SELECT id, quantity, price, commission
        FROM trade_entries
        WHERE trade_id = p_trade_id
        AND symbol = p_symbol
        AND transaction_type = 'Buy'
        AND (linked_buy_id IS NULL OR id = linked_buy_id)
        ORDER BY created_at ASC
    LOOP
        IF v_remaining_quantity <= 0 THEN
            EXIT;
        END IF;

        IF v_buy_record.quantity <= v_remaining_quantity THEN
            v_total_cost := v_total_cost + (v_buy_record.quantity * v_buy_record.price) + v_buy_record.commission;
            v_remaining_quantity := v_remaining_quantity - v_buy_record.quantity;
        ELSE
            v_total_cost := v_total_cost + (v_remaining_quantity * v_buy_record.price) + 
                           (v_buy_record.commission * (v_remaining_quantity::numeric / v_buy_record.quantity::numeric));
            v_remaining_quantity := 0;
        END IF;
    END LOOP;

    RETURN (p_sell_price * p_quantity) - v_total_cost - p_commission;
END;
$$;

-- Function to update trade summary
CREATE OR REPLACE FUNCTION update_trade_summary(trade_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE trades 
    SET profit = COALESCE((
        SELECT SUM(trade_profit)
        FROM trade_entries
        WHERE trade_id = trade_id_param
        AND transaction_type = 'Sell'
    ), 0),
    trades_count = (
        SELECT COUNT(*)
        FROM trade_entries
        WHERE trade_id = trade_id_param
        AND transaction_type = 'Sell'
    )
    WHERE id = trade_id_param;
END;
$$;

-- Trigger to update trade summary after trade entry changes
CREATE OR REPLACE FUNCTION trade_entries_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        IF TG_OP = 'DELETE' THEN
            PERFORM update_trade_summary(OLD.trade_id);
        ELSE
            PERFORM update_trade_summary(NEW.trade_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trade_entries_after_change
    AFTER INSERT OR UPDATE OR DELETE ON trade_entries
    FOR EACH ROW
    EXECUTE FUNCTION trade_entries_trigger();

-- Set existing trades to manual mode
UPDATE trades SET entry_mode = 'manual' WHERE entry_mode IS NULL;