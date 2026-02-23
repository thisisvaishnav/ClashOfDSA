"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Swords,
  TrendingUp,
  Shield,
  Star,
} from "lucide-react";
import { useSession } from "../../../lib/auth-client";
import {
  GamePanel,
  GameButton,
  GameBadge,
  HazardStripe,
} from "../../../components/game-ui";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type LeaderboardEntry = {
  userId: string;
  name: string;
  image: string | null;
  rating: number;
  rank: number;
  wins: number;
  losses: number;
  totalMatches: number;
  winStreak: number;
  bestWinStreak: number;
  lastMatchAt: string | null;
};

const ITEMS_PER_PAGE = 25;

/* ────────────────────────────────────────────────────────────
   API helpers
   ──────────────────────────────────────────────────────────── */

const getApiBase = (): string =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "";

const fetchLeaderboard = async (
  page: number,
  limit: number,
): Promise<LeaderboardEntry[]> => {
  const base = getApiBase();
  const res = await fetch(
    `${base}/api/leaderboard?page=${page}&limit=${limit}`,
    { credentials: "include" },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
};

const fetchMyEntry = async (): Promise<LeaderboardEntry | null> => {
  const base = getApiBase();
  const res = await fetch(`${base}/api/leaderboard/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
};

/* ────────────────────────────────────────────────────────────
   Rank helpers
   ──────────────────────────────────────────────────────────── */

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return null;
};

const getRankBg = (rank: number): string => {
  if (rank === 1) return "bg-game-amber/20 border-game-amber";
  if (rank === 2) return "bg-gray-200/40 border-gray-400";
  if (rank === 3) return "bg-amber-900/10 border-amber-700";
  return "bg-game-cream border-game-navy/20";
};

const getWinRate = (wins: number, total: number): string => {
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
};

const getRatingTier = (
  rating: number,
): { label: string; color: string } => {
  if (rating >= 2000) return { label: "Grandmaster", color: "text-red-500" };
  if (rating >= 1800) return { label: "Master", color: "text-purple-500" };
  if (rating >= 1600) return { label: "Diamond", color: "text-blue-400" };
  if (rating >= 1400) return { label: "Platinum", color: "text-teal-400" };
  if (rating >= 1200) return { label: "Gold", color: "text-game-amber" };
  return { label: "Silver", color: "text-gray-400" };
};

/* ────────────────────────────────────────────────────────────
   Podium Component (Top 3)
   ──────────────────────────────────────────────────────────── */

type PodiumCardProps = {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
};

const PodiumCard = ({ entry, position }: PodiumCardProps) => {
  const tier = getRatingTier(entry.rating);

  const podiumStyles: Record<1 | 2 | 3, string> = {
    1: "border-game-amber bg-gradient-to-b from-game-amber/20 to-game-cream",
    2: "border-gray-400 bg-gradient-to-b from-gray-200/40 to-game-cream",
    3: "border-amber-700 bg-gradient-to-b from-amber-900/10 to-game-cream",
  };

  const heights: Record<1 | 2 | 3, string> = {
    1: "h-32",
    2: "h-24",
    3: "h-20",
  };

  const avatarSizes: Record<1 | 2 | 3, string> = {
    1: "h-16 w-16 text-2xl",
    2: "h-12 w-12 text-xl",
    3: "h-12 w-12 text-xl",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar */}
      <div className="relative">
        {position === 1 && (
          <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-500" />
        )}
        <div
          className={`${avatarSizes[position]} border-[3px] border-game-navy rounded-sm flex items-center justify-center font-bold text-game-amber-dark game-shadow-sm ${podiumStyles[position]}`}
        >
          {entry.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
      </div>

      {/* Name + Rating */}
      <div className="text-center">
        <p className="text-sm font-bold text-game-navy uppercase truncate max-w-[120px]">
          {entry.name}
        </p>
        <p className={`text-xs font-bold ${tier.color}`}>{tier.label}</p>
      </div>

      {/* Podium Bar */}
      <div
        className={`${heights[position]} w-24 ${podiumStyles[position]} border-[2px] border-game-navy rounded-t-sm flex flex-col items-center justify-center game-shadow-sm`}
      >
        <span className="text-2xl font-black text-game-navy">#{position}</span>
        <span className="text-sm font-bold text-game-navy/70">
          {entry.rating}
        </span>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Your Stats Card
   ──────────────────────────────────────────────────────────── */

type MyStatsCardProps = {
  entry: LeaderboardEntry;
};

const MyStatsCard = ({ entry }: MyStatsCardProps) => {
  const tier = getRatingTier(entry.rating);
  const winRate = getWinRate(entry.wins, entry.totalMatches);

  return (
    <GamePanel variant="default" hasShadow shadowSize="sm" className="!p-0 overflow-hidden">
      <HazardStripe variant="warning" height="sm" />
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <GameBadge variant="amber">
            <Shield size={10} />
            Your Standing
          </GameBadge>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* Rank + Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-amber text-game-navy font-black text-lg game-shadow-sm">
              #{entry.rank}
            </div>
            <div>
              <p className="text-base font-bold text-game-navy uppercase">
                {entry.name}
              </p>
              <p className={`text-xs font-bold ${tier.color}`}>{tier.label}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Rating", value: entry.rating.toString(), icon: <Star size={12} /> },
              { label: "Wins", value: entry.wins.toString(), icon: <Trophy size={12} /> },
              { label: "Losses", value: entry.losses.toString(), icon: <Swords size={12} /> },
              { label: "Win Rate", value: winRate, icon: <TrendingUp size={12} /> },
              { label: "Streak", value: entry.winStreak.toString(), icon: <Flame size={12} /> },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <span className="text-game-navy/40">{stat.icon}</span>
                <div>
                  <p className="text-[9px] font-bold text-game-navy/40 uppercase">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold text-game-navy">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GamePanel>
  );
};

/* ────────────────────────────────────────────────────────────
   Leaderboard Table Row
   ──────────────────────────────────────────────────────────── */

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
};

const LeaderboardRow = ({ entry, isCurrentUser }: LeaderboardRowProps) => {
  const tier = getRatingTier(entry.rating);
  const winRate = getWinRate(entry.wins, entry.totalMatches);
  const rankIcon = getRankIcon(entry.rank);
  const rankBg = getRankBg(entry.rank);

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 border-b-[2px] border-game-navy/10 transition-colors hover:bg-game-amber/5 ${
        isCurrentUser ? "bg-game-amber/10 border-l-[3px] border-l-game-amber" : ""
      }`}
      role="row"
      aria-label={`Rank ${entry.rank}: ${entry.name}, Rating ${entry.rating}`}
    >
      {/* Rank */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center border-[2px] rounded-sm font-bold text-sm ${rankBg} ${
          entry.rank <= 3 ? "border-game-navy" : "border-game-navy/20"
        }`}
      >
        {rankIcon ?? entry.rank}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-game-navy/30 rounded-sm bg-game-cream-dark text-sm font-bold text-game-navy">
          {entry.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-game-navy uppercase truncate">
            {entry.name}
            {isCurrentUser && (
              <span className="ml-2 text-[10px] font-bold text-game-amber-dark">
                (YOU)
              </span>
            )}
          </p>
          <p className={`text-[10px] font-bold ${tier.color} uppercase`}>
            {tier.label}
          </p>
        </div>
      </div>

      {/* Rating */}
      <div className="hidden sm:flex flex-col items-center w-16">
        <p className="text-[9px] font-bold text-game-navy/40 uppercase">
          Rating
        </p>
        <p className="text-sm font-bold text-game-navy">{entry.rating}</p>
      </div>

      {/* W/L */}
      <div className="hidden md:flex flex-col items-center w-16">
        <p className="text-[9px] font-bold text-game-navy/40 uppercase">W/L</p>
        <p className="text-sm font-bold text-game-navy">
          <span className="text-game-green">{entry.wins}</span>
          <span className="text-game-navy/30">/</span>
          <span className="text-game-red">{entry.losses}</span>
        </p>
      </div>

      {/* Win Rate */}
      <div className="hidden md:flex flex-col items-center w-16">
        <p className="text-[9px] font-bold text-game-navy/40 uppercase">
          Win %
        </p>
        <p className="text-sm font-bold text-game-navy">{winRate}</p>
      </div>

      {/* Streak */}
      <div className="hidden lg:flex flex-col items-center w-16">
        <p className="text-[9px] font-bold text-game-navy/40 uppercase">
          Streak
        </p>
        <div className="flex items-center gap-1">
          {entry.winStreak > 0 && (
            <Flame size={12} className="text-orange-500" />
          )}
          <p className="text-sm font-bold text-game-navy">
            {entry.winStreak}
          </p>
        </div>
      </div>

      {/* Matches */}
      <div className="hidden lg:flex flex-col items-center w-16">
        <p className="text-[9px] font-bold text-game-navy/40 uppercase">
          Matches
        </p>
        <p className="text-sm font-bold text-game-navy">{entry.totalMatches}</p>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Leaderboard Page
   ──────────────────────────────────────────────────────────── */

const LeaderboardPage = () => {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(currentPage, ITEMS_PER_PAGE);
      setEntries(data);
      setHasMore(data.length === ITEMS_PER_PAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(page);
  }, [page, loadData]);

  useEffect(() => {
    if (session?.user) {
      fetchMyEntry().then(setMyEntry);
    }
  }, [session]);

  const handlePrevPage = () => {
    if (page <= 1) return;
    setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (!hasMore) return;
    setPage((p) => p + 1);
  };

  const top3 = entries.filter((e) => e.rank <= 3 && page === 1);
  const tableEntries = page === 1 ? entries.filter((e) => e.rank > 3) : entries;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <GameBadge variant="amber">
            <Trophy size={10} />
            Rankings
          </GameBadge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-game-navy md:text-4xl uppercase">
          Leaderboard
        </h1>
        <p className="mt-2 text-sm text-game-navy/50 font-bold">
          Top warriors ranked by Elo rating
        </p>
      </div>

      {/* Your Standing */}
      {myEntry && (
        <div className="mb-6">
          <MyStatsCard entry={myEntry} />
        </div>
      )}

      {/* Podium (Top 3) */}
      {top3.length > 0 && (
        <div className="mb-8">
          <GamePanel variant="default" hasShadow shadowSize="sm" className="!p-0 overflow-hidden">
            <HazardStripe variant="info" height="sm" />
            <div className="px-6 py-6">
              <div className="flex items-center gap-2 mb-6">
                <GameBadge variant="info">
                  <Crown size={10} />
                  Top Warriors
                </GameBadge>
              </div>

              <div className="flex items-end justify-center gap-4 sm:gap-8">
                {/* 2nd place */}
                {top3.find((e) => e.rank === 2) && (
                  <PodiumCard
                    entry={top3.find((e) => e.rank === 2)!}
                    position={2}
                  />
                )}
                {/* 1st place */}
                {top3.find((e) => e.rank === 1) && (
                  <PodiumCard
                    entry={top3.find((e) => e.rank === 1)!}
                    position={1}
                  />
                )}
                {/* 3rd place */}
                {top3.find((e) => e.rank === 3) && (
                  <PodiumCard
                    entry={top3.find((e) => e.rank === 3)!}
                    position={3}
                  />
                )}
              </div>
            </div>
          </GamePanel>
        </div>
      )}

      {/* Leaderboard Table */}
      <GamePanel variant="default" hasShadow shadowSize="sm" className="!p-0 overflow-hidden">
        <HazardStripe variant="warning" height="sm" />

        {/* Table Header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-game-navy" role="row">
          <div className="w-9 shrink-0 text-[10px] font-bold text-game-cream/60 uppercase text-center">
            #
          </div>
          <div className="flex-1 text-[10px] font-bold text-game-cream/60 uppercase">
            Player
          </div>
          <div className="hidden sm:block w-16 text-[10px] font-bold text-game-cream/60 uppercase text-center">
            Rating
          </div>
          <div className="hidden md:block w-16 text-[10px] font-bold text-game-cream/60 uppercase text-center">
            W/L
          </div>
          <div className="hidden md:block w-16 text-[10px] font-bold text-game-cream/60 uppercase text-center">
            Win %
          </div>
          <div className="hidden lg:block w-16 text-[10px] font-bold text-game-cream/60 uppercase text-center">
            Streak
          </div>
          <div className="hidden lg:block w-16 text-[10px] font-bold text-game-cream/60 uppercase text-center">
            Matches
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-game-navy/40" />
            <p className="text-sm font-bold text-game-navy/40 uppercase">
              Loading rankings…
            </p>
          </div>
        ) : tableEntries.length === 0 && top3.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="h-10 w-10 text-game-navy/20" />
            <p className="text-sm font-bold text-game-navy/40 uppercase">
              No entries yet
            </p>
            <p className="text-xs text-game-navy/30 font-medium">
              Battle other players to appear on the leaderboard
            </p>
          </div>
        ) : (
          <div role="table" aria-label="Leaderboard rankings">
            {tableEntries.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === session?.user?.id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t-[2px] border-game-navy/10 bg-game-cream-dark">
          <p className="text-[10px] font-bold text-game-navy/40 uppercase">
            Page {page}
          </p>
          <div className="flex items-center gap-2">
            <GameButton
              variant="default"
              size="sm"
              onClick={handlePrevPage}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
              Prev
            </GameButton>
            <GameButton
              variant="default"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasMore}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={14} />
            </GameButton>
          </div>
        </div>
      </GamePanel>
    </div>
  );
};

export default LeaderboardPage;
