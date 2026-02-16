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
} from "lucide-react";
import { useRouter } from "next/navigation";
import questionsData from "../../data/questions.json";

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
    title: "Quick Match",
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
   Dashboard Page
   ──────────────────────────────────────────────────────────── */

const DashboardPage = () => {
  const router = useRouter();
  const [isFriendCardOpen, setIsFriendCardOpen] = useState(false);

  const handleCardClick = (card: MatchCard) => {
    if (card.status === "locked") return;

    switch (card.action) {
      case "matchmaking":
        return;
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

  return (
    <>
      <FriendCard isOpen={isFriendCardOpen} onClose={handleCloseFriendCard} />

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
                        <ArrowRight className="h-3.5 w-3.5" />
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
