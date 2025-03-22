import React, { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import {
  X,
  Trash2,
  Save,
  List,
  DollarSign,
  BarChart2,
  Baseline,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import toast from "react-hot-toast";
import { useTradeEntries } from "../../hooks/useTradeEntries";
import { TradeEntryData } from "../../types";
import Textarea from "../ui/Textarea";
import TagGroup from "../ui/TagGroup";

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
  onEntriesUpdated: () => void;
}

const STRATEGY_TAGS = [
  "daytrade",
  "scalping",
  "breakout",
  "pullback",
  "reversal",
  "high volume",
  "momentum",
  "news play",
  "earnings play",
  "meme stock",
  "swing trade",
  "other"
];

export default function TradeForm({
  date,
  existingTrade,
  onSave,
  onDelete,
  onClose,
  onEntriesUpdated,
}: TradeFormProps) {
  const [profit, setProfit] = useState(
    existingTrade ? String(existingTrade.profit) : ""
  );
  const [isDetailedMode, setIsDetailedMode] = useState(false);
  const [trades, setTrades] = useState(
    existingTrade ? String(existingTrade.trades) : ""
  );
  const [notes, setNotes] = useState(existingTrade?.notes || "");
  const [tags, setTags] = useState<string[]>(existingTrade?.tags || []);
  const [hasExistingEntries, setHasExistingEntries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TradeEntryData>({
    transaction_type: "Buy",
    symbol: "",
    quantity: "",
    price: "",
    total_amount: 0,
    commission: "",
    notes: "",
    tags: [],
  });
  const [errors, setErrors] = useState<{
    symbol?: string;
    quantity?: string;
    price?: string;
    profit?: string;
    trades?: string;
  }>({});
  const [entries, setEntries] = useState<TradeEntryData[]>([]);
  const [symbolEntries, setSymbolEntries] = useState<{
    [key: string]: TradeEntryData[];
  }>({});

  useEffect(() => {
    setHasExistingEntries(entries.length > 0);
  }, [entries]);

  const {
    loading: entriesLoading,
    saveTradeEntries,
    deleteTradeEntries,
    deleteEntry,
  } = useTradeEntries();
  const { data: existingEntries } = useTradeEntries(existingTrade?.id);

  useEffect(() => {
    if (existingEntries?.length > 0) {
      const formattedEntries = existingEntries.map((entry) => ({
        ...entry,
        quantity: String(entry.quantity),
        price: String(entry.price),
        commission: String(entry.commission || 0),
      }));

      setEntries(formattedEntries);
      setIsDetailedMode(true);

      const grouped = formattedEntries.reduce((acc, entry) => {
        if (!acc[entry.symbol]) {
          acc[entry.symbol] = [];
        }
        acc[entry.symbol].push(entry);
        return acc;
      }, {} as { [key: string]: TradeEntryData[] });

      setSymbolEntries(grouped);
    }
  }, [existingEntries]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const quantity = parseFloat(currentEntry.quantity) || 0;
    const price = parseFloat(currentEntry.price) || 0;
    const total = quantity * price;

    setCurrentEntry((prev) => ({
      ...prev,
      total_amount: Number(total.toFixed(4)),
    }));
  }, [currentEntry.quantity, currentEntry.price]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setErrors((prev) => ({ ...prev, [name]: undefined }));

    if (name === "symbol") {
      setCurrentEntry((prev) => ({
        ...prev,
        symbol: value.toUpperCase(),
      }));
      return;
    }

    if (name === "quantity" || name === "price" || name === "commission") {
      if (!/^$|^[0-9]*\.?[0-9]*$/.test(value)) {
        return;
      }

      setCurrentEntry((prev) => ({
        ...prev,
        [name]: value,
      }));
      return;
    }

    setCurrentEntry((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagToggle = (tag: string) => {
    if (isDetailedMode) {
      setCurrentEntry((prev) => {
        const currentTags = prev.tags || [];
        const newTags = currentTags.includes(tag)
          ? currentTags.filter((t) => t !== tag)
          : [...currentTags, tag];
        return { ...prev, tags: newTags };
      });
    } else {
      setTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    }
  };

  const addEntry = () => {
    const newErrors: typeof errors = {};

    if (!currentEntry.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    }

    const quantity = parseFloat(currentEntry.quantity);
    if (!quantity || quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    const price = parseFloat(currentEntry.price);
    if (!price || price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields correctly");
      return;
    }

    const symbol = currentEntry.symbol;
    const entry = { ...currentEntry, symbol };

    const existingEntries = symbolEntries[symbol] || [];

    if (entry.transaction_type === "Sell") {
      const buyEntries = existingEntries.filter(
        (e) => e.transaction_type === "Buy"
      );

      if (buyEntries.length === 0) {
        toast.error(`Add a Buy transaction for ${symbol} first`);
        return;
      }

      const totalBuyQuantity = buyEntries.reduce(
        (sum, e) => sum + (parseFloat(e.quantity) || 0),
        0
      );

      const totalSellQuantity = existingEntries
        .filter((e) => e.transaction_type === "Sell")
        .reduce((sum, e) => sum + (parseFloat(e.quantity) || 0), 0);

      if (totalSellQuantity + quantity > totalBuyQuantity) {
        toast.error(
          `Cannot sell more than bought quantity (${totalBuyQuantity} shares) for ${symbol}`
        );
        return;
      }
    }

    const newEntries = [...entries, entry];
    setEntries(newEntries);

    setSymbolEntries((prev) => ({
      ...prev,
      [symbol]: [...(prev[symbol] || []), entry],
    }));

    setCurrentEntry({
      transaction_type: "Buy",
      symbol: "",
      quantity: "",
      price: "",
      total_amount: 0,
      commission: "",
      notes: "",
      tags: [],
    });
  };

  const removeEntry = async (index: number) => {
    const entryToRemove = entries[index];
    const symbol = entryToRemove.symbol;

    // Just remove from local state without deleting from database
    setEntries(entries.filter((_, i) => i !== index));
    setSymbolEntries((prev) => ({
      ...prev,
      [symbol]: prev[symbol].filter((e, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isDetailedMode && entries.length > 0) {
      e.currentTarget.setAttribute("novalidate", "");
    }

    setErrors({});

    if (!isDetailedMode) {
      const newErrors: typeof errors = {};

      if (!profit.trim()) {
        newErrors.profit = "Profit/Loss is required";
      } else if (isNaN(Number(profit))) {
        newErrors.profit = "Must be a valid number";
      }

      if (!trades.trim()) {
        newErrors.trades = "Number of trades is required";
      } else if (isNaN(Number(trades)) || Number(trades) < 1) {
        newErrors.trades = "Must be at least 1 trade";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fill in all required fields correctly");
        return;
      }
    }

    if (isDetailedMode) {
      const invalidSymbols: string[] = [];
      const quantityMismatches: string[] = [];

      Object.entries(symbolEntries).forEach(([symbol, entries]) => {
        const buyEntries = entries.filter((e) => e.transaction_type === "Buy");
        const sellEntries = entries.filter(
          (e) => e.transaction_type === "Sell"
        );

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
            `${symbol} (Buy: ${buyQuantity.toFixed(
              8
            )}, Sell: ${sellQuantity.toFixed(8)})`
          );
        }
      });

      if (invalidSymbols.length > 0) {
        toast.error(
          `Missing ${invalidSymbols
            .map(
              (s) =>
                `${s} ${
                  !symbolEntries[s].some((e) => e.transaction_type === "Buy")
                    ? "Buy"
                    : "Sell"
                }`
            )
            .join(", ")} transaction${invalidSymbols.length > 1 ? "s" : ""}`
        );
        return;
      }

      if (quantityMismatches.length > 0) {
        toast.error(`Quantity mismatch for: ${quantityMismatches.join(", ")}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (isDetailedMode) {
        const processedEntries = entries.map((entry) => ({
          ...entry,
          quantity: parseFloat(entry.quantity) || 0,
          price: parseFloat(entry.price) || 0,
          commission: parseFloat(entry.commission) || 0,
        }));

        const success = await saveTradeEntries(
          date,
          processedEntries,
          existingTrade?.id,
          onEntriesUpdated
        );

        if (success) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          onClose();
        }
      } else {
        const success = await onSave({
          profit: Number(profit),
          trades: Number(trades),
          notes,
          tags,
          entry_mode: "manual",
        });

        if (success) {
          onClose();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!existingTrade || !onDelete || isSubmitting) return;

    let success = false;
    setIsSubmitting(true);
    try {
      if (isDetailedMode && existingTrade.id) {
        success = await deleteTradeEntries(existingTrade.id);
        if (!success) return;
      }
      success = await onDelete(existingTrade.id);
      if (success) {
        await onEntriesUpdated();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    existingTrade,
    onDelete,
    isSubmitting,
    isDetailedMode,
    deleteTradeEntries,
    onEntriesUpdated,
  ]);

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0" : num.toFixed(4);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="neo-brutalist-white my-auto flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden p-6"
        onClick={handleModalClick}
      >
        <div className="mb-6 flex flex-shrink-0 items-center justify-between">
          <h2 className="text-2xl font-black text-black">
            {existingTrade ? "Edit" : "Add"} Trade Data
            <div className="text-base font-bold text-gray-600">
              {format(date, "MMMM d, yyyy")}
            </div>
          </h2>
          <Button
            variant="default"
            icon={X}
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className={`flex-1 space-y-6 pb-2 ${
            isDetailedMode && "overflow-y-auto pr-2"
          }`}
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isDetailedMode ? "default" : "select"}
              type="button"
              icon={Baseline}
              onClick={() => setIsDetailedMode(false)}
              disabled={isSubmitting || hasExistingEntries}
            >
              Manual Entry Mode
            </Button>

            <Button
              variant={isDetailedMode ? "select" : "default"}
              type="button"
              icon={List}
              onClick={() => setIsDetailedMode(true)}
              disabled={isSubmitting}
            >
              Detailed Entry Mode
            </Button>
          </div>

          {!isDetailedMode ? (
            <div className="gap-8 grid-cols grid md:grid-cols-2">
              <Input
                type="number"
                value={profit}
                onChange={(e) => {
                  setProfit(e.target.value);
                  setErrors((prev) => ({ ...prev, profit: undefined }));
                }}
                label="Profit/Loss ($)"
                placeholder="Enter amount (negative for losses)"
                required
                disabled={isSubmitting}
                max="100000000"
                min="-100000000"
                step="any"
                error={errors.profit}
                icon={DollarSign}
              />

              <Input
                type="number"
                value={trades}
                onChange={(e) => {
                  setTrades(e.target.value);
                  setErrors((prev) => ({ ...prev, trades: undefined }));
                }}
                label="Number of Trades"
                placeholder="Enter number of trades"
                required
                disabled={isSubmitting}
                min="1"
                max="1000000"
                error={errors.trades}
                icon={BarChart2}
              />

              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Notes
                </label>
                <Textarea
                  placeholder="Add your trade notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  name="notes"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Tags
                </label>
                <TagGroup
                  tags={STRATEGY_TAGS}
                  selectedTags={tags}
                  onTagToggle={handleTagToggle}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-xl bg-gray-100 p-4">
                <h3 className="text-lg font-bold text-black">Add New Entry</h3>

                <div className="grid-cols grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-black">
                      Transaction Type
                    </label>
                    <select
                      name="transaction_type"
                      value={currentEntry.transaction_type}
                      onChange={handleInputChange}
                      className="neo-input h-[48px] w-full"
                      disabled={isSubmitting}
                    >
                      <option value="Buy">Buy</option>
                      <option value="Sell">Sell</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      type="text"
                      name="symbol"
                      value={currentEntry.symbol}
                      onChange={handleInputChange}
                      label="Symbol"
                      placeholder="AAPL"
                      maxLength={10}
                      disabled={isSubmitting}
                      error={errors.symbol}
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      name="quantity"
                      value={currentEntry.quantity}
                      onChange={handleInputChange}
                      label="Quantity"
                      placeholder="100"
                      disabled={isSubmitting}
                      error={errors.quantity}
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      name="price"
                      value={currentEntry.price}
                      onChange={handleInputChange}
                      label="Price ($)"
                      placeholder="150.00"
                      disabled={isSubmitting}
                      error={errors.price}
                      icon={DollarSign}
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      name="commission"
                      value={currentEntry.commission}
                      onChange={handleInputChange}
                      label="Commission ($)"
                      placeholder="0.00"
                      disabled={isSubmitting}
                      icon={DollarSign}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-black">
                      Total Amount ($)
                    </label>
                    <div className="neo-input w-full bg-gray-100">
                      $
                      {currentEntry.total_amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Textarea
                      label="Notes"
                      placeholder="Add your trade notes here..."
                      value={currentEntry.notes}
                      onChange={handleInputChange}
                      name="notes"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-span-2">
                    <TagGroup
                      label="Tags"
                      tags={STRATEGY_TAGS}
                      selectedTags={currentEntry.tags || []}
                      onTagToggle={handleTagToggle}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  type="button"
                  onClick={addEntry}
                  disabled={
                    isSubmitting ||
                    !currentEntry.symbol ||
                    !parseFloat(currentEntry.quantity) ||
                    !parseFloat(currentEntry.price)
                  }
                >
                  Add Entry
                </Button>
              </div>

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
                        const profitBySymbol = Object.entries(
                          symbolEntries
                        ).reduce((acc, [symbol, entries]) => {
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
                        }, {} as Record<string, number>);

                        const totalProfit = Object.values(
                          profitBySymbol
                        ).reduce((sum, profit) => sum + profit, 0);

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
                        {
                          Object.keys(symbolEntries).filter((symbol) => {
                            const entries = symbolEntries[symbol];
                            return (
                              entries.some(
                                (e) => e.transaction_type === "Buy"
                              ) &&
                              entries.some((e) => e.transaction_type === "Sell")
                            );
                          }).length
                        }
                      </span>
                    </div>
                  </div>
                )}

                <div className="max-h-[40vh] space-y-2 overflow-y-auto pb-2 pr-2">
                  {entries.map((entry, index) => (
                    <div key={index} className="neo-brutalist-gray p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-full">
                          <div className="font-bold text-black">
                            {entry.symbol}
                          </div>
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
                              <div>
                                Commission: ${formatNumber(entry.commission)}
                              </div>
                            )}
                            {entry.notes && (
                              <div className="text-gray-600">
                                Notes: {entry.notes}
                              </div>
                            )}
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                Tags: {entry.tags.map((tag) => (
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
                        Add both Buy & Sell transactions for each symbol to
                        record a trade.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto flex justify-between gap-3 border-t-4 border-black pt-4">
            {existingTrade && onDelete && (
              <Button
                variant="danger"
                icon={Trash2}
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
              />
            )}
            <div className="ml-auto flex gap-3">
              <Button
                variant="default"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                type="submit"
                disabled={
                  isSubmitting ||
                  (isDetailedMode && entries.length === 0) ||
                  (!isDetailedMode && !profit) ||
                  (!isDetailedMode && !trades)
                }
                loading={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}