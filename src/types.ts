export interface TradeEntry {
  id: string;
  date: Date;
  profit: number;
  trades: number;
  winRate: number;
}

export interface DayData {
  date: Date;
  trades?: TradeEntry;
}