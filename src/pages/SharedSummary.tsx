import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import {
  format,
  parseISO,
  startOfYear,
  startOfMonth,
  startOfWeek,
  endOfDay,
  isSameDay,
  isAfter,
} from "date-fns";
import { supabase } from "../lib/supabase";
import AppLayout from "../components/layout/AppLayout";
import AllTimeSummary from "../components/layout/AllTimeSummary";
import { TimePeriod } from "../components/TimePeriodSelect";
import Section from "../components/layout/Section";

interface SharedProfile {
  id: string;
  email: string;
  share_id: string;
  updated_at: string;
}

interface SharedStats {
  profit: number;
  trades: number;
  tradingDays: number;
  winRate: number;
}

const maskEmail = (email: string) => {
  const [username, domain] = email.split("@");
  if (!username || !domain) return email;

  const maskedUsername =
    username.length > 3
      ? `${username.slice(0, 3)}${"*".repeat(username.length - 3)}`
      : username;

  return `${maskedUsername}@${domain}`;
};

export default function SharedSummary() {
  const { shareId } = useParams<{ shareId: string }>();
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [stats, setStats] = useState<SharedStats>({
    profit: 0,
    trades: 0,
    tradingDays: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time");
  const [tradeData, setTradeData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    let subscription: any;

    const fetchSharedData = async () => {
      if (!shareId) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("share_id", shareId)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          throw new Error("Share link not found");
        }

        if (!profile) {
          throw new Error("Share link not found");
        }

        // Get trades data
        const { data: trades, error: tradesError } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", profile.id)
          .order("date", { ascending: true });

        if (tradesError) throw tradesError;

        if (mounted) {
          setProfile({
            id: profile.id,
            email: maskEmail(profile.email || "Anonymous"),
            share_id: profile.share_id,
            updated_at: profile.updated_at,
          });
          setTradeData(trades || []);
          setLoading(false);
        }

        // Subscribe to trades changes
        subscription = supabase
          .channel(`trades_${profile.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "trades",
              filter: `user_id=eq.${profile.id}`,
            },
            async () => {
              // Refetch trades on any change
              const { data: updatedTrades } = await supabase
                .from("trades")
                .select("*")
                .eq("user_id", profile.id)
                .order("date", { ascending: true });

              if (mounted && updatedTrades) {
                setTradeData(updatedTrades);
              }
            }
          )
          .subscribe();
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load shared summary. Try again"
          );
          setLoading(false);
        }
      }
    };

    fetchSharedData();

    return () => {
      mounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [shareId]);

  const calculateStats = (trades: any[], period: TimePeriod): SharedStats => {
    const now = endOfDay(new Date());
    let filteredTrades = [...trades];

    switch (period) {
      case "year-to-date":
        const yearStart = startOfYear(now);
        filteredTrades = trades.filter((trade) => {
          const tradeDate = parseISO(trade.date);
          return (
            isAfter(tradeDate, yearStart) || isSameDay(tradeDate, yearStart)
          );
        });
        break;
      case "month-to-date":
        const monthStart = startOfMonth(now);
        filteredTrades = trades.filter((trade) => {
          const tradeDate = parseISO(trade.date);
          return (
            isAfter(tradeDate, monthStart) || isSameDay(tradeDate, monthStart)
          );
        });
        break;
      case "week-to-date":
        const weekStart = startOfWeek(now, { weekStartsOn: 0 });
        filteredTrades = trades.filter((trade) => {
          const tradeDate = parseISO(trade.date);
          return (
            isAfter(tradeDate, weekStart) || isSameDay(tradeDate, weekStart)
          );
        });
        break;
      default:
        break;
    }

    if (!filteredTrades.length) {
      return {
        profit: 0,
        trades: 0,
        tradingDays: 0,
        winRate: 0,
      };
    }

    const totalProfit = filteredTrades.reduce(
      (sum, trade) => sum + (trade.profit || 0),
      0
    );
    const totalTrades = filteredTrades.reduce(
      (sum, trade) => sum + (trade.trades_count || 0),
      0
    );
    const tradingDays = filteredTrades.length;
    const profitableDays = filteredTrades.filter(
      (trade) => trade.profit > 0
    ).length;
    const winRate = tradingDays > 0 ? (profitableDays / tradingDays) * 100 : 0;

    const EPSILON = 1e-10;
    const normalizedProfit = Math.abs(totalProfit) < EPSILON ? 0 : totalProfit;

    return {
      profit: normalizedProfit,
      trades: totalTrades,
      tradingDays,
      winRate,
    };
  };

  if (loading) {
    return (
      <AppLayout loading={true}>
        <div />
      </AppLayout>
    );
  }

  if (error || !profile) {
    return (
      <AppLayout>
        <div className="neo-brutalist-white p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 neo-brutalist-gray flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-black mb-4">Oops!</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="neo-brutalist-blue px-6 py-3 font-bold inline-flex items-center gap-2"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AllTimeSummary
        stats={calculateStats(tradeData, timePeriod)}
        isLoading={loading}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        actions={
          <div className="text-sm font-medium text-gray-600">
            Shared by {profile?.email} • Last updated:{" "}
            {profile?.updated_at
              ? format(parseISO(profile.updated_at), "MMM d, yyyy")
              : ""}
          </div>
        }
      />

      <Section>
        <Section.Content className="text-center">
          <p className="text-black font-medium">
            Want to track your own trading performance?{" "}
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Sign up for free
            </Link>
          </p>
        </Section.Content>
      </Section>
    </AppLayout>
  );
}
