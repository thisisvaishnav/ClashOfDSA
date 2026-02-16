import React from "react";
import { cn } from "../../lib/cn";

type GameAlertVariant = "success" | "error" | "warning" | "info";

interface GameAlertProps {
  variant?: GameAlertVariant;
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

const variantConfig: Record<
  GameAlertVariant,
  { icon: string; borderColor: string; stripeClass: string; titleColor: string }
> = {
  success: {
    icon: "✓",
    borderColor: "border-game-green",
    stripeClass: "game-hazard-stripe-success",
    titleColor: "text-game-green",
  },
  error: {
    icon: "✕",
    borderColor: "border-game-red",
    stripeClass: "game-hazard-stripe-danger",
    titleColor: "text-game-red",
  },
  warning: {
    icon: "⚠",
    borderColor: "border-game-amber",
    stripeClass: "game-hazard-stripe-warning",
    titleColor: "text-game-amber-dark",
  },
  info: {
    icon: "ⓘ",
    borderColor: "border-game-blue",
    stripeClass: "game-hazard-stripe-info",
    titleColor: "text-game-blue",
  },
};

const GameAlert = ({
  variant = "info",
  title,
  message,
  className,
  onClose,
}: GameAlertProps) => {
  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        "relative border-[3px] rounded-sm bg-game-cream text-game-navy game-shadow-sm overflow-hidden",
        config.borderColor,
        className
      )}
    >
      {/* Top hazard stripe */}
      <div className={cn("h-2", config.stripeClass)} />

      <div className="flex items-start gap-3 p-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-game-navy rounded-sm text-sm font-bold",
            variant === "success" && "bg-game-green text-game-cream",
            variant === "error" && "bg-game-red text-game-cream",
            variant === "warning" && "bg-game-amber text-game-navy",
            variant === "info" && "bg-game-blue text-game-cream"
          )}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn("font-bold uppercase text-sm mb-1", config.titleColor)}>
              {title}
            </p>
          )}
          <p className="text-xs text-game-navy/80 whitespace-pre-wrap">{message}</p>
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close alert"
            tabIndex={0}
            className="flex h-6 w-6 shrink-0 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-red text-game-cream text-xs font-bold hover:bg-game-red-light transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Bottom hazard stripe */}
      <div className={cn("h-2", config.stripeClass)} />
    </div>
  );
};

export default GameAlert;
