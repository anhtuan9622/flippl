import React from "react";
import { Baseline, List } from "lucide-react";
import Button from "../../ui/Button";

interface ModeSelectorProps {
  isDetailedMode: boolean;
  onModeChange: (mode: boolean) => void;
  disabled?: boolean;
}

export default function ModeSelector({
  isDetailedMode,
  onModeChange,
  disabled = false,
}: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={isDetailedMode ? "default" : "select"}
        type="button"
        icon={Baseline}
        onClick={() => onModeChange(false)}
        disabled={disabled}
      >
        Manual Entry Mode
      </Button>

      <Button
        variant={isDetailedMode ? "select" : "default"}
        type="button"
        icon={List}
        onClick={() => onModeChange(true)}
        disabled={disabled}
      >
        Detailed Entry Mode
      </Button>
    </div>
  );
}