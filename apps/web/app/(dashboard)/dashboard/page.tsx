"use client";

import { useState } from "react";
import {
  Zap,
  Code2,
  Users,
  Crown,
  Brain,
  Eye,
  Lock,
  ArrowRight,
  X,
  Swords,
  Trophy,
  Activity,
  Target,
  Shield,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import questionsData from "../../data/questions.json";
import { useSession } from "../../../lib/auth-client";
import {
  useMatchmaking,
  type MatchmakingStatus,
  type OpponentInfo,
} from "../../../hooks/useMatchmaking";

import {
  GamePanel,
  GameButton,
  GameBadge,
  GameAlert,
  HazardStripe,
  GameInput,
  GameIconButton,
  GameProgressBar,
} from "../../../components/game-ui";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type CardStatus = "active" | "locked";

type MatchCard = {
  id: string;
  title: string;
  description: string;
  status: CardStatus;
  icon: React.ReactNode;
  action: "matchmaking" | "navigate" | "friend-card" | "none";
  badgeVariant: "info" | "success" | "warning" | "danger" | "amber" | "default";
  tag?: string;
};

/* ────────────────────────────────────────────────────────────
   Card Data
   ──────────────────────────────────────────────────────────── */

const MATCH_CARDS: MatchCard[] = [
  {
    id: "quick-match",
    title: " 🔥 Quick Match 🔥 ",
    description: "Instant 1v1 coding battle against a random opponent",
    status: "active",
    icon: <Zap className="h-6 w-6" />,
    action: "matchmaking",
    badgeVariant: "info",
    tag: "vs Random",
  },
  {
    id: "practice-solo",
    title: "Practice Solo",
    description: "Sharpen your skills with curated problems at your own pace",
    status: "active",
    icon: <Code2 className="h-6 w-6" />,
    action: "navigate",
    badgeVariant: "success",
  },
  {
    id: "friend-duel",
    title: "Friend Duel",
    description: "Challenge your buddy to a private coding battle",
    status: "active",
    icon: <Users className="h-6 w-6" />,
    action: "friend-card",
    badgeVariant: "warning",
    tag: "vs Friend",
  },
  {
    id: "custom-lobby",
    title: "Custom Lobby",
    description: "Create private contests with custom rules and settings",
    status: "locked",
    icon: <Crown className="h-6 w-6" />,
    action: "none",
    badgeVariant: "default",
  },
  {
    id: "algorithm-duels",
    title: "Algorithm Duels",
    description: "Test your algorithmic thinking in specialized challenges",
    status: "locked",
    icon: <Brain className="h-6 w-6" />,
    action: "none",
    badgeVariant: "default",
  },
  {
    id: "spectate-mode",
    title: "Spectate Mode",
    description: "Watch live coding battles and learn from the best",
    status: "locked",
    icon: <Eye className="h-6 w-6" />,
    action: "none",
    badgeVariant: "default",
  },
];

/* ────────────────────────────────────────────────────────────
   Friend Card Overlay (Game UI Modal)
   ──────────────────────────────────────────────────────────── */

type FriendCardProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FriendCard = ({ isOpen, onClose }: FriendCardProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-game-navy/60 backdrop-blur-sm">
      <GamePanel
        variant="default"
        hasShadow
        shadowSize="lg"
        className="relative w-full max-w-sm !p-0 overflow-hidden"
      >
        {/* Header stripe */}
        <HazardStripe variant="warning" height="sm" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-game-navy">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border-[2px] border-game-amber rounded-sm bg-game-amber/20">
              <Users className="h-5 w-5 text-game-amber" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-game-cream uppercase">
                Friend Duel
              </h3>
              <p className="text-[10px] font-bold text-game-cream/50 uppercase">
                Invite a friend to battle
              </p>
            </div>
          </div>
          <GameIconButton
            variant="red"
            size="sm"
            onClick={onClose}
            aria-label="Close friend invite"
          >
            <X className="h-4 w-4" />
          </GameIconButton>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <GameInput
            label="Friend's Username"
            icon={<Users size={16} />}
            placeholder="Enter username..."
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-[2px] bg-game-navy/20" />
            <span className="text-[10px] font-bold text-game-navy/40 uppercase">
              or
            </span>
            <div className="flex-1 h-[2px] bg-game-navy/20" />
          </div>

          <GameInput
            label="Room Code"
            icon={<Shield size={16} />}
            placeholder="Enter room code..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-4">
          <GameButton variant="primary" size="md" className="flex-1">
            Create Room
          </GameButton>
          <GameButton variant="default" size="md" className="flex-1">
            Join Room
          </GameButton>
        </div>

        {/* Bottom stripe */}
        <HazardStripe variant="warning" height="sm" />
      </GamePanel>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Matchmaking Overlay
   ──────────────────────────────────────────────────────────── */

type MatchmakingOverlayProps = {
  status: MatchmakingStatus;
  opponent: OpponentInfo | null;
  countdown: number;
  searchTime: number;
  error: string | null;
  onCancel: () => void;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const MatchmakingOverlay = ({
  status,
  opponent,
  countdown,
  searchTime,
  error,
  onCancel,
}: MatchmakingOverlayProps) => {
  if (status === "idle") return null;

  const headerTitle: Record<Exclude<MatchmakingStatus, "idle">, string> = {
    searching: "Finding Opponent",
    found: "Opponent Found!",
    countdown: "Get Ready!",
    redirecting: "Starting Battle",
  };

  const headerSubtitle: Record<Exclude<MatchmakingStatus, "idle">, string> = {
    searching: "Quick Match • 1v1",
    found: "Prepare for battle",
    countdown: "Battle imminent",
    redirecting: "Entering arena...",
  };

  const activeStatus = status as Exclude<MatchmakingStatus, "idle">;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-game-navy/60 backdrop-blur-sm"
      role="dialog"
      aria-label="Matchmaking"
      aria-modal="true"
    >
      <GamePanel
        variant="default"
        hasShadow
        shadowSize="lg"
        className="relative w-full max-w-sm !p-0 overflow-hidden"
      >
        {/* Top stripe */}
        <HazardStripe variant="info" height="sm" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-game-navy">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border-[2px] border-game-blue rounded-sm bg-game-blue/20">
              {status === "searching" ? (
                <Zap className="h-5 w-5 text-game-blue" />
              ) : (
                <Swords className="h-5 w-5 text-game-blue" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-game-cream uppercase">
                {headerTitle[activeStatus]}
              </h3>
              <p className="text-[10px] font-bold text-game-cream/50 uppercase">
                {headerSubtitle[activeStatus]}
              </p>
            </div>
          </div>

          {status === "searching" && (
            <GameIconButton
              variant="red"
              size="sm"
              onClick={onCancel}
              aria-label="Cancel matchmaking"
            >
              <X className="h-4 w-4" />
            </GameIconButton>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* ── Searching ── */}
          {status === "searching" && (
            <div className="flex flex-col items-center gap-5">
              {/* Pulsing radar */}
              <div className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-[3px] border-game-blue/30 animate-ping" />
                <span className="absolute inset-2 rounded-full border-[2px] border-game-blue/50 animate-pulse" />
                <Zap className="h-8 w-8 text-game-blue" />
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-game-navy uppercase">
                  Searching for opponent…
                </p>
                <p className="mt-1 text-2xl font-bold text-game-navy tabular-nums">
                  {formatTime(searchTime)}
                </p>
              </div>

              {error && (
                <GameAlert variant="error" message={error} />
              )}

              <GameButton
                variant="danger"
                size="md"
                className="w-full"
                onClick={onCancel}
                aria-label="Cancel search"
              >
                Cancel Search
              </GameButton>
            </div>
          )}

          {/* ── Found ── */}
          {status === "found" && opponent && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-6">
                {/* You */}
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-blue text-game-cream game-shadow-sm">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-game-navy uppercase">
                    You
                  </p>
                </div>

                {/* VS */}
                <div className="flex h-10 w-10 items-center justify-center border-[2px] border-game-navy rounded-full bg-game-amber game-shadow-sm">
                  <Swords className="h-5 w-5 text-game-navy" />
                </div>

                {/* Opponent */}
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-red text-game-cream game-shadow-sm">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-game-navy uppercase truncate max-w-[100px]">
                    {opponent.name}
                  </p>
                </div>
              </div>

              <GameBadge variant="warning">
                <Trophy size={10} />
                Rating: {opponent.rating}
              </GameBadge>

              <p className="text-xs font-bold text-game-navy/50 uppercase animate-pulse">
                Preparing battle…
              </p>
            </div>
          )}

          {/* ── Countdown ── */}
          {status === "countdown" && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center border-[3px] border-game-navy rounded-sm bg-game-amber game-shadow-sm">
                <span className="text-5xl font-black text-game-navy">
                  {countdown}
                </span>
              </div>
              <p className="text-sm font-bold text-game-navy uppercase">
                Battle begins in…
              </p>
            </div>
          )}

          {/* ── Redirecting ── */}
          {status === "redirecting" && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center animate-pulse">
                <Swords className="h-10 w-10 text-game-amber" />
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-game-navy/60" />
                <p className="text-sm font-bold text-game-navy uppercase">
                  Entering the arena…
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom stripe */}
        <HazardStripe variant="info" height="sm" />
      </GamePanel>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Dashboard Page
   ──────────────────────────────────────────────────────────── */

const DashboardPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isFriendCardOpen, setIsFriendCardOpen] = useState(false);

  const {
    status: matchmakingStatus,
    opponent,
    countdown,
    searchTime,
    error: matchmakingError,
    joinQueue,
    leaveQueue,
  } = useMatchmaking();

  const handleCardClick = (card: MatchCard) => {
    if (card.status === "locked") return;

    switch (card.action) {
      case "matchmaking": {
        const userId = session?.user?.id;
        if (!userId) return;
        joinQueue(userId);
        return;
      }
      case "navigate": {
        if (card.id !== "practice-solo") return;

        const questionsArray = Array.isArray(questionsData)
          ? questionsData
          : [];
        if (questionsArray.length === 0) return;

        const randomIndex = Math.floor(Math.random() * questionsArray.length);
        const randomQuestion = questionsArray[randomIndex] as { id: number };
        if (!randomQuestion?.id) return;

        router.push(`/code/${randomQuestion.id}`);
        return;
      }
      case "friend-card":
        setIsFriendCardOpen(true);
        return;
      default:
        return;
    }
  };

  const handleCardKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    card: MatchCard
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick(card);
    }
  };

  const handleCloseFriendCard = () => {
    setIsFriendCardOpen(false);
  };

  const handleCancelMatchmaking = () => {
    const userId = session?.user?.id;
    if (userId) {
      leaveQueue(userId);
    }
  };

  return (
    <>
      <FriendCard isOpen={isFriendCardOpen} onClose={handleCloseFriendCard} />
      
      <MatchmakingOverlay
        status={matchmakingStatus}
        opponent={opponent}
        countdown={countdown}
        searchTime={searchTime}
        error={matchmakingError}
        onCancel={handleCancelMatchmaking}
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <GameBadge variant="amber">
              <Swords size={10} />
              Arena
            </GameBadge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-game-navy md:text-4xl uppercase">
            Online Duels
          </h1>
          <p className="mt-2 text-sm text-game-navy/50 font-bold">
            Challenge your friends and coders around the globe
          </p>
        </div>

        {/* ── Card Grid ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MATCH_CARDS.map((card) => {
            const isLocked = card.status === "locked";

            return (
              <div
                key={card.id}
                role="button"
                tabIndex={isLocked ? -1 : 0}
                aria-label={`${card.title}${isLocked ? " — Upcoming" : ""}`}
                aria-disabled={isLocked}
                onClick={() => handleCardClick(card)}
                onKeyDown={(e) => handleCardKeyDown(e, card)}
                className="group"
              >
                <GamePanel
                  variant={isLocked ? "inset" : "default"}
                  hasShadow={!isLocked}
                  shadowSize="sm"
                  noPadding
                  className={`overflow-hidden transition-all duration-200 ${
                    isLocked
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_var(--color-game-navy)]"
                  }`}
                >
                  {/* Top accent stripe */}
                  <HazardStripe
                    variant={isLocked ? "danger" : "warning"}
                    height="sm"
                  />

                  <div className="p-5">
                    {/* Top: Icon + Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center border-[2px] border-game-navy rounded-sm game-shadow-sm ${
                          isLocked
                            ? "bg-game-gray/20 text-game-gray"
                            : card.badgeVariant === "info"
                              ? "bg-game-blue text-game-cream"
                              : card.badgeVariant === "success"
                                ? "bg-game-green text-game-cream"
                                : card.badgeVariant === "warning"
                                  ? "bg-game-orange text-game-cream"
                                  : "bg-game-cream text-game-navy"
                        }`}
                      >
                        {card.icon}
                      </div>

                      {isLocked && (
                        <GameBadge variant="default">
                          <Lock className="h-3 w-3" />
                          Upcoming
                        </GameBadge>
                      )}

                      {!isLocked && card.tag && (
                        <GameBadge variant={card.badgeVariant}>
                          {card.tag}
                        </GameBadge>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="text-base font-bold text-game-navy uppercase mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-game-navy/60 font-medium leading-relaxed mb-4">
                      {card.description}
                    </p>

                    {/* Footer action */}
                    {!isLocked && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-game-amber-dark uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span>
                          {card.action === "matchmaking" && "Start Battle"}
                          {card.action === "navigate" && "Start Practice"}
                          {card.action === "friend-card" && "Invite Friend"}
                        </span>
                      </div>
                    )}
                  </div>
                </GamePanel>
              </div>
            );
          })}
        </div>

        {/* ── Stats Bar ── */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <GameBadge variant="info">
              <Activity size={10} />
              Live Stats
            </GameBadge>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: "Online Players",
                value: "1,247",
                icon: <Users size={14} />,
                variant: "success" as const,
              },
              {
                label: "Active Matches",
                value: "89",
                icon: <Swords size={14} />,
                variant: "info" as const,
              },
              {
                label: "Your Wins",
                value: "0",
                icon: <Trophy size={14} />,
                variant: "warning" as const,
              },
              {
                label: "Win Rate",
                value: "0%",
                icon: <Target size={14} />,
                variant: "danger" as const,
              },
            ].map((stat) => (
              <GamePanel
                key={stat.label}
                variant="default"
                hasShadow
                shadowSize="sm"
                className="!p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center border-[2px] border-game-navy rounded-sm ${
                      stat.variant === "success"
                        ? "bg-game-green text-game-cream"
                        : stat.variant === "info"
                          ? "bg-game-blue text-game-cream"
                          : stat.variant === "warning"
                            ? "bg-game-amber text-game-navy"
                            : "bg-game-red text-game-cream"
                    }`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-game-navy">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </GamePanel>
            ))}
          </div>
        </div>

        {/* ── Player Progress ── */}
        <div className="mt-8">
          <GamePanel variant="default" hasShadow shadowSize="sm">
            <div className="flex items-center gap-2 mb-4">
              <GameBadge variant="amber">
                <Shield size={10} />
                Player Progress
              </GameBadge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GameProgressBar
                value={35}
                max={100}
                variant="xp"
                label="Level 1 XP"
                showValue
              />
              <GameProgressBar
                value={0}
                max={10}
                variant="default"
                label="Daily Challenges"
                showValue
              />
              <GameProgressBar
                value={0}
                max={50}
                variant="health"
                label="Win Streak"
                showValue
              />
            </div>
          </GamePanel>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
