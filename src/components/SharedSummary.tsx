import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { format, parseISO, startOfYear, endOfMonth, isAfter, isBefore, addMonths, startOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';
import AllTimeSummary from './AllTimeSummary';
import { DayData } from '../types';

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
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const maskedUsername = username.length > 3
    ? `${username.slice(0, 3)}${'*'.repeat(username.length - 3)}`
    : username;
  
  return `${maskedUsername}@${domain}`;
};

const calculateStats = (trades: any[]): SharedStats => {
  if (!trades.length) {
    return {
      profit: 0,
      trades: 0,
      tradingDays: 0,
      winRate: 0
    };
  }

  const totalProfit = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const totalTrades = trades.reduce((sum, trade) => sum + (trade.trades_count || 0), 0);
  const tradingDays = trades.length;
  const profitableDays = trades.filter(trade => trade.profit > 0).length;
  const winRate = tradingDays > 0 ? (profitableDays / tradingDays) * 100 : 0;
    
    // Add a threshold check for near-zero values
    const EPSILON = 1e-10; // Threshold for considering a number as zero
    const normalizedProfit = Math.abs(totalProfit) < EPSILON ? 0 : totalProfit;

  return {
    profit: normalizedProfit,
    trades: totalTrades,
    tradingDays,
    winRate
  };
};

export default function SharedSummary() {
  const { shareId } = useParams<{ shareId: string }>();
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [stats, setStats] = useState<SharedStats>({
    profit: 0,
    trades: 0,
    tradingDays: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: any;

    const fetchSharedData = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('share_id', shareId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw new Error('Share link not found');
        }

        if (!profile) {
          throw new Error('Share link not found');
        }

        // Get trades data
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', profile.id)
          .order('date', { ascending: true });

        if (tradesError) throw tradesError;

        if (mounted) {
          setProfile({
            id: profile.id,
            email: maskEmail(profile.email || 'Anonymous'),
            share_id: profile.share_id,
            updated_at: profile.updated_at
          });
          setStats(calculateStats(trades || []));
          setLoading(false);
        }

        // Subscribe to trades changes
        subscription = supabase
          .channel(`trades_${profile.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'trades',
              filter: `user_id=eq.${profile.id}`,
            },
            async () => {
              // Refetch trades on any change
              const { data: updatedTrades } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', profile.id)
                .order('date', { ascending: true });

              if (mounted && updatedTrades) {
                setStats(calculateStats(updatedTrades));
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Error in fetchSharedData:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load shared summary');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-xl font-bold text-black neo-brutalist-white px-8 py-4">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Header />
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
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Header />

        <AllTimeSummary
          stats={stats}
          title="All-Time Summary"
          actions={
            <div className="text-sm font-medium text-gray-600">
              Shared by {profile.email} • Last updated: {format(parseISO(profile.updated_at), 'MMM d, yyyy')}
            </div>
          }
        />

        <div className="neo-brutalist-white p-6 text-center">
          <p className="text-black font-medium">
            Want to track your own trading performance?{' '}
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-bold">
              Sign up for free
            </Link>
          </p>
        </div>

        <Footer />
      </div>
    </div>
  );
}