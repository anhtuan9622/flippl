import React from "react";
import { DollarSign, BarChart2, Trash2 } from "lucide-react";
import Button from "../../ui/Button";
import { TradeEntryData } from "../../../types";

interface EntriesListProps {
  entries: TradeEntryData[];
  symbolEntries: { [key: string]: TradeEntryData[] };
  setEntries: (entries: TradeEntryData[]) => void;
  setSymbolEntries: (entries: { [key: string]: TradeEntryData[] }) => void;
  isSubmitting: boolean;
}

export default function EntriesList({
  entries,
  symbolEntries,
  setEntries,
  setSymbolEntries,
  isSubmitting,
}: EntriesListProps) {
  const removeEntry = (index: number) => {
    const entryToRemove = entries[index];
    const symbol = entryToRemove.symbol;

    setEntries(entries.filter((_, i) => i !== index));
    setSymbolEntries((prev) => ({
      ...prev,
      [symbol]: prev[symbol].filter((_, i) => i !== index),
    }));
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0" : num.toFixed(4);
  };

  return (
    <div className="space-y-4 rounded-xl bg-gray-100 p-4">
      <h3 className="text-lg font-bold text-black">Trade Entries</h3>

      {entries.length > 0 && (
        <div className="grid-cols mb-4 grid gap-4 md:grid-cols-2">
          <div className="neo-brutalist-gray p-3">
            <div className="mb-1 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                Estimated P/L
              </span>
            </div>
            {(() => {
              const profitBySymbol = Object.entries(symbolEntries).reduce(
                (acc, [symbol, entries]) => {
                  const buyTotal = entries
                    .filter((e) => e.transaction_type === "Buy")
                    .reduce((sum, e) => {
                      const quantity = parseFloat(e.quantity) || 0;
                      const price = parseFloat(e.price) || 0;
                      const commission = parseFloat(e.commission) || 0;
                      return sum + quantity * price + commission;
                    }, 0);

                  const sellTotal = entries
                    .filter((e) => e.transaction_type === "Sell")
                    .reduce((sum, e) => {
                      const quantity = parseFloat(e.quantity) || 0;
                      const price = parseFloat(e.price) || 0;
                      const commission = parseFloat(e.commission) || 0;
                      return sum + quantity * price - commission;
                    }, 0);

                  acc[symbol] = sellTotal - buyTotal;
                  return acc;
                },
                {} as Record<string, number>
              );

              const totalProfit = Object.values(profitBySymbol).reduce(
                (sum, profit) => sum + profit,
                0
              );

              return (
                <span
                  className={`text-lg font-bold ${
                    totalProfit > 0
                      ? "text-green-600"
                      : totalProfit < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {totalProfit < 0 ? "-" : ""}$
                  {Math.abs(totalProfit).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              );
            })()}
          </div>
          <div className="neo-brutalist-gray p-3">
            <div className="mb-1 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                Trades
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {Object.keys(symbolEntries).filter((symbol) => {
                const entries = symbolEntries[symbol];
                return (
                  entries.some((e) => e.transaction_type === "Buy") &&
                  entries.some((e) => e.transaction_type === "Sell")
                );
              }).length}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2 pb-2">
        {entries.map((entry, index) => (
          <div key={index} className="neo-brutalist-gray p-2">
            <div className="flex items-start justify-between gap-2">
              <div className="w-full">
                <div className="font-bold text-black">{entry.symbol}</div>
                <div className="text-sm text-gray-600">
                  <div
                    className={`font-medium ${
                      entry.transaction_type === "Buy"
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                  >
                    {entry.transaction_type}: {entry.quantity} @ $
                    {formatNumber(entry.price)}
                  </div>
                  <div className="font-semibold">
                    Total: $
                    {entry.total_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                
                    })}
                  </div>
                  {parseFloat(entry.commission) > 0 && (
                    <div>Commission: ${formatNumber(entry.commission)}</div>
                  )}
                  {entry.notes && (
                    <div className="text-gray-600">Notes: {entry.notes}</div>
                  )}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      Tags:{" "}
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white px-1.5 py-0.5 text-xs font-medium text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => removeEntry(index)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="py-8 flex min-h-[200px] flex-col items-center justify-center text-center text-gray-600">
            <p className="mb-2 font-medium">No entries yet.</p>
            <p className="text-sm font-medium">
              Add both Buy & Sell transactions for each symbol to record a trade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}