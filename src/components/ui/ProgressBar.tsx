"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function ProgressBar({ value, label, showPercent = true, className, size = "md" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-cosmos-dust">{label}</span>}
          {showPercent && <span className="text-sm font-medium text-cosmos-purple-light">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={cn("w-full bg-cosmos-nebula rounded-full overflow-hidden", height)}>
        <div
          className={cn("progress-cosmic rounded-full transition-all duration-500", height)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface UsageMeterProps {
  used: number;
  total: number;
  label?: string;
  className?: string;
}

export function UsageMeter({ used, total, label, className }: UsageMeterProps) {
  const percent = total > 0 ? (used / total) * 100 : 0;
  const isWarning = percent > 75;
  const isCritical = percent > 90;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-cosmos-dust">{label ?? "Monthly usage"}</span>
        <span className={cn(
          "text-sm font-medium",
          isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-cosmos-purple-light"
        )}>
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-cosmos-nebula rounded-full overflow-hidden h-2.5">
        <div
          className={cn(
            "h-2.5 rounded-full transition-all duration-500",
            isCritical
              ? "bg-gradient-to-r from-red-600 to-red-400"
              : isWarning
              ? "bg-gradient-to-r from-amber-600 to-amber-400"
              : "progress-cosmic"
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
