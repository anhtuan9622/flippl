import React, { useState, useEffect } from "react";
import { DollarSign, BarChart2 } from "lucide-react";
import { TradeEntryData } from "../../../types";
import EntryForm from "./EntryForm";
import EntriesList from "./EntriesList";
import toast from "react-hot-toast";

interface DetailedEntryFormProps {
  date: Date;
  existingTrade?: {
    id: string;
  };
  entries: TradeEntryData[];
  setEntries: (entries: TradeEntryData[]) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onSave: (date: Date, entries: TradeEntryData[], tradeId?: string) => Promise<boolean>;
  onClose: () => void;
  onEntriesUpdated: () => void;
}

export default function DetailedEntryForm({
  date,
  existingTrade,
  entries,
  setEntries,
  isSubmitting,
  setIsSubmitting,
  onSave,
  onClose,
  onEntriesUpdated,
}: DetailedEntryFormProps) {
  const [symbolEntries, setSymbolEntries] = useState(() => entries.reduce((acc, entry) => {
    if (!acc[entry.symbol]) {
      acc[entry.symbol] = [];
    }
    acc[entry.symbol].push(entry);
    return acc;
  }, {} as {
    [key: string]: TradeEntryData[];
  }));

  useEffect(() => {
    // Update symbolEntries whenever entries change
    setSymbolEntries(entries.reduce((acc, entry) => {
      if (!acc[entry.symbol]) {
        acc[entry.symbol] = [];
      }
      acc[entry.symbol].push(entry);
      return acc;
    }, {} as { [key: string]: TradeEntryData[]; }));
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const invalidSymbols: string[] = [];
    const quantityMismatches: string[] = [];

    Object.entries(symbolEntries).forEach(([symbol, entries]) => {
      const buyEntries = entries.filter((e) => e.transaction_type === "Buy");
      const sellEntries = entries.filter((e) => e.transaction_type === "Sell");

      if (!buyEntries.length || !sellEntries.length) {
        invalidSymbols.push(symbol);
        return;
      }

      const buyQuantity = buyEntries.reduce(
        (sum, entry) => sum + (parseFloat(entry.quantity) || 0),
        0
      );

      const sellQuantity = sellEntries.reduce(
        (sum, entry) => sum + (parseFloat(entry.quantity) || 0),
        0
      );

      if (Math.abs(buyQuantity - sellQuantity) > 0.0001) {
        quantityMismatches.push(
          `${symbol} (Buy: ${buyQuantity.toFixed(8)}, Sell: ${sellQuantity.toFixed(8)})`
        );
      }
    });

    if (invalidSymbols.length > 0) {
      toast.error(
        `Missing ${invalidSymbols
          .map((s) => `${s} ${!symbolEntries[s].some((e) => e.transaction_type === "Buy") ? "Buy" : "Sell"}`)
          .join(", ")} transaction${invalidSymbols.length > 1 ? "s" : ""}`
      );
      return;
    }

    if (quantityMismatches.length > 0) {
      toast.error(`Quantity mismatch for: ${quantityMismatches.join(", ")}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const processedEntries = entries.map((entry) => ({
        ...entry,
        quantity: parseFloat(entry.quantity) || 0,
        price: parseFloat(entry.price) || 0,
        commission: parseFloat(entry.commission) || 0,
      }));

      const success = await onSave(date, processedEntries, existingTrade?.id);

      if (success) {
        await onEntriesUpdated();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="detailed-entry-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <EntryForm
        entries={entries}
        setEntries={setEntries}
        symbolEntries={symbolEntries}
        setSymbolEntries={setSymbolEntries}
        isSubmitting={isSubmitting}
      />
      <EntriesList
        entries={entries}
        symbolEntries={symbolEntries}
        setEntries={setEntries}
        setSymbolEntries={setSymbolEntries}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}