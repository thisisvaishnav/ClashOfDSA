"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Users,
  Check,
  X,
  Loader2,
  UserPlus,
} from "lucide-react";
import { useSession } from "../../lib/auth-client";
import {
  GameBadge,
  GamePanel,
  GameButton,
  GameIconButton,
  HazardStripe,
} from "../../components/game-ui";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type FriendRequestItem = {
  id: string;
  requesterId: string;
  requesterName: string;
  addresseeId: string;
  addresseeName: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
};

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

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
  {
    href: "/friends",
    label: "Friends",
    icon: <Users className="h-4 w-4" />,
  },
];

const getApiBase = (): string =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "";

/* ────────────────────────────────────────────────────────────
   Notification Dropdown
   ──────────────────────────────────────────────────────────── */

type NotificationDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
};

const NotificationDropdown = ({
  isOpen,
  onClose,
  userId,
}: NotificationDropdownProps) => {
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadRequests = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/friends/requests`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      const allRequests: FriendRequestItem[] = json.data ?? [];
      setRequests(
        allRequests.filter(
          (r) => r.status === "PENDING" && r.addresseeId === userId,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, loadRequests]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const base = getApiBase();
      await fetch(`${base}/api/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const base = getApiBase();
      await fetch(`${base}/api/friends/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 z-[60]"
      role="dialog"
      aria-label="Notifications"
    >
      <GamePanel
        variant="default"
        hasShadow
        shadowSize="md"
        className="!p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2.5 bg-game-navy">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-game-cream" />
            <span className="text-xs font-bold text-game-cream uppercase">
              Notifications
            </span>
          </div>
          {requests.length > 0 && (
            <GameBadge variant="danger">{requests.length} new</GameBadge>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-game-navy/30" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Bell className="h-8 w-8 text-game-navy/15" />
              <p className="text-xs font-bold text-game-navy/30 uppercase">
                No new notifications
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 px-4 py-3 border-b-[2px] border-game-navy/10 hover:bg-game-amber/5 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-game-navy/30 rounded-sm bg-game-blue/20">
                  <UserPlus size={14} className="text-game-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-game-navy uppercase truncate">
                    {req.requesterName}
                  </p>
                  <p className="text-[10px] text-game-navy/50 font-medium">
                    Wants to be your friend
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={actionLoading === req.id}
                    className="flex h-7 w-7 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-green text-game-cream hover:bg-game-green/80 transition-colors cursor-pointer disabled:opacity-50"
                    aria-label={`Accept friend request from ${req.requesterName}`}
                    tabIndex={0}
                  >
                    {actionLoading === req.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id}
                    className="flex h-7 w-7 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-red text-game-cream hover:bg-game-red/80 transition-colors cursor-pointer disabled:opacity-50"
                    aria-label={`Reject friend request from ${req.requesterName}`}
                    tabIndex={0}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <Link
          href="/friends"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t-[2px] border-game-navy/10 bg-game-cream-dark hover:bg-game-amber/10 transition-colors"
        >
          <Users size={12} className="text-game-amber-dark" />
          <span className="text-[10px] font-bold text-game-amber-dark uppercase">
            View All Friends
          </span>
        </Link>
      </GamePanel>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Dashboard Layout
   ──────────────────────────────────────────────────────────── */

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      if (!session?.user?.id) return;
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/api/friends/requests`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();
        const allRequests: FriendRequestItem[] = json.data ?? [];
        setPendingCount(
          allRequests.filter(
            (r) => r.status === "PENDING" && r.addresseeId === session.user.id,
          ).length,
        );
      } catch {
        /* silent */
      }
    };

    loadPendingCount();
    const interval = setInterval(loadPendingCount, 30_000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleToggleNotif = () => {
    setIsNotifOpen((prev) => !prev);
  };

  const handleCloseNotif = () => {
    setIsNotifOpen(false);
  };

  const userName = session?.user?.name ?? "Player";
  const userRating =
    (session?.user as Record<string, unknown> | undefined)?.rating as
      | number
      | undefined;

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
              aria-label="Clash of DSA home"
            >
              <div className="h-9 w-9 border-[2px] border-game-amber rounded-sm bg-game-amber flex items-center justify-center game-shadow-sm">
                <Shield size={18} className="text-game-navy" />
              </div>
              <span className="font-bold text-game-cream tracking-tight text-sm uppercase hidden sm:inline">
                Clash of DSA
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
                onClick={handleToggleNotif}
              >
                <Bell className="h-3.5 w-3.5" />
              </GameIconButton>
              {pendingCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-game-red border-[2px] border-game-navy text-[8px] font-bold text-game-cream">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
              <NotificationDropdown
                isOpen={isNotifOpen}
                onClose={handleCloseNotif}
                userId={session?.user?.id}
              />
            </div>

            {/* Settings */}
            <Link href="/settings" aria-label="Settings">
              <GameIconButton
                variant="default"
                size="sm"
                aria-label="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </GameIconButton>
            </Link>

            {/* Divider */}
            <div className="h-6 w-[2px] bg-game-navy-light mx-1" />

            {/* User Profile */}
            <Link
              href="/settings"
              className="flex items-center gap-2 px-2 py-1 border-[2px] border-game-navy-light rounded-sm hover:bg-game-navy-light transition-colors"
              aria-label="User profile"
            >
              <div className="flex h-7 w-7 items-center justify-center border-[2px] border-game-amber rounded-sm bg-game-amber/20 text-xs font-bold text-game-amber">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-[10px] font-bold text-game-cream uppercase truncate max-w-[80px]">
                  {userName}
                </span>
                <span className="text-[9px] font-bold text-game-amber/60 uppercase">
                  Rating {userRating ?? 1200}
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
