import { useState, useCallback, useEffect } from 'react';
import { parseISO, format } from 'date-fns';
import { supabase, safeGetSession } from '../lib/supabase';
import toast from 'react-hot-toast';
import { DayData } from '../types';

export function useTradeData(userId: string | null) {
  const [tradeData, setTradeData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchTradeData = useCallback(async () => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });

      if (error) throw error;

      return (data || []).map((trade) => ({
        date: parseISO(trade.date),
        trades: {
          id: trade.id,
          date: parseISO(trade.date),
          profit: trade.profit,
          trades: trade.trades_count,
          winRate: trade.profit > 0 ? 100 : 0,
          notes: trade.notes,
          tags: trade.tags,
        },
      }));
    } catch (error) {
      console.log("Fetch trade data error:", error);
      toast.error("Failed to fetch trade data");
      return [];
    }
  }, [userId]);

  const handleSaveTradeData = async (
    selectedDate: Date,
    data: { profit: number; trades: number; notes?: string; tags?: string[] }
  ) => {
    if (!selectedDate) return;

    try {
      const { session } = await safeGetSession();

      if (!session?.user) {
        toast.error("Your session has expired. Log in again");
        return false;
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const { error } = await supabase.from("trades").upsert(
        {
          user_id: session.user.id,
          date: formattedDate,
          profit: data.profit,
          trades_count: data.trades,
          notes: data.notes,
          tags: data.tags,
        },
        {
          onConflict: "user_id,date",
          ignoreDuplicates: false,
        }
      );

      if (error) throw error;

      const updatedTrades = await fetchTradeData();
      setTradeData(updatedTrades);
      toast.success("Trade data saved successfully");
      return true;
    } catch (error) {
      console.error("Failed to save trade data:", error);
      toast.error("Failed to save trade data. Try again");
      return false;
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      const { session } = await safeGetSession();

      if (!session?.user) {
        toast.error("Your session has expired. Log in again");
        return false;
      }

      const { error } = await supabase.from("trades").delete().match({ id });

      if (error) throw error;

      const updatedTrades = await fetchTradeData();
      setTradeData(updatedTrades);
      toast.success("Trade data deleted successfully");
      return true;
    } catch (error) {
      console.error("Failed to delete trade:", error);
      toast.error("Failed to delete trade. Try again");
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let pollInterval: number | null = null;

    const initializeData = async () => {
      if (!userId) return;

      const trades = await fetchTradeData();
      if (mounted) {
        setTradeData(trades);
        setLoading(false);

        // Set up polling interval
        pollInterval = window.setInterval(async () => {
          if (mounted) {
            const updatedTrades = await fetchTradeData();
            setTradeData(updatedTrades);
          }
        }, 30000);
      }
    };

    initializeData();

    return () => {
      mounted = false;
      if (typeof pollInterval === "number") {
        window.clearInterval(pollInterval);
      }
    };
  }, [userId, fetchTradeData]);

  return {
    tradeData,
    loading,
    setTradeData,
    fetchTradeData,
    handleSaveTradeData,
    handleDeleteTrade,
  };
}