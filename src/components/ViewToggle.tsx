import React from 'react';
import { Calendar, LineChart } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'calendar' | 'chart';
  onViewChange: (view: 'calendar' | 'chart') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const isCalendar = currentView === 'calendar';

  return (
    <button
      onClick={() => onViewChange(isCalendar ? 'chart' : 'calendar')}
      className="px-4 py-2 font-bold flex items-center gap-2 transition-all neo-brutalist-yellow text-black"
    >
      {isCalendar ? <LineChart className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
      {isCalendar ? 'Chart view' : 'Calendar view'}
    </button>
  );
}