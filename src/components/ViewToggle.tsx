import React from 'react';
import { Calendar, LineChart } from 'lucide-react';
import Button from './ui/Button';

interface ViewToggleProps {
  currentView: 'calendar' | 'chart';
  onViewChange: (view: 'calendar' | 'chart') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const isCalendar = currentView === 'calendar';

  return (
    <Button
      variant="select"
      icon={isCalendar ? LineChart : Calendar}
      onClick={() => onViewChange(isCalendar ? 'chart' : 'calendar')}
    >
      {isCalendar ? 'Chart view' : 'Calendar view'}
    </Button>
  );
}