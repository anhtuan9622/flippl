import React from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { DayData } from "../types";
import DayCell from "./DayCell";

interface CalendarProps {
  currentDate: Date;
  tradeData: DayData[];
  onDayClick: (date: Date) => void;
}

export default function Calendar({
  currentDate,
  tradeData,
  onDayClick,
}: CalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="bg-white rounded-2xl">
      <div className="overflow-x-auto pb-4 pr-4 hide-scrollbar">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {days.map((day) => {
              const dayData = tradeData.find((data) =>
                isSameDay(data.date, day)
              );

              return (
                <DayCell
                  key={day.toString()}
                  date={day}
                  data={dayData}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  isToday={isToday(day)}
                  onClick={() => onDayClick(day)}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        Tap on any day to view or edit trade data
      </div>
    </div>
  );
}
