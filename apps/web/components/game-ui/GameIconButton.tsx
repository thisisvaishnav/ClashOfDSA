import React from "react";
import { cn } from "../../lib/cn";

type GameIconButtonVariant =
  | "default"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "amber";
type GameIconButtonSize = "sm" | "md" | "lg";

interface GameIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameIconButtonVariant;
  size?: GameIconButtonSize;
  "aria-label": string;
  children: React.ReactNode;
}

const variantStyles: Record<GameIconButtonVariant, string> = {
  default: "bg-game-cream text-game-navy hover:bg-game-cream-dark",
  blue: "bg-game-blue text-game-cream hover:bg-game-blue-light",
  green: "bg-game-green text-game-cream hover:bg-game-green-light",
  orange: "bg-game-orange text-game-cream hover:bg-game-orange-light",
  red: "bg-game-red text-game-cream hover:bg-game-red-light",
  amber: "bg-game-amber text-game-navy hover:bg-game-amber-light",
};

const sizeStyles: Record<GameIconButtonSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

const GameIconButton = ({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: GameIconButtonProps) => {
  return (
    <button
      tabIndex={0}
      className={cn(
        "inline-flex items-center justify-center border-[2px] border-game-navy rounded-sm game-shadow-sm transition-all duration-100 cursor-pointer",
        "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--color-game-navy)]",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default GameIconButton;
