"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Star,
  ArrowRight,
  Filter,
  Hash,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import questionsData from "../../data/questions.json";

import {
  GamePanel,
  GameBadge,
  GameButton,
  GameSelect,
  GameInput,
  HazardStripe,
} from "../../../components/game-ui";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type Difficulty = "easy" | "medium" | "hard";

type Question = {
  id: number;
  category: string;
  difficulty: string;
  question: string;
  testcases: { input: string; expected_output: string }[];
};

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const ITEMS_PER_PAGE = 20;

const questions: Question[] = Array.isArray(questionsData)
  ? (questionsData as Question[])
  : [];

const ALL_CATEGORIES = Array.from(
  new Set(questions.map((q) => q.category))
).sort();

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...ALL_CATEGORIES.map((c) => ({
    value: c,
    label: c.charAt(0).toUpperCase() + c.slice(1),
  })),
];

const difficultyBadgeVariant: Record<
  Difficulty,
  "success" | "warning" | "danger"
> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

const difficultyStars: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const categoryColors: Record<string, string> = {
  math: "bg-game-blue text-game-cream",
  arrays: "bg-game-amber text-game-navy",
  string: "bg-game-green text-game-cream",
  searching: "bg-game-orange text-game-cream",
  sorting: "bg-game-red text-game-cream",
  greedy: "bg-purple-600 text-white",
};

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */

const ProblemsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        searchQuery === "" ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.toString().includes(searchQuery);

      const matchesDifficulty =
        difficultyFilter === "all" || q.difficulty === difficultyFilter;

      const matchesCategory =
        categoryFilter === "all" || q.category === categoryFilter;

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [searchQuery, difficultyFilter, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, safePage]);

  const stats = useMemo(() => {
    const easy = questions.filter((q) => q.difficulty === "easy").length;
    const medium = questions.filter((q) => q.difficulty === "medium").length;
    const hard = questions.filter((q) => q.difficulty === "hard").length;
    return { total: questions.length, easy, medium, hard };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficultyFilter(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <GameBadge variant="amber">
            <BookOpen size={10} />
            Practice
          </GameBadge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-game-navy md:text-4xl uppercase">
          Problem Set
        </h1>
        <p className="mt-2 text-sm text-game-navy/50 font-bold">
          Sharpen your skills — solve problems across categories and
          difficulties
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        {[
          { label: "Total", value: stats.total, variant: "info" as const },
          { label: "Easy", value: stats.easy, variant: "success" as const },
          { label: "Medium", value: stats.medium, variant: "warning" as const },
          { label: "Hard", value: stats.hard, variant: "danger" as const },
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
                  stat.variant === "info"
                    ? "bg-game-blue text-game-cream"
                    : stat.variant === "success"
                      ? "bg-game-green text-game-cream"
                      : stat.variant === "warning"
                        ? "bg-game-orange text-game-cream"
                        : "bg-game-red text-game-cream"
                }`}
              >
                <Hash size={14} />
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

      {/* ── Filters ── */}
      <GamePanel
        variant="default"
        hasShadow
        shadowSize="sm"
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <GameBadge variant="default">
            <Filter size={10} />
            Filters
          </GameBadge>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <GameInput
              label="Search"
              icon={<Search size={16} />}
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <GameSelect
            options={DIFFICULTY_OPTIONS}
            value={difficultyFilter}
            onChange={handleDifficultyChange}
            label="Difficulty"
          />
          <GameSelect
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={handleCategoryChange}
            label="Category"
          />
        </div>
      </GamePanel>

      {/* ── Results Count ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-game-navy/50 uppercase tracking-wider">
          Showing {paginatedQuestions.length} of {filteredQuestions.length}{" "}
          problems
        </p>
        <p className="text-xs font-bold text-game-navy/50 uppercase tracking-wider">
          Page {safePage} of {totalPages}
        </p>
      </div>

      {/* ── Problem List ── */}
      <GamePanel
        variant="default"
        hasShadow
        shadowSize="sm"
        noPadding
        className="overflow-hidden"
      >
        <HazardStripe variant="warning" height="sm" />

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[60px_1fr_120px_120px_80px] gap-3 px-5 py-3 bg-game-navy text-game-cream">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
            #
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
            Problem
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
            Category
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
            Difficulty
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-right">
            Action
          </span>
        </div>

        {/* Problem Rows */}
        {paginatedQuestions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-bold text-game-navy/40 uppercase">
              No problems found
            </p>
            <p className="text-xs text-game-navy/30 mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="divide-y-[2px] divide-game-navy/10">
            {paginatedQuestions.map((q) => {
              const difficulty = q.difficulty.toLowerCase() as Difficulty;
              return (
                <Link
                  key={q.id}
                  href={`/code/${q.id}`}
                  className="group grid grid-cols-1 md:grid-cols-[60px_1fr_120px_120px_80px] gap-2 md:gap-3 px-5 py-3.5 hover:bg-game-amber/10 transition-colors items-center"
                  aria-label={`Problem ${q.id}: ${q.question}`}
                >
                  {/* ID */}
                  <div className="flex items-center gap-2 md:gap-0">
                    <span className="text-sm font-bold text-game-navy/40 tabular-nums md:block">
                      {q.id}
                    </span>
                    {/* Mobile: show everything inline */}
                    <div className="flex items-center gap-2 md:hidden">
                      <GameBadge
                        variant={difficultyBadgeVariant[difficulty]}
                        className="!text-[8px]"
                      >
                        {difficulty}
                      </GameBadge>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase border-[1.5px] border-game-navy/20 ${
                          categoryColors[q.category] ??
                          "bg-game-cream-dark text-game-navy"
                        }`}
                      >
                        {q.category}
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm text-game-navy font-medium leading-snug line-clamp-2 group-hover:text-game-amber-dark transition-colors">
                    {q.question}
                  </p>

                  {/* Category (desktop) */}
                  <div className="hidden md:block">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border-[2px] border-game-navy/20 ${
                        categoryColors[q.category] ??
                        "bg-game-cream-dark text-game-navy"
                      }`}
                    >
                      {q.category}
                    </span>
                  </div>

                  {/* Difficulty (desktop) */}
                  <div className="hidden md:flex items-center gap-1">
                    <GameBadge variant={difficultyBadgeVariant[difficulty]}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star
                          key={i}
                          size={8}
                          className={
                            i < difficultyStars[difficulty]
                              ? "fill-current"
                              : "opacity-30"
                          }
                        />
                      ))}
                      {q.difficulty.charAt(0).toUpperCase() +
                        q.difficulty.slice(1)}
                    </GameBadge>
                  </div>

                  {/* Action */}
                  <div className="hidden md:flex justify-end">
                    <span className="flex items-center gap-1 text-xs font-bold text-game-amber-dark uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Solve
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <HazardStripe variant="warning" height="sm" />
      </GamePanel>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <GameButton
            variant="default"
            size="sm"
            onClick={handlePrevPage}
            disabled={safePage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
            Prev
          </GameButton>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              const isActive = page === safePage;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Go to page ${page}`}
                  aria-current={isActive ? "page" : undefined}
                  tabIndex={0}
                  className={`flex h-8 w-8 items-center justify-center border-[2px] rounded-sm text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-game-amber text-game-navy border-game-navy game-shadow-sm"
                      : "bg-game-cream text-game-navy/50 border-game-navy/20 hover:bg-game-cream-dark hover:border-game-navy/40"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <GameButton
            variant="default"
            size="sm"
            onClick={handleNextPage}
            disabled={safePage >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={14} />
          </GameButton>
        </div>
      )}
    </div>
  );
};

export default ProblemsPage;
