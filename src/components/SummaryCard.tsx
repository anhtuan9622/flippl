import React from 'react';
import { 
  DollarSign,
  BarChart2,
  CalendarDays,
  Percent,
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface SummaryCardProps {
  icon: typeof DollarSign;
  value: string | number;
  label?: string;
  isProfit?: boolean;
  showTrend?: boolean;
  size?: 'sm' | 'lg';
}

export default function SummaryCard({
  icon: Icon,
  value,
  label,
  isProfit,
  showTrend = false,
  size = 'lg'
}: SummaryCardProps) {
  const isNumber = typeof value === 'number';
  const formattedValue = isNumber ? value.toLocaleString() : value;
  const shouldShowDollarPrefix = isNumber && Icon === DollarSign;
  const valueWithPrefix = shouldShowDollarPrefix ? `$${formattedValue}` : formattedValue;
  
  const getTooltipContent = () => {
    if (label === 'Profit/Loss') {
      return 'Total profit or loss for the selected period';
    }
    if (label === 'No. of Trades') {
      return 'Total number of trades executed in the selected period';
    }
    if (label === 'Trading Days') {
      return 'Number of days with at least one trade';
    }
    if (label === 'Win Rate') {
      return 'Percentage of profitable trading days';
    }
    if (!label) {
      if (Icon === DollarSign) return 'Profit/Loss of this month';
      if (Icon === BarChart2) return 'Number of trades of this month';
      if (Icon === CalendarDays) return 'Trading days of this month';
      if (Icon === Percent) return 'Win rate of this month';
    }
    return '';
  };

  const tooltipContent = getTooltipContent();
  const card = (
    <div className={`neo-brutalist-gray ${size === 'lg' ? 'p-4' : 'px-3 py-2'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          {label && (
            <div className="flex items-center gap-2 mb-1">
              <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
              <p className={`${size === 'lg' ? 'text-sm' : 'text-xs'} font-bold text-black`}>{label}</p>
            </div>
          )}
          {!label && (
            <div className="flex items-center gap-1">
              <Icon className="w-4 h-4" />
              <p className={`text-sm font-bold ${isProfit !== undefined ? (isProfit ? 'text-green-600' : 'text-red-600') : 'text-black'}`}>
                {valueWithPrefix}
              </p>
            </div>
          )}
          {label && (
            <p className={`${size === 'lg' ? 'text-2xl' : 'text-lg'} font-black ${isProfit !== undefined ? (isProfit ? 'text-green-600' : 'text-red-600') : 'text-black'}`}>
              {valueWithPrefix}
            </p>
          )}
        </div>
        {showTrend && isProfit !== undefined && (
          isProfit ? (
            <TrendingUp className={`${size === 'lg' ? 'w-8 h-8' : 'w-4 h-4'} text-green-600`} />
          ) : (
            <TrendingDown className={`${size === 'lg' ? 'w-8 h-8' : 'w-4 h-4'} text-red-600`} />
          )
        )}
      </div>
    </div>
  );

  if (!tooltipContent) return card;

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {card}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="neo-brutalist-yellow px-3 py-2 text-sm font-bold text-black"
            sideOffset={5}
          >
            {tooltipContent}
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}