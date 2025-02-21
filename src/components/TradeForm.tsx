import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Trash2 } from 'lucide-react';

interface TradeFormProps {
  date: Date;
  existingTrade?: {
    id: string;
    profit: number;
    trades: number;
  };
  onSave: (data: { profit: number; trades: number }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function TradeForm({ date, existingTrade, onSave, onDelete, onClose }: TradeFormProps) {
  const [profit, setProfit] = useState(existingTrade ? String(existingTrade.profit) : '');
  const [trades, setTrades] = useState(existingTrade ? String(existingTrade.trades) : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      profit: Number(profit),
      trades: Number(trades),
    });
  };

  const handleDelete = () => {
    if (existingTrade && onDelete) {
      onDelete(existingTrade.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="neo-brutalist-white p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-black">
            {existingTrade ? 'Edit' : 'Add'} Trade Data
            <div className="text-base font-bold text-gray-600">
              {format(date, 'MMMM d, yyyy')}
            </div>
          </h2>
          <button
            onClick={onClose}
            className="neo-brutalist-gray p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-black text-black mb-2">
              Profit/Loss ($)
            </label>
            <input
              type="number"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              className="neo-input w-full"
              placeholder="Enter amount (negative for losses)"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-black text-black mb-2">
              Number of Trades
            </label>
            <input
              type="number"
              value={trades}
              onChange={(e) => setTrades(e.target.value)}
              className="neo-input w-full"
              placeholder="Enter number of trades"
              required
              min="1"
            />
          </div>
          
          <div className="flex justify-between gap-3 pt-4">
            {existingTrade && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="neo-brutalist-red px-4 py-2 font-bold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="neo-brutalist-gray px-4 py-2 font-bold text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="neo-brutalist-blue px-4 py-2 font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}