import {
  startOfYear,
  startOfMonth,
  startOfWeek,
  endOfDay,
  isSameDay,
  isAfter,
  isSameMonth,
} from 'date-fns';
import { DayData } from '../types';
import { TimePeriod } from '../components/TimePeriodSelect';

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

export const findLongestWinningStreak = (trades: DayData[]) => {
  if (!trades.length) return null;

  let currentStreak = 0;
  let longestStreak = 0;
  let currentStart: Date | null = null;
  let longestStart: Date | null = null;
  let longestEnd: Date | null = null;

  const sortedTrades = [...trades].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  for (let i = 0; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i];

    if (trade.trades && trade.trades.profit > 0) {
      if (currentStreak === 0) {
        currentStart = trade.date;
      }
      currentStreak++;

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStart = currentStart;
        longestEnd = trade.date;
      }
    } else {
      currentStreak = 0;
      currentStart = null;
    }
  }

  return longestStreak > 0 && longestStart && longestEnd
    ? {
        days: longestStreak,
        startDate: longestStart,
        endDate: longestEnd,
      }
    : null;
};

export const calculateStats = (trades: DayData[], period: TimePeriod): Stats => {
  const now = endOfDay(new Date());
  let filteredTrades = [...trades];

  switch (period) {
    case "year-to-date":
      const yearStart = startOfYear(now);
      filteredTrades = trades.filter(
        (trade) =>
          isAfter(trade.date, yearStart) || isSameDay(trade.date, yearStart)
      );
      break;
    case "month-to-date":
      const monthStart = startOfMonth(now);
      filteredTrades = trades.filter(
        (trade) =>
          isAfter(trade.date, monthStart) || isSameDay(trade.date, monthStart)
      );
      break;
    case "week-to-date":
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      filteredTrades = trades.filter(
        (trade) =>
          isAfter(trade.date, weekStart) || isSameDay(trade.date, weekStart)
      );
      break;
    default:
      break;
  }

  const allTimeProfit = filteredTrades.reduce(
    (sum, day) => sum + (day.trades?.profit || 0),
    0
  );
  const allTimeTrades = filteredTrades.reduce(
    (sum, day) => sum + (day.trades?.trades || 0),
    0
  );
  const allTimeTradingDays = filteredTrades.length;
  const allTimeProfitableDays = filteredTrades.filter(
    (day) => day.trades && day.trades.profit > 0
  ).length;
  const allTimeWinRate =
    allTimeTradingDays > 0
      ? (allTimeProfitableDays / allTimeTradingDays) * 100
      : 0;

  const EPSILON = 1e-10;
  const normalizedProfit =
    Math.abs(allTimeProfit) < EPSILON ? 0 : allTimeProfit;

  const longestStreak = findLongestWinningStreak(filteredTrades);

  return {
    profit: normalizedProfit,
    trades: allTimeTrades,
    tradingDays: allTimeTradingDays,
    winRate: allTimeWinRate,
    longestStreak,
  };
};

export const calculateMonthStats = (trades: DayData[]): Stats => {
  const monthProfit = trades.reduce(
    (sum, day) => sum + (day.trades?.profit || 0),
    0
  );
  const monthTrades = trades.reduce(
    (sum, day) => sum + (day.trades?.trades || 0),
    0
  );
  const monthTradingDays = trades.length;
  const monthProfitableDays = trades.filter(
    (day) => day.trades && day.trades.profit > 0
  ).length;
  const monthWinRate =
    monthTradingDays > 0 ? (monthProfitableDays / monthTradingDays) * 100 : 0;

  const EPSILON = 1e-10;
  const normalizedProfit = Math.abs(monthProfit) < EPSILON ? 0 : monthProfit;

  return {
    profit: normalizedProfit,
    trades: monthTrades,
    tradingDays: monthTradingDays,
    winRate: monthWinRate,
  };
};