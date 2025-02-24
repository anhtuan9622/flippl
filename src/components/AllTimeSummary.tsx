import React from 'react';
import { DollarSign, BarChart2, CalendarDays, Percent, Flame } from 'lucide-react';
import { format } from 'date-fns';
import SummaryCard from './SummaryCard';
import TimePeriodSelect, { TimePeriod } from './TimePeriodSelect';

interface YearToDateStats {
  profit: number;
  trades: number;
  tradingDays: number;
  winRate: number;
  longestStreak?: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
}

interface AllTimeSummaryProps {
  stats: YearToDateStats;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
  timePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
}

export default function AllTimeSummary({
  stats,
  title = "All-Time Summary",
  subtitle,
  isLoading = false,
  actions,
  timePeriod = 'all-time',
  onTimePeriodChange,
}: AllTimeSummaryProps) {
  return (
    <div className="neo-brutalist-white p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          {onTimePeriodChange ? (
            <TimePeriodSelect value={timePeriod} onChange={onTimePeriodChange} />
          ) : (
            <h2 className="text-2xl font-black text-black underline decoration-wavy bg-yellow-400 underline-offset-3">
              {title}
            </h2>
          )}
          {subtitle && (
            <div className="text-sm font-medium text-gray-600">
              {subtitle}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <SummaryCard
            icon={DollarSign}
            value={stats.profit}
            label="Profit/Loss"
            showTrend
            tooltipText="Total profit or loss across all trades"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={BarChart2}
            value={stats.trades}
            label="No. of Trades"
            tooltipText="Total number of trades executed"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={CalendarDays}
            value={stats.tradingDays}
            label="Trading Days"
            tooltipText="Total number of days with at least one trade"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={Percent}
            value={stats.winRate}
            label="Win Rate"
            tooltipText="Overall percentage of profitable trading days"
            isLoading={isLoading}
          />
        </div>

        {stats.longestStreak && stats.longestStreak.days > 1 && (
          <div className="flex justify-end">
            <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-gray-600">
              <Flame className="w-4 h-4 text-red-500" />
              Nice work! Your longest winning streak is <span className="text-black font-bold underline underline-offset-2 decoration-wavy decoration-yellow-500">{stats.longestStreak.days} trading days</span> ({format(stats.longestStreak.startDate, 'MMM d, yyyy')} – {format(stats.longestStreak.endDate, 'MMM d, yyyy')}).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}