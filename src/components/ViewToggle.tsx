import React from 'react';
import { Calendar, LineChart } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'calendar' | 'chart';
  onViewChange: (view: 'calendar' | 'chart') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onViewChange('calendar')}
        className={`px-4 py-2 font-bold flex items-center gap-2 transition-all ${
          currentView === 'calendar'
            ? 'neo-brutalist-yellow text-black'
            : 'neo-brutalist-gray text-black'
        }`}
      >
        <Calendar className="w-4 h-4" />
        Calendar
      </button>
      <button
        onClick={() => onViewChange('chart')}
        className={`px-4 py-2 font-bold flex items-center gap-2 transition-all ${
          currentView === 'chart'
            ? 'neo-brutalist-yellow text-black'
            : 'neo-brutalist-gray text-black'
        }`}
      >
        <LineChart className="w-4 h-4" />
        Chart
      </button>
    </div>
  );
}