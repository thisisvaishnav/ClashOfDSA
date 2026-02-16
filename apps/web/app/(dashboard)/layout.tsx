"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Swords,
  LayoutDashboard,
  Trophy,
  BookOpen,
  Settings,
  Bell,
  User,
  Shield,
} from "lucide-react";

import {
  GameBadge,
  GameIconButton,
  HazardStripe,
} from "../../components/game-ui";

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_LINKS: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/problems",
    label: "Problems",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: <Trophy className="h-4 w-4" />,
  },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-game-cream-dark">
      {/* Background texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B2838' fill-opacity='1'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Top Navbar ── */}
      <nav
        className="sticky top-0 z-50 bg-game-navy border-b-[3px] border-game-navy"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between px-5">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              aria-label="Code Battle home"
            >
              <div className="h-9 w-9 border-[2px] border-game-amber rounded-sm bg-game-amber flex items-center justify-center game-shadow-sm">
                <Shield size={18} className="text-game-navy" />
              </div>
              <span className="font-bold text-game-cream tracking-tight text-sm uppercase hidden sm:inline">
                Code Battle
              </span>
            </Link>

            {/* Divider */}
            <div className="h-6 w-[2px] bg-game-navy-light hidden md:block" />

            {/* Nav Links */}
            <div className="hidden items-center gap-1.5 md:flex">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-game-amber text-game-navy border-game-amber game-shadow-sm"
                        : "bg-transparent text-game-cream/60 border-transparent hover:bg-game-navy-light hover:text-game-cream hover:border-game-navy-light"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <GameIconButton
                variant="default"
                size="sm"
                aria-label="Notifications"
              >
                <Bell className="h-3.5 w-3.5" />
              </GameIconButton>
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-game-red border-[2px] border-game-navy" />
            </div>

            {/* Settings */}
            <GameIconButton
              variant="default"
              size="sm"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </GameIconButton>

            {/* Divider */}
            <div className="h-6 w-[2px] bg-game-navy-light mx-1" />

            {/* User Profile */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-2 py-1 border-[2px] border-game-navy-light rounded-sm hover:bg-game-navy-light transition-colors"
              aria-label="User profile"
            >
              <div className="flex h-7 w-7 items-center justify-center border-[2px] border-game-amber rounded-sm bg-game-amber/20 text-xs font-bold text-game-amber">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-[10px] font-bold text-game-cream uppercase">
                  Player
                </span>
                <span className="text-[9px] font-bold text-game-amber/60 uppercase">
                  Rating 1200
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Hazard stripe under nav */}
        <HazardStripe variant="warning" height="sm" />
      </nav>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1">{children}</main>
    </div>
  );
};

export default DashboardLayout;
