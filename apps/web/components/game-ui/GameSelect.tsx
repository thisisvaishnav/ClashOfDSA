import React from "react";
import { cn } from "../../lib/cn";

interface GameSelectOption {
  value: string;
  label: string;
}

interface GameSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: GameSelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const GameSelect = ({
  options,
  value,
  onChange,
  label,
  className,
  ...props
}: GameSelectProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-game-navy/60">
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={handleChange}
        className={cn(
          "appearance-none bg-game-cream text-game-navy border-[2px] border-game-navy rounded-sm px-3 py-1.5 pr-8 text-sm font-bold",
          "game-shadow-sm cursor-pointer",
          "hover:bg-game-amber/20",
          "focus:outline-none focus:ring-2 focus:ring-game-amber focus:ring-offset-1",
          "bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%231B2838%22%20d%3D%22M2%204l4%204%204-4z%22%2F%3E%3C%2Fsvg%3E')] bg-[right_8px_center] bg-no-repeat"
        )}
        aria-label={label ?? "Select option"}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GameSelect;
