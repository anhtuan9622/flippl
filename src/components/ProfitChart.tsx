import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { DayData } from '../types';

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
}

export default function ProfitChart({ currentDate, tradeData }: ProfitChartProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const chartData = daysInMonth.map(day => {
    const trade = tradeData.find(data => 
      format(data.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
    return trade?.trades?.profit || 0;
  });

  const data = {
    labels: daysInMonth.map(day => format(day, 'd')),
    datasets: [
      {
        label: 'Daily Profit/Loss',
        data: chartData,
        borderColor: '#2563eb',
        backgroundColor: '#3b82f6',
        borderWidth: 4,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.2,
        segment: {
          borderColor: (ctx: any) => {
            if (!ctx.p0.parsed.y || !ctx.p1.parsed.y) return '#2563eb';
            return ctx.p0.parsed.y > 0 && ctx.p1.parsed.y > 0 ? '#16a34a' : 
                   ctx.p0.parsed.y < 0 && ctx.p1.parsed.y < 0 ? '#dc2626' : '#2563eb';
          },
        },
        pointBackgroundColor: (ctx: any) => {
          if (!ctx.raw) return '#3b82f6';
          return ctx.raw > 0 ? '#16a34a' : ctx.raw < 0 ? '#dc2626' : '#3b82f6';
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
        backgroundColor: 'white',
        titleColor: 'black',
        titleFont: {
          weight: 'bold',
          size: 14,
        },
        bodyColor: 'black',
        bodyFont: {
          size: 14,
        },
        padding: 12,
        borderColor: 'black',
        borderWidth: 3,
        displayColors: false,
        callbacks: {
          title: (items: any) => `Day ${items[0].label}`,
          label: (item: any) => {
            const value = item.raw;
            return `$${value.toLocaleString()}`;
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
          color: 'black',
        },
        ticks: {
          color: 'black',
          font: {
            weight: 'bold',
          },
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          lineWidth: 2,
        },
        border: {
          width: 3,
          color: 'black',
        },
        ticks: {
          color: 'black',
          font: {
            weight: 'bold',
          },
          callback: (value: number) => `$${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="neo-brutalist-white p-4 md:p-6">
      <div className="h-[300px] md:h-[400px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}