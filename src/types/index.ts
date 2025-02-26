export interface TradeEntry {
  id: string;
  date: Date;
  profit: number;
  trades: number;
  winRate: number;
}

export interface TradeEntryData {
  id?: string;
  trade_id?: string;
  transaction_type: 'Buy' | 'Sell';
  symbol: string;
  quantity: number;
  price: number;
  total_amount: number;
  commission: number;
  linked_buy_id?: string;
  trade_profit?: number;
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