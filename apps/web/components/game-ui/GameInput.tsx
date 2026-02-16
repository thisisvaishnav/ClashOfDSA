import React from "react";
import { cn } from "../../lib/cn";

type GameInputState = "default" | "error" | "success";

interface GameInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  icon?: React.ReactNode;
  state?: GameInputState;
  errorMessage?: string;
  onChange?: (value: string) => void;
}

const stateStyles: Record<GameInputState, string> = {
  default: "border-game-navy focus-within:border-game-amber",
  error: "border-game-red",
  success: "border-game-green",
};

const GameInput = ({
  label,
  icon,
  state = "default",
  errorMessage,
  onChange,
  className,
  ...props
}: GameInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-game-navy/60">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 border-[2px] rounded-sm bg-game-cream px-3 py-2 transition-colors",
          stateStyles[state]
        )}
      >
        {icon && (
          <span className="shrink-0 text-game-navy/50">{icon}</span>
        )}
        <input
          className="flex-1 bg-transparent text-sm text-game-navy placeholder:text-game-navy/40 focus:outline-none font-medium"
          onChange={handleChange}
          {...props}
        />
        {state === "success" && (
          <span className="shrink-0 text-game-green font-bold text-sm">✓</span>
        )}
        {state === "error" && (
          <span className="shrink-0 text-game-red font-bold text-sm">✕</span>
        )}
      </div>
      {state === "error" && errorMessage && (
        <p className="text-[10px] font-bold text-game-red italic">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GameInput;
