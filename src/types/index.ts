export interface TradeEntry {
  id: string;
  date: Date;
  profit: number;
  trades: number;
  winRate: number;
  entry_mode?: 'manual' | 'detailed';
  notes?: string;
  tags?: string[];
}

export interface TradeEntryData {
  id?: string;
  trade_id?: string;
  transaction_type: 'Buy' | 'Sell';
  symbol: string;
  quantity: string;
  price: string;
  commission: string;
  total_amount: number;
  trade_profit?: number;
  notes?: string;
  tags?: string[];
  created_at?: string;
}

export interface DayData {
  date: Date;
  trades?: TradeEntry;
  entries?: TradeEntryData[];
}

export interface Stats {
  profit: number;
  trades: number;
  tradingDays: number;
  winRate: number;
  longestStreak?: {
    days: number;
    startDate: Date;
    endDate: Date;
  } | null;
}