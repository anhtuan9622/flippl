import React from 'react';
import { format } from 'date-fns';
import { DayData } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DayCellProps {
  date: Date;
  data?: DayData;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

export default function DayCell({
  date,
  data,
  isCurrentMonth,
  isToday,
  onClick,
}: DayCellProps) {
  const hasProfit = data?.trades?.profit && data.trades.profit > 0;
  
  return (
    <button
      onClick={onClick}
      className={`
        h-16 md:h-20 lg:h-24 p-1 md:p-2 transition-all
        ${isCurrentMonth ? 'neo-brutalist-white' : 'neo-brutalist-gray opacity-50'}
        ${isToday ? 'border-yellow-500' : ''}
        hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
      `}
    >
      <div className="flex flex-col h-full">
        <span
          className={`
            text-xs md:text-sm font-bold
            ${isCurrentMonth ? 'text-black' : 'text-gray-600'}
          `}
        >
          {format(date, 'd')}
        </span>
        
        {data?.trades && (
          <div className="mt-auto">
            <div className={`
              flex items-center justify-between text-xs md:text-lg font-bold
              ${hasProfit ? 'text-green-600' : 'text-red-600'}
            `}>
              <span className="truncate">
                ${Math.abs(data.trades.profit).toLocaleString()}
              </span>
              {hasProfit ? (
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              )}
            </div>
            <div className="text-[10px] md:text-xs font-bold text-black truncate">
              {data.trades.trades} trades
            </div>
          </div>
        )}
      </div>
    </button>
  );
}