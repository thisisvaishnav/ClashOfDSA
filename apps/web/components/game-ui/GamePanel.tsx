import React from "react";
import { cn } from "../../lib/cn";

type GamePanelVariant = "default" | "dark" | "inset" | "alert";

interface GamePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GamePanelVariant;
  hasFold?: boolean;
  hasShadow?: boolean;
  shadowSize?: "sm" | "md" | "lg";
  noPadding?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<GamePanelVariant, string> = {
  default:
    "bg-game-cream text-game-navy border-game-navy",
  dark:
    "bg-game-navy text-game-cream border-game-navy-light",
  inset:
    "bg-game-cream-dark text-game-navy border-game-navy",
  alert:
    "bg-game-cream-light text-game-navy border-game-navy",
};

const shadowStyles: Record<string, string> = {
  sm: "game-shadow-sm",
  md: "game-shadow",
  lg: "game-shadow-lg",
};

const GamePanel = ({
  variant = "default",
  hasFold = false,
  hasShadow = true,
  shadowSize = "md",
  noPadding = false,
  className,
  children,
  ...props
}: GamePanelProps) => {
  return (
    <div
      className={cn(
        "relative border-[3px] rounded-sm",
        variantStyles[variant],
        hasShadow && shadowStyles[shadowSize],
        hasFold && "game-fold overflow-hidden",
        !noPadding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GamePanel;
