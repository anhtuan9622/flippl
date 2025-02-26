import React from 'react';
import { DollarSign, BarChart2, CalendarDays, Percent, Flame } from 'lucide-react';
import { format } from 'date-fns';
import SummaryCard from '../SummaryCard';
import TimePeriodSelect, { TimePeriod } from '../TimePeriodSelect';

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

const getStreakMessage = (days: number, startDate: Date, endDate: Date) => {
  const dateRange = `(${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')})`;
  const daysText = `${days} trading days`;
  
  if (days <= 3) {
    return `Great start! You've won <span class="text-black text-semibold underline underline-offset-2 decoration-wavy decoration-yellow-400">${daysText}</span> straight ${dateRange}. Let's see how far you can go!`;
  } else if (days <= 6) {
    return `Solid streak! <span class="text-black text-semibold underline underline-offset-2 decoration-wavy decoration-yellow-400">${daysText}</span> in the green ${dateRange}. Stay focused!`;
  } else if (days <= 10) {
    return `Impressive! <span class="text-black text-semibold underline underline-offset-2 decoration-wavy decoration-yellow-400">${daysText}</span> winning streak ${dateRange}. Keep the momentum going!`;
  } else if (days <= 15) {
    return `Nice work! <span class="text-black text-semibold underline underline-offset-2 decoration-wavy decoration-yellow-400">${daysText}</span> in a row ${dateRange}. That takes skill!`;
  } else if (days <= 20) {
    return `You're on fire! <span class="text-black text-semibold underline underline-offset-2 decoration-wavy decoration-yellow-400">${daysText}</span> streak ${dateRange}. Keep stacking wins!`;
  } else {
    return `Legendary! <span class="text-black text-semibold underline underline-offset-2 decoration-wavy decoration-yellow-400">${daysText}</span> straight wins ${dateRange}. Pure consistency!`;
  }
};

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
          <div className="flex justify-end items-center gap-1 text-sm font-medium text-gray-600">
            🚀
            <span dangerouslySetInnerHTML={{ 
              __html: getStreakMessage(
                stats.longestStreak.days,
                stats.longestStreak.startDate,
                stats.longestStreak.endDate
              )
            }} />
          </div>
        )}
      </div>
    </div>
  );
}