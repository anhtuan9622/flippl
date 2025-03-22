import React, { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { X, Trash2, Save } from "lucide-react";
import Button from "../../ui/Button";
import { useTradeEntries } from "../../../hooks/useTradeEntries";
import { TradeEntryData } from "../../../types";
import ModeSelector from "./ModeSelector";
import ManualEntryForm from "./ManualEntryForm";
import DetailedEntryForm from "./DetailedEntryForm";

interface TradeDataModalProps {
  date: Date;
  existingTrade?: {
    id: string;
    profit: number;
    trades: number;
    notes?: string;
    tags?: string[];
  };
  onSave: (data: { profit: number; trades: number; notes?: string; tags?: string[] }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  onEntriesUpdated: () => void;
}

export default function TradeDataModal({
  date,
  existingTrade,
  onSave,
  onDelete,
  onClose,
  onEntriesUpdated,
}: TradeDataModalProps) {
  const [isDetailedMode, setIsDetailedMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<TradeEntryData[]>([]);
  const [formValues, setFormValues] = useState<{ profit: string; trades: string }>({
    profit: existingTrade?.profit.toString() || '',
    trades: existingTrade?.trades.toString() || ''
  });
  
  const {
    loading: entriesLoading,
    saveTradeEntries,
    deleteTradeEntries,
    data: existingEntries
  } = useTradeEntries(existingTrade?.id);

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
    }
  }, [existingEntries]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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
  }, [existingTrade, onDelete, isSubmitting, isDetailedMode, deleteTradeEntries, onEntriesUpdated]);

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

        <div className="flex-1 space-y-6 pb-2 overflow-y-auto pr-2">
          <ModeSelector
            isDetailedMode={isDetailedMode}
            onModeChange={setIsDetailedMode}
            disabled={isSubmitting || entries.length > 0}
          />

          {isDetailedMode ? (
            <DetailedEntryForm
              date={date}
              existingTrade={existingTrade}
              entries={entries}
              setEntries={setEntries}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              onSave={saveTradeEntries}
              onClose={onClose}
              onEntriesUpdated={onEntriesUpdated}
            />
          ) : (
            <ManualEntryForm
              existingTrade={existingTrade}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              onSave={onSave}
              onClose={onClose}
              onFormChange={setFormValues}
            />
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
                form={isDetailedMode ? "detailed-entry-form" : "manual-entry-form"}
                disabled={
                  isSubmitting ||
                  (isDetailedMode && entries.length === 0) ||
                  (!isDetailedMode && !formValues.profit) ||
                  (!isDetailedMode && !formValues.trades)
                }
                loading={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}