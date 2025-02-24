import React, { useState, useRef, useEffect } from "react";
import { DollarSign, Percent, TrendingUp, TrendingDown } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface SummaryCardProps {
  icon: typeof DollarSign;
  value: string | number;
  label?: string;
  showTrend?: boolean;
  size?: "sm" | "lg";
  tooltipText?: string;
  isLoading?: boolean;
}

const formatNumber = (
  value: number,
  isDollar: boolean,
  isPercent: boolean = false
): string => {
  if (isDollar) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  }
  if (isPercent) {
    return (
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(value) + "%"
    );
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
};

const useCountUp = (endValue: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);
  const endValueRef = useRef(endValue);

  useEffect(() => {
    endValueRef.current = endValue;
    startTimeRef.current = performance.now();
    countRef.current = count;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      const nextCount =
        progress === 1
          ? endValueRef.current
          : countRef.current +
            (endValueRef.current - countRef.current) * easeOutQuart;

      setCount(nextCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  return count;
};

export default function SummaryCard({
  icon: Icon,
  value,
  label,
  showTrend = false,
  size = "lg",
  tooltipText,
  isLoading = false,
}: SummaryCardProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const isNumber = typeof value === "number";
  const shouldShowDollarPrefix = isNumber && Icon === DollarSign;
  const isPercentValue = isNumber && Icon === Percent;

  const countUpValue = useCountUp(isNumber ? (value as number) : 0, 1000);
  const animatedValue = isNumber ? countUpValue : null;

  const formattedValue = isNumber
    ? formatNumber(animatedValue!, shouldShowDollarPrefix, isPercentValue)
    : value;

  const valueWithPrefix = shouldShowDollarPrefix
    ? (value as number) < 0
      ? `-$${formattedValue}`
      : `$${formattedValue}`
    : formattedValue;

  const LoadingPlaceholder = () => (
    <div className="animate-pulse">
      <div
        className={`h-${size === "lg" ? "8" : "6"} bg-gray-200 rounded-lg w-24`}
      ></div>
    </div>
  );

  const card = (
    <div
      className={`neo-brutalist-gray ${
        size === "lg" ? "p-4" : "px-3 py-2"
      } w-full active:translate-y-[1px] active:translate-x-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all`}
    >
      <div
        className={`${
          label
            ? "flex flex-col"
            : "flex flex-wrap items-center justify-between gap-1"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Icon className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
          {label && (
            <p
              className={`${
                size === "lg" ? "text-sm" : "text-xs"
              } font-semibold`}
            >
              {label}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {isLoading ? (
            <LoadingPlaceholder />
          ) : (
            <>
              <p
                className={`${
                  size === "lg" ? "text-2xl lg:text-3xl" : "text-normal lg:text-lg"
                } font-black ${
                  showTrend &&
                  (isNumber && value > 0
                    ? "text-green-600"
                    : isNumber && value < 0
                    ? "text-red-600"
                    : null)
                } transition-all duration-200`}
              >
                {valueWithPrefix}
              </p>

              {showTrend &&
                (isNumber && value > 0 ? (
                  <TrendingUp
                    className={`${
                      size === "lg" ? "w-4 h-4 lg:w-8 lg:h-8" : "w-4 h-4"
                    } text-green-600`}
                  />
                ) : isNumber && value < 0 ? (
                  <TrendingDown
                    className={`${
                      size === "lg" ? "w-8 h-8" : "w-4 h-4"
                    } text-red-600`}
                  />
                ) : null)}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (!tooltipText) return card;

  return (
    <Tooltip.Provider delayDuration={400}>
      <Tooltip.Root open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="touch-manipulation select-none"
            aria-label={tooltipText}
            onTouchStart={(e) => {
              e.preventDefault();
              setIsTooltipOpen(true);
            }}
            onTouchEnd={() => {
              setTimeout(() => setIsTooltipOpen(false), 1000);
            }}
          >
            {card}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="neo-brutalist-yellow px-4 py-3 text-sm font-bold text-black max-w-[300px] text-center z-50 select-none"
            sideOffset={8}
            align="center"
            side="top"
            avoidCollisions
          >
            {tooltipText}
            <Tooltip.Arrow className="fill-black" width={16} height={8} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
