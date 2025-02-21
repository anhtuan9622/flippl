import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isAfter, 
  isBefore, 
  startOfYear,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  BarChart2,
  CalendarDays,
  Percent,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Calendar from './components/Calendar';
import TradeForm from './components/TradeForm';
import AuthForm from './components/AuthForm';
import ProfitChart from './components/ProfitChart';
import SummaryCard from './components/SummaryCard';
import ViewToggle from './components/ViewToggle';
import Header from './components/Header';
import Footer from './components/Footer';
import { TradeEntry, DayData } from './types';
import { supabase } from './lib/supabase';

type View = 'calendar' | 'chart';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tradeData, setTradeData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('calendar');

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchTradeData();
      } else {
        setTradeData([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        fetchTradeData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const fetchTradeData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching trade data:', error.message);
      toast.error('Failed to load trade data');
      setLoading(false);
      return;
    }

    const formattedData: DayData[] = data.map(trade => ({
      date: parseISO(trade.date),
      trades: {
        id: trade.id,
        date: parseISO(trade.date),
        profit: trade.profit,
        trades: trade.trades_count,
        winRate: trade.profit > 0 ? 100 : 0,
      },
    }));

    setTradeData(formattedData);
    setLoading(false);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSaveTradeData = async (data: { profit: number; trades: number }) => {
    if (!selectedDate) return;

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      toast.error('Your session has expired. Please sign in again.');
      setIsAuthenticated(false);
      return;
    }

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    const tradeEntry = {
      user_id: session.session.user.id,
      date: formattedDate,
      profit: data.profit,
      trades_count: data.trades,
    };

    const { data: savedTrade, error } = await supabase
      .from('trades')
      .upsert(tradeEntry, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving trade data:', error.message);
      toast.error('Failed to save trade data');
      return;
    }

    const newEntry: TradeEntry = {
      id: savedTrade.id,
      date: selectedDate,
      profit: savedTrade.profit,
      trades: savedTrade.trades_count,
      winRate: savedTrade.profit > 0 ? 100 : 0,
    };

    setTradeData(prev => {
      const filtered = prev.filter(
        entry => format(entry.date, 'yyyy-MM-dd') !== formattedDate
      );
      return [...filtered, { date: selectedDate, trades: newEntry }];
    });

    setSelectedDate(null);
    toast.success('Trade data saved successfully');
  };

  const handleDeleteTrade = async (id: string) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      toast.error('Your session has expired. Please sign in again.');
      setIsAuthenticated(false);
      return;
    }

    const { error } = await supabase
      .from('trades')
      .delete()
      .match({ id });

    if (error) {
      console.error('Error deleting trade:', error.message);
      toast.error('Failed to delete trade');
      return;
    }

    setTradeData(prev => prev.filter(day => day.trades?.id !== id));
    setSelectedDate(null);
    toast.success('Trade deleted successfully');
  };

  const handleSignOut = async () => {
    try {
      setIsAuthenticated(false);
      setTradeData([]);
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  };

  if (!isAuthenticated) {
    return <AuthForm onSuccess={() => {
      setIsAuthenticated(true);
      toast.success('Signed in successfully');
    }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-xl font-bold text-black neo-brutalist-white px-8 py-4">Loading...</div>
      </div>
    );
  }

  const currentMonthData = tradeData.filter(day => 
    isSameMonth(day.date, currentDate)
  );

  const yearToMonthData = tradeData.filter(day => 
    isAfter(day.date, startOfYear(currentDate)) && 
    isBefore(day.date, addMonths(startOfMonth(currentDate), 1))
  );

  // Monthly calculations
  const totalProfit = currentMonthData.reduce((sum, day) => {
    return sum + (day.trades?.profit || 0);
  }, 0);

  const totalTrades = currentMonthData.reduce((sum, day) => {
    return sum + (day.trades?.trades || 0);
  }, 0);

  const profitableDays = currentMonthData.filter(day => 
    day.trades && day.trades.profit > 0
  ).length;

  const tradingDays = currentMonthData.length;

  const winRate = tradingDays > 0 
    ? ((profitableDays / tradingDays) * 100).toFixed(0)
    : '0';

  // Year to month calculations
  const yearToMonthProfit = yearToMonthData.reduce((sum, day) => {
    return sum + (day.trades?.profit || 0);
  }, 0);

  const yearToMonthTrades = yearToMonthData.reduce((sum, day) => {
    return sum + (day.trades?.trades || 0);
  }, 0);

  const yearToMonthProfitableDays = yearToMonthData.filter(day => 
    day.trades && day.trades.profit > 0
  ).length;

  const yearToMonthTradingDays = yearToMonthData.length;

  const yearToMonthWinRate = yearToMonthTradingDays > 0
    ? ((yearToMonthProfitableDays / yearToMonthTradingDays) * 100).toFixed(0)
    : '0';

  const selectedDayData = selectedDate 
    ? tradeData.find(day => format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
    : null;

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Header showSignOut onSignOut={handleSignOut} />

        <div className="neo-brutalist-white p-6 mb-6">
          <h2 className="text-xl font-black text-black underline decoration-wavy decoration-yellow-500 mb-4 flex items-center gap-2">
            Year-to-Date Summary
            <span className="text-sm font-bold">
              ({format(startOfYear(currentDate), 'MMM d')} - {format(endOfMonth(currentDate), 'MMM d, yyyy')})
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={DollarSign}
              value={yearToMonthProfit}
              label="Profit/Loss"
              isProfit={yearToMonthProfit >= 0}
              showTrend
            />
            <SummaryCard
              icon={BarChart2}
              value={yearToMonthTrades}
              label="No. of Trades"
            />
            <SummaryCard
              icon={CalendarDays}
              value={yearToMonthTradingDays}
              label="Trading Days"
            />
            <SummaryCard
              icon={Percent}
              value={`${yearToMonthWinRate}%`}
              label="Win Rate"
            />
          </div>
        </div>

        <div className="neo-brutalist-white p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-3xl font-black text-black underline decoration-wavy decoration-yellow-500">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              
              <div className="flex gap-2 flex-wrap">
                <SummaryCard
                  icon={DollarSign}
                  value={totalProfit}
                  isProfit={totalProfit >= 0}
                  showTrend
                  size="sm"
                />
                <SummaryCard
                  icon={BarChart2}
                  value={totalTrades}
                  size="sm"
                />
                <SummaryCard
                  icon={CalendarDays}
                  value={tradingDays}
                  size="sm"
                />
                <SummaryCard
                  icon={Percent}
                  value={`${winRate}%`}
                  size="sm"
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
                  onClick={handlePreviousMonth}
                  className="neo-brutalist-blue p-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="neo-brutalist-blue p-2"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {currentView === 'calendar' ? (
              <Calendar
                currentDate={currentDate}
                tradeData={tradeData}
                onDayClick={handleDayClick}
              />
            ) : (
              <ProfitChart
                currentDate={currentDate}
                tradeData={tradeData}
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
  );
}

export default App;