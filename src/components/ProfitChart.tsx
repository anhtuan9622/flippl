import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { DayData } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProfitChartProps {
  currentDate: Date;
  tradeData: DayData[];
  onPointClick?: (date: Date) => void;
}

export default function ProfitChart({
  currentDate,
  tradeData,
  onPointClick,
}: ProfitChartProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const chartData = daysInMonth.map((day) => {
    const trade = tradeData.find(
      (data) => format(data.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    return trade?.trades?.profit || 0;
  });

  const data = {
    labels: daysInMonth.map((day) => format(day, "d")),
    datasets: [
      {
        label: "Daily Profit/Loss",
        data: chartData,
        borderColor: "black",
        backgroundColor: "gray",
        borderWidth: 4,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBorderWidth: 4,
        tension: 0.2,
        segment: {
          borderColor: "black",
        },
        pointBackgroundColor: (ctx: any) => {
          if (!ctx.raw) return "gray";
          return ctx.raw > 0 ? "#16a34a" : ctx.raw < 0 ? "#dc2626" : "gray";
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#facc15",
        titleColor: "black",
        titleFont: {
          weight: "normal",
          size: 14,
        },
        bodyColor: "black",
        bodyFont: {
          weight: "bold",
          size: 14,
        },
        padding: 12,
        borderColor: "black",
        borderWidth: 3,
        displayColors: false,
        callbacks: {
          title: (items: any) => `Day ${items[0].label}`,
          label: (item: any) => {
            const value = item.raw;
            return value < 0
              ? `-$${Math.abs(value).toLocaleString()}`
              : `$${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          width: 3,
          color: "black",
        },
        ticks: {
          color: "black",
          font: {
            weight: "bold",
          },
        },
      },
      y: {
        grid: {
          color: "#e5e7eb",
          lineWidth: 2,
        },
        border: {
          width: 3,
          color: "black",
        },
        ticks: {
          color: "black",
          font: {
            weight: "bold",
          },
          callback: (value: number) => {
            return value < 0
              ? `-$${Math.abs(value).toLocaleString()}`
              : `$${value.toLocaleString()}`;
          },
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && onPointClick) {
        const index = elements[0].index;
        onPointClick(daysInMonth[index]);
      }
    },
  };

  return (
    <div className="neo-brutalist-white p-4 md:p-6">
      <div className="overflow-x-auto pb-4 pr-2 hide-scrollbar">
        <div className="min-w-[800px]">
          <div className="h-[300px] md:h-[400px]">
            <Line data={data} options={options} />
          </div>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        Tap on any point to view or edit trade data
      </div>
    </div>
  );
}
