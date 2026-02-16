import React from "react";
import { cn } from "../../lib/cn";

type GameProgressBarVariant = "default" | "xp" | "health" | "danger";

interface GameProgressBarProps {
  value: number;
  max?: number;
  variant?: GameProgressBarVariant;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const barColors: Record<GameProgressBarVariant, string> = {
  default: "bg-game-amber",
  xp: "bg-game-green",
  health: "bg-game-green",
  danger: "bg-game-red",
};

const GameProgressBar = ({
  value,
  max = 100,
  variant = "default",
  label,
  showValue = false,
  className,
}: GameProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-game-navy">
          {label && <span>{label}</span>}
          {showValue && (
            <span className="text-game-amber-dark">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="relative h-4 border-[2px] border-game-navy rounded-sm bg-game-cream-dark overflow-hidden game-shadow-sm">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            barColors[variant]
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label ?? "Progress"}
        />
        {/* Segment lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-game-navy/20 last:border-r-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameProgressBar;
