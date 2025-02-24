import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  format,
  addMonths,
  subMonths,
  isSameMonth,
  parseISO,
  startOfYear,
  startOfMonth,
  startOfWeek,
  endOfDay,
  isSameDay,
  isAfter,
  addDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  BarChart2,
  CalendarDays,
  Percent,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import Calendar from "./components/Calendar";
import TradeForm from "./components/TradeForm";
import AuthForm from "./components/AuthForm";
import PasswordAuth from "./components/PasswordAuth";
import ProfitChart from "./components/ProfitChart";
import SummaryCard from "./components/SummaryCard";
import ViewToggle from "./components/ViewToggle";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ShareButton from "./components/ShareButton";
import SharedSummary from "./components/SharedSummary";
import AllTimeSummary from "./components/AllTimeSummary";
import AuthCallback from "./components/AuthCallback";
import { DayData } from "./types";
import { TimePeriod } from "./components/TimePeriodSelect";
import {
  supabase,
  subscribeToTrades,
  retryOperation,
  authChannel,
} from "./lib/supabase";

type View = "calendar" | "chart";

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tradeData, setTradeData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<View>("calendar");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time");

  const fetchTradeData = useCallback(async () => {
    if (!userId) return [];

    try {
      const trades = await retryOperation(async () => {
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: true });

        if (error) throw error;
        return data || [];
      });

      return trades.map((trade) => ({
        date: parseISO(trade.date),
        trades: {
          id: trade.id,
          date: parseISO(trade.date),
          profit: trade.profit,
          trades: trade.trades_count,
          winRate: trade.profit > 0 ? 100 : 0,
        },
      }));
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast.error("Failed to load trades. Try again");
      return [];
    }
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    let tradesSubscription: ReturnType<typeof subscribeToTrades>;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email);
          setIsAuthenticated(true);
          const trades = await fetchTradeData();
          if (mounted) {
            setTradeData(trades);
            setLoading(false);
            setIsInitialLoad(false);

            tradesSubscription = subscribeToTrades(
              session.user.id,
              async () => {
                const updatedTrades = await fetchTradeData();
                if (mounted) {
                  setTradeData(updatedTrades);
                }
              }
            );
          }
        } else {
          if (mounted) {
            setUserId(null);
            setUserEmail(null);
            setIsAuthenticated(false);
            setLoading(false);
            setIsInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (mounted) {
          setUserId(null);
          setUserEmail(null);
          setIsAuthenticated(false);
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    initializeAuth();

    const handleAuthMessage = (msg: { type: string }) => {
      if (msg.type === "AUTH_ERROR" || msg.type === "SIGN_OUT") {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
        setTradeData([]);
      }
    };

    authChannel.addEventListener("message", handleAuthMessage);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
        setIsAuthenticated(true);
        const trades = await fetchTradeData();
        if (mounted) {
          setTradeData(trades);
          setLoading(false);

          tradesSubscription = subscribeToTrades(session.user.id, async () => {
            const updatedTrades = await fetchTradeData();
            if (mounted) {
              setTradeData(updatedTrades);
            }
          });
        }
      } else {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
        setTradeData([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (tradesSubscription) {
        tradesSubscription.unsubscribe();
      }
      authChannel.removeEventListener("message", handleAuthMessage);
    };
  }, [fetchTradeData]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setTradeData([]);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTradeData = async (data: {
    profit: number;
    trades: number;
  }) => {
    if (!selectedDate) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Your session has expired. Log in again");
        setIsAuthenticated(false);
        return;
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      await retryOperation(async () => {
        const { error } = await supabase.from("trades").upsert(
          {
            user_id: session.user.id,
            date: formattedDate,
            profit: data.profit,
            trades_count: data.trades,
          },
          {
            onConflict: "user_id,date",
            ignoreDuplicates: false,
          }
        );

        if (error) throw error;
      });

      const updatedTrades = await fetchTradeData();
      setTradeData(updatedTrades);
      setSelectedDate(null);
      toast.success("Trade data saved successfully");
    } catch (error) {
      console.error("Error saving trade:", error);
      toast.error("Failed to save trade data. Try again");
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Your session has expired. Log in again");
        setIsAuthenticated(false);
        return;
      }

      await retryOperation(async () => {
        const { error } = await supabase.from("trades").delete().match({ id });

        if (error) throw error;
      });

      const updatedTrades = await fetchTradeData();
      setTradeData(updatedTrades);
      setSelectedDate(null);
      toast.success("Trade deleted successfully");
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast.error("Failed to delete trade. Try again");
    }
  };

  const findLongestWinningStreak = (trades: DayData[]) => {
    if (!trades.length) return null;

    let currentStreak = 0;
    let longestStreak = 0;
    let currentStart: Date | null = null;
    let longestStart: Date | null = null;
    let longestEnd: Date | null = null;

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (let i = 0; i < sortedTrades.length; i++) {
      const trade = sortedTrades[i];
      
      if (trade.trades && trade.trades.profit > 0) {
        if (currentStreak === 0) {
          currentStart = trade.date;
        }
        currentStreak++;

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          longestStart = currentStart;
          longestEnd = trade.date;
        }
      } else {
        currentStreak = 0;
        currentStart = null;
      }
    }

    return longestStreak > 0 && longestStart && longestEnd
      ? {
          days: longestStreak,
          startDate: longestStart,
          endDate: longestEnd,
        }
      : null;
  };

  const calculateStats = (trades: DayData[], period: TimePeriod) => {
    const now = endOfDay(new Date());
    let filteredTrades = [...trades];

    switch (period) {
      case 'year-to-date':
        const yearStart = startOfYear(now);
        filteredTrades = trades.filter(trade => 
          isAfter(trade.date, yearStart) || isSameDay(trade.date, yearStart)
        );
        break;
      case 'month-to-date':
        const monthStart = startOfMonth(now);
        filteredTrades = trades.filter(trade => 
          isAfter(trade.date, monthStart) || isSameDay(trade.date, monthStart)
        );
        break;
      case 'week-to-date':
        const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Start week on Sunday
        filteredTrades = trades.filter(trade => 
          isAfter(trade.date, weekStart) || isSameDay(trade.date, weekStart)
        );
        break;
      default:
        // all-time, no filtering needed
        break;
    }

    const allTimeProfit = filteredTrades.reduce(
      (sum, day) => sum + (day.trades?.profit || 0),
      0
    );
    const allTimeTrades = filteredTrades.reduce(
      (sum, day) => sum + (day.trades?.trades || 0),
      0
    );
    const allTimeTradingDays = filteredTrades.length;
    const allTimeProfitableDays = filteredTrades.filter(
      (day) => day.trades && day.trades.profit > 0
    ).length;
    const allTimeWinRate =
      allTimeTradingDays > 0
        ? (allTimeProfitableDays / allTimeTradingDays) * 100
        : 0;

    const EPSILON = 1e-10;
    const normalizedProfit =
      Math.abs(allTimeProfit) < EPSILON ? 0 : allTimeProfit;

    const longestStreak = findLongestWinningStreak(filteredTrades);

    return {
      profit: normalizedProfit,
      trades: allTimeTrades,
      tradingDays: allTimeTradingDays,
      winRate: allTimeWinRate,
      longestStreak,
    };
  };

  const calculateMonthStats = (trades: DayData[]) => {
    const monthProfit = trades.reduce(
      (sum, day) => sum + (day.trades?.profit || 0),
      0
    );
    const monthTrades = trades.reduce(
      (sum, day) => sum + (day.trades?.trades || 0),
      0
    );
    const monthTradingDays = trades.length;
    const monthProfitableDays = trades.filter(
      (day) => day.trades && day.trades.profit > 0
    ).length;
    const monthWinRate =
      monthTradingDays > 0
        ? (monthProfitableDays / monthTradingDays) * 100
        : 0;

    const EPSILON = 1e-10;
    const normalizedProfit =
      Math.abs(monthProfit) < EPSILON ? 0 : monthProfit;

    return {
      profit: normalizedProfit,
      trades: monthTrades,
      tradingDays: monthTradingDays,
      winRate: monthWinRate,
    };
  };

  const handleExportCSV = () => {
    try {
      const sortedData = [...tradeData].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      const stats = calculateStats(sortedData, timePeriod);

      const csvContent = [
        ["Date", "Profit/Loss ($)", "No. of Trades", "Win/Loss"].join(","),
        ...sortedData.map((day) =>
          [
            format(day.date, "yyyy-MM-dd"),
            day.trades?.profit || 0,
            day.trades?.trades || 0,
            day.trades?.profit && day.trades.profit > 0 ? "Win" : "Loss",
          ].join(",")
        ),
        "",
        "Summary",
        `"Total Profit/Loss: ${stats.profit < 0 ? "-" : ""}$${Math.abs(
          stats.profit
        ).toLocaleString()}, Total Trades: ${
          stats.trades
        }, Trading Days: ${
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

      toast.success("Trade data exported successfully");
    } catch (error) {
      console.error("Error exporting trade data:", error);
      toast.error("Failed to export trade data. Try again");
    }
  };

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

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-xl font-bold text-black neo-brutalist-white px-8 py-4">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <AuthForm
                onSuccess={async () => {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  if (session?.user) {
                    setUserId(session.user.id);
                    setUserEmail(session.user.email);
                    setIsAuthenticated(true);
                    const trades = await fetchTradeData();
                    setTradeData(trades);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />
            ) : (
              <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                  <Header 
                    showSignOut 
                    onSignOut={handleSignOut} 
                    userEmail={userEmail || undefined}
                  />

                  <AllTimeSummary
                    stats={calculateStats(tradeData, timePeriod)}
                    isLoading={loading}
                    timePeriod={timePeriod}
                    onTimePeriodChange={setTimePeriod}
                    actions={
                      <>
                        <button
                          onClick={handleExportCSV}
                          className="neo-brutalist-blue px-4 py-2 font-bold flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                        <ShareButton yearToDateStats={calculateStats(tradeData, timePeriod)} />
                      </>
                    }
                  />

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
                          <button
                            onClick={() =>
                              setCurrentDate(subMonths(currentDate, 1))
                            }
                            className="neo-brutalist-blue p-2"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              setCurrentDate(addMonths(currentDate, 1))
                            }
                            className="neo-brutalist-blue p-2"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
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

                  <Footer />
                </div>

                {selectedDate && (
                  <TradeForm
                    date={selectedDate}
                    existingTrade={selectedDayData?.trades}
                    onSave={handleSaveTradeData}
                    onDelete={handleDeleteTrade}
                    onClose={() => setSelectedDate(null)}
                  />
                )}
              </div>
            )
          }
        />
        <Route path="/auth" element={
          !isAuthenticated ? (
            <PasswordAuth
              onSuccess={async () => {
                const {
                  data: { session },
                } = await supabase.auth.getSession();
                if (session?.user) {
                  setUserId(session.user.id);
                  setUserEmail(session.user.email);
                  setIsAuthenticated(true);
                  const trades = await fetchTradeData();
                  setTradeData(trades);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/share/:shareId" element={<SharedSummary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;