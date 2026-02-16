import React from "react";
import { cn } from "../../lib/cn";

type GameButtonVariant =
  | "default"
  | "primary"
  | "danger"
  | "success"
  | "ghost"
  | "outline";
type GameButtonSize = "sm" | "md" | "lg" | "icon";

interface GameButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<GameButtonVariant, string> = {
  default:
    "bg-game-cream text-game-navy border-game-navy hover:bg-game-amber hover:text-game-navy active:game-btn-pressed",
  primary:
    "bg-game-amber text-game-navy border-game-navy hover:bg-game-amber-light active:game-btn-pressed",
  danger:
    "bg-game-red text-game-cream border-game-navy hover:bg-game-red-light active:game-btn-pressed",
  success:
    "bg-game-green text-game-cream border-game-navy hover:bg-game-green-light active:game-btn-pressed",
  ghost:
    "bg-transparent text-game-navy border-transparent hover:bg-game-cream-dark",
  outline:
    "bg-transparent text-game-navy border-game-navy hover:bg-game-cream-dark",
};

const sizeStyles: Record<GameButtonSize, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
};

const GameButton = ({
  variant = "default",
  size = "md",
  disabled,
  className,
  children,
  ...props
}: GameButtonProps) => {
  return (
    <button
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 border-[2px] rounded-sm font-bold uppercase tracking-wide transition-all duration-100 cursor-pointer select-none",
        "game-shadow-sm",
        "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--color-game-navy)]",
        variantStyles[variant],
        sizeStyles[size],
        disabled &&
          "opacity-50 cursor-not-allowed hover:bg-game-gray active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_var(--color-game-navy)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default GameButton;
