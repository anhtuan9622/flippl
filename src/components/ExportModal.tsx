import React, { useState } from "react";
import { Download, Check } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport();
      onClose();
      toast.success("Trade data exported successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export trade data. Try again"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="neo-brutalist-white p-6">
            <Dialog.Title className="text-2xl font-black text-black mb-4">
              Export Trades
            </Dialog.Title>

            <div className="space-y-4">
              <p className="text-gray-600">
                Export your trade data as a CSV file. The export will include:
              </p>
              <ul className="list-disc list-inside text-gray-600">
                <li>Daily profit/loss</li>
                <li>Number of trades per day</li>
                <li>Win/loss status for each day</li>
                <li>All-time summary statistics</li>
              </ul>

              <div className="flex justify-end gap-3 pt-4">
                <Dialog.Close asChild>
                  <button
                    className="neo-brutalist-gray px-4 py-2 font-bold"
                    disabled={isExporting}
                  >
                    Close
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleExport}
                  className="neo-brutalist-blue px-4 py-2 font-bold flex items-center gap-2"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Check className="w-4 h-4" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
