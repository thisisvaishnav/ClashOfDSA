import React from "react";
import { cn } from "../../lib/cn";

interface GameTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface GameTabsProps {
  tabs: GameTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const GameTabs = ({ tabs, activeTab, onTabChange, className }: GameTabsProps) => {
  return (
    <div
      className={cn(
        "flex border-b-[3px] border-game-navy bg-game-cream-dark",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTabChange(tab.id);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-r-[2px] border-game-navy last:border-r-0",
              isActive
                ? "bg-game-cream text-game-navy border-b-[3px] border-b-game-amber -mb-[3px]"
                : "bg-game-cream-dark text-game-navy/60 hover:bg-game-cream hover:text-game-navy"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default GameTabs;
