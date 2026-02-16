import React from "react";
import { cn } from "../../lib/cn";

type GameBadgeVariant =
  | "default"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "amber";

interface GameBadgeProps {
  variant?: GameBadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<GameBadgeVariant, string> = {
  default:
    "bg-game-cream text-game-navy border-game-navy",
  success:
    "bg-game-green text-game-cream border-game-navy",
  danger:
    "bg-game-red text-game-cream border-game-navy",
  warning:
    "bg-game-orange text-game-cream border-game-navy",
  info:
    "bg-game-blue text-game-cream border-game-navy",
  amber:
    "bg-game-amber text-game-navy border-game-navy",
};

const GameBadge = ({
  variant = "default",
  className,
  children,
}: GameBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 border-[2px] rounded-sm text-[10px] font-bold uppercase tracking-wider",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default GameBadge;
