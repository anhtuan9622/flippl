import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { TradeEntryData } from '../types';
import toast from 'react-hot-toast';

interface UseTradeEntriesOptions {
  onEntriesUpdated?: () => void;
}

export function useTradeEntries(tradeId?: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TradeEntryData[]>([]);

  const deleteEntry = useCallback(async (entry: TradeEntryData) => {
    if (loading || !entry.id) return false;
    
    try {
      const { error } = await supabase
        .from('trade_entries')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      setData(prev => prev.filter(e => e.id !== entry.id));
      toast.success('Trade entry deleted');
      return true;
    } catch (error) {
      console.error('Error deleting trade entry:', error);
      toast.error('Failed to delete trade entry');
      return false;
    }
  }, [loading]);

  useEffect(() => {
    if (tradeId) {
      fetchTradeEntries(tradeId).then(setData);
    }
  }, [tradeId]);

  const fetchTradeEntries = useCallback(async (tradeId: string) => {
    try {
      const { data, error } = await supabase
        .from('trade_entries')
        .select('*')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data as TradeEntryData[];
    } catch (error) {
      console.error('Error fetching trade entries:', error);
      toast.error('Failed to fetch trade entries');
      return [];
    }
  }, []);

  const saveTradeEntries = useCallback(async (
    date: Date,
    entries: TradeEntryData[],
    tradeId?: string,
    onSuccess?: () => void
  ) => {
    if (loading) return false;
    setLoading(true);

    let finalTradeId = tradeId;
    try {
      // If no tradeId, create a new trade first
      if (!tradeId) {
        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .insert({
            date: format(date, 'yyyy-MM-dd'),
            profit: 0,
            trades_count: 0,
            entry_mode: 'detailed',
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (tradeError) throw tradeError;
        if (!trade) throw new Error('Failed to create trade');
        finalTradeId = trade.id;
      } else {
        // Delete existing entries before saving new ones
        await supabase
          .from('trade_entries')
          .delete()
          .eq('trade_id', tradeId);
      }

      // Insert all trade entries
      const { error: entriesError } = await supabase
        .from('trade_entries')
        .insert(
          entries.map(({ id, ...entry }) => ({
            ...entry,
            trade_id: finalTradeId
          }))
        );

      if (entriesError) throw entriesError;

      toast.success('Trade entries saved successfully');
      if (onSuccess) {
        onSuccess();
      }
      setData(entries);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save trade entries';
      console.error('Error saving trade entries:', error);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const deleteTradeEntries = useCallback(async (tradeId: string) => {
    if (loading) return false;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('trade_entries')
        .delete()
        .eq('trade_id', tradeId);

      if (error) throw error;

      toast.success('Trade entries deleted successfully');
      setData([]);
      return true;
    } catch (error) {
      console.error('Error deleting trade entries:', error);
      toast.error('Failed to delete trade entries');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return {
    loading,
    fetchTradeEntries,
    data,
    deleteEntry,
    saveTradeEntries,
    deleteTradeEntries,
  };
}