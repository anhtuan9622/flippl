import React from 'react';
import { DollarSign, BarChart2, CalendarDays, Percent } from 'lucide-react';
import SummaryCard from './SummaryCard';

interface YearToDateStats {
  profit: number;
  trades: number;
  tradingDays: number;
  winRate: number;
}

interface YearToDateSummaryProps {
  stats: YearToDateStats;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
}

export default function AllTimeSummary({
  stats,
  title = "All-Time Summary",
  subtitle,
  isLoading = false,
  actions,
}: YearToDateSummaryProps) {
  return (
    <div className="neo-brutalist-white p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <h2 className="text-2xl font-black text-black underline decoration-wavy bg-yellow-400">
            {title}
          </h2>
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
    </div>
  );
}