import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';

export type TimePeriod = 'all-time' | 'year-to-date' | 'month-to-date' | 'week-to-date';

interface TimePeriodSelectProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: 'all-time', label: 'All-Time Summary' },
  { value: 'year-to-date', label: 'Year-to-Date' },
  { value: 'month-to-date', label: 'Month-to-Date' },
  { value: 'week-to-date', label: 'Week-to-Date' },
];

export default function TimePeriodSelect({ value, onChange }: TimePeriodSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedPeriod = periods.find(period => period.value === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-2 neo-brutalist-yellow px-4 py-2 font-bold text-black">
          {selectedPeriod?.label}
          <ChevronDown className="w-4 h-4" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="neo-brutalist-white p-2 w-48 z-50"
          sideOffset={8}
          align="start"
        >
          <div className="flex flex-col gap-1">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => {
                  onChange(period.value);
                  setOpen(false);
                }}
                className={`px-3 py-2 text-left font-bold rounded-lg transition-colors ${
                  value === period.value
                    ? 'bg-yellow-400 text-black'
                    : 'hover:bg-gray-100 text-black'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <Popover.Arrow className="fill-black" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}