import React, { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Textarea from "../../ui/Textarea";
import TagGroup from "../../ui/TagGroup";
import { STRATEGY_TAGS } from "../../../constants/tags";
import { TradeEntryData } from "../../../types";
import toast from "react-hot-toast";

interface EntryFormProps {
  entries: TradeEntryData[];
  setEntries: (entries: TradeEntryData[]) => void;
  symbolEntries: { [key: string]: TradeEntryData[] };
  setSymbolEntries: (entries: { [key: string]: TradeEntryData[] }) => void;
  isSubmitting: boolean;
}

export default function EntryForm({
  entries,
  setEntries,
  symbolEntries,
  setSymbolEntries,
  isSubmitting,
}: EntryFormProps) {
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
  }>({});

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
    setCurrentEntry((prev) => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return { ...prev, tags: newTags };
    });
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
      const buyEntries = existingEntries.filter((e) => e.transaction_type === "Buy");

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

  return (
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

        <div>
          <label className="mb-2 block text-sm font-black text-black">
            Total Amount ($)
          </label>
          <div className="neo-input w-full bg-gray-100">
            ${currentEntry.total_amount.toLocaleString(undefined, {
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
  );
}