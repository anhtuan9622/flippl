import React, { useState, useEffect } from "react";
import { DollarSign, BarChart2, Save } from "lucide-react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Textarea from "../../ui/Textarea";
import TagGroup from "../../ui/TagGroup";
import { STRATEGY_TAGS } from "../../../constants/tags";
import toast from "react-hot-toast";

interface ManualEntryFormProps {
  existingTrade?: {
    profit: number;
    trades: number;
    notes?: string;
    tags?: string[];
  };
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onSave: (data: { profit: number; trades: number; notes?: string; tags?: string[] }) => void;
  onClose: () => void;
  onFormChange?: (values: { profit: string; trades: string }) => void;
}

export default function ManualEntryForm({
  existingTrade,
  isSubmitting,
  setIsSubmitting,
  onSave,
  onClose,
  onFormChange,
}: ManualEntryFormProps) {
  const [profit, setProfit] = useState(existingTrade ? String(existingTrade.profit) : "");
  const [trades, setTrades] = useState(existingTrade ? String(existingTrade.trades) : "");
  const [notes, setNotes] = useState(existingTrade?.notes || "");
  const [tags, setTags] = useState<string[]>(existingTrade?.tags || []);
  const [errors, setErrors] = useState<{
    profit?: string;
    trades?: string;
  }>({});

  useEffect(() => {
    onFormChange?.({ profit, trades });
  }, [profit, trades, onFormChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    setIsSubmitting(true);
    try {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="manual-entry-form" onSubmit={handleSubmit} className="gap-8 grid-cols grid md:grid-cols-2">
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
        <Textarea
          label="Notes"
          placeholder="Add your trade notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          name="notes"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <TagGroup
          label="Tags"
          tags={STRATEGY_TAGS}
          selectedTags={tags}
          onTagToggle={(tag) => {
            setTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            );
          }}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}