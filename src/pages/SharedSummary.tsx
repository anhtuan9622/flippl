import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { calculateStats } from "../utils/stats";
import { supabase } from "../lib/supabase";
import AppLayout from "../components/layout/AppLayout";
import AllTimeSummary from "../components/layout/AllTimeSummary";
import { TimePeriod } from "../components/TimePeriodSelect";
import Button from "../components/ui/Button";
import Section from "../components/layout/Section";
import { DayData } from "../types";
import { parseISO } from "date-fns";

interface SharedProfile {
  id: string;
  email: string;
  share_id: string;
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
  const [tradeData, setTradeData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  const refreshData = async () => {
    if (!shareId || !profile?.id || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const { data: trades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", profile.id)
        .order("date", { ascending: true });

      if (trades) {
        const formattedTrades = trades.map((trade) => ({
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
        setTradeData(formattedTrades);
        toast.success("Data refreshed");
        setLastRefreshTime(new Date());
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let pollInterval: number;

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
            share_id: profile.share_id
          });
          const formattedTrades = (trades || []).map((trade) => ({
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
          setTradeData(formattedTrades);
          setLastRefreshTime(new Date());
          setLoading(false);
        }
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

    // Set up polling every 30 seconds
    pollInterval = window.setInterval(() => {
      if (mounted) refreshData();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [shareId]);

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
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-600">
              Shared by {profile?.email} • Last refreshed:{" "}
              {format(lastRefreshTime, "MMM d, yyyy h:mm a")}
            </div>
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={refreshData}
              disabled={isRefreshing}
              loading={isRefreshing}
            />
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