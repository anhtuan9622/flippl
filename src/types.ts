export interface TradeEntry {
  id: string;
  date: Date;
  profit: number;
  trades: number;
  winRate: number;
  entry_mode?: 'manual' | 'detailed';
}

export interface DayData {
  date: Date;
  trades?: TradeEntry;
}