import React, { useState } from "react";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  BarChart2,
  CalendarDays,
  Percent,
  Download,
} from "lucide-react";
import Button from "../components/ui/Button";
import { DayData } from "../types";
import { calculateMonthStats, calculateStats } from "../utils/stats";
import { TimePeriod } from "../components/TimePeriodSelect";
import Calendar from "../components/Calendar";
import TradeForm from "../components/modals/TradeForm";
import ShareModal from "../components/modals/ShareModal";
import ProfitChart from "../components/ProfitChart";
import SummaryCard from "../components/SummaryCard";
import ViewToggle from "../components/ViewToggle";
import AppLayout from "../components/layout/AppLayout";
import AllTimeSummary from "../components/layout/AllTimeSummary";
import ExportModal from "../components/modals/ExportModal";

interface MainDashboardProps {
  tradeData: DayData[];
  userEmail: string | null;
  onSignOut: () => void;
  onSaveTradeData: (
    date: Date,
    data: { profit: number; trades: number }
  ) => Promise<boolean>;
  onDeleteTrade: (id: string) => Promise<boolean>;
  fetchTradeData: () => Promise<DayData[]>;
  setTradeData: (data: DayData[]) => void;
  loading?: boolean;
}

export default function MainDashboard({
  tradeData,
  userEmail,
  onSignOut,
  onSaveTradeData,
  onDeleteTrade,
  fetchTradeData,
  setTradeData,
  loading = false,
}: MainDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<"calendar" | "chart">(
    "calendar"
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const currentMonthData = tradeData.filter((day) =>
    isSameMonth(day.date, currentDate)
  );

  const monthStats = calculateMonthStats(currentMonthData);

  const selectedDayData = selectedDate
    ? tradeData.find(
        (day) =>
          format(day.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
      )
    : null;

  const handleEntriesUpdated = async () => {
    const updatedTrades = await fetchTradeData();
    setTradeData(updatedTrades);
  };

  const handleExportCSV = () => {
    try {
      const sortedData = [...tradeData].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      const stats = calculateStats(sortedData, timePeriod);

      const csvContent = [
        ["Date", "Profit/Loss ($)", "No. of Trades", "Win/Loss", "Notes", "Tags"].join(","),
        ...sortedData.map((day) =>
          [
            format(day.date, "yyyy-MM-dd"),
            day.trades?.profit || 0,
            day.trades?.trades || 0,
            day.trades?.profit && day.trades.profit > 0 ? "Win" : "Loss",
            day.trades?.notes,
            day.trades?.tags || "",
          ].join(",")
        ),
        "",
        "Summary",
        `"Total Profit/Loss: ${stats.profit < 0 ? "-" : ""}$${Math.abs(
          stats.profit
        ).toLocaleString()}, Total Trades: ${stats.trades}, Trading Days: ${
          stats.tradingDays
        }, Win Rate: ${stats.winRate.toFixed(0)}%"`,
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `flippl_trades_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data. Try again");
    }
  };

  return (
    <AppLayout userEmail={userEmail} onSignOut={onSignOut} loading={loading}>
      {/* SUMMARY SECTION */}
      <AllTimeSummary
        stats={calculateStats(tradeData, timePeriod)}
        isLoading={loading}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        actions={
          <>
            <Button
              variant="primary"
              icon={Download}
              onClick={() => setIsExportModalOpen(true)}
            />
            <ShareModal />
          </>
        }
      />

      {/* MAIN CALENDAR SECTION */}
      <div className="neo-brutalist-white p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-3xl font-black text-black underline decoration-wavy decoration-yellow-400 underline-offset-4">
              {format(currentDate, "MMMM yyyy")}
            </h2>

            <div className="flex gap-2 flex-wrap">
              <SummaryCard
                icon={DollarSign}
                value={monthStats.profit}
                showTrend
                size="sm"
                tooltipText="Profit/Loss of this month"
                isLoading={loading}
              />
              <SummaryCard
                icon={BarChart2}
                value={monthStats.trades}
                size="sm"
                tooltipText="Number of trades of this month"
                isLoading={loading}
              />
              <SummaryCard
                icon={CalendarDays}
                value={monthStats.tradingDays}
                size="sm"
                tooltipText="Trading days of this month"
                isLoading={loading}
              />
              <SummaryCard
                icon={Percent}
                value={monthStats.winRate}
                size="sm"
                tooltipText="Win rate of this month"
                isLoading={loading}
              />
            </div>

            <div>
              <ViewToggle
                currentView={currentView}
                onViewChange={(view) => setCurrentView(view)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                icon={ChevronLeft}
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              />
              <Button
                variant="primary"
                icon={ChevronRight}
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              />
            </div>
          </div>

          {currentView === "calendar" ? (
            <Calendar
              currentDate={currentDate}
              tradeData={tradeData}
              onDayClick={setSelectedDate}
            />
          ) : (
            <ProfitChart
              currentDate={currentDate}
              tradeData={tradeData}
              onPointClick={setSelectedDate}
            />
          )}
        </div>
      </div>

      {selectedDate && (
        <TradeForm
          date={selectedDate}
          existingTrade={selectedDayData?.trades}
          onSave={(data) => onSaveTradeData(selectedDate, data)}
          onDelete={onDeleteTrade}
          onClose={() => setSelectedDate(null)}
          onEntriesUpdated={handleEntriesUpdated}
        />
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportCSV}
      />
    </AppLayout>
  );
}
