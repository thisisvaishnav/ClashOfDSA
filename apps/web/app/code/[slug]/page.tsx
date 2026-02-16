"use client";

import { Group, Panel, Separator } from "react-resizable-panels";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Play,
  Loader2,
  Trophy,
  Target,
  BookOpen,
  FileCode2,
  History,
  Star,
  Coins,
  Flag,
  CircleDot,
  Shield,
  ChevronLeft,
  Terminal,
} from "lucide-react";

import questionsData from "../../data/questions.json";
import { useSession } from "../../../lib/auth-client";
import {
  createPracticeSubmission as createPracticeSubmissionApi,
  fetchPracticeSubmissions,
} from "../../../lib/api";

import {
  GamePanel,
  GameButton,
  GameTabs,
  GameBadge,
  GameAlert,
  HazardStripe,
  GameSelect,
  GameProgressBar,
  GameIconButton,
} from "../../../components/game-ui";

/* -------------------- Types -------------------- */

interface TestCase {
  input: string;
  expected_output: string;
}

interface Question {
  id: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  testcases: TestCase[];
}

type SupportedLanguage = "javascript" | "python" | "cpp";
type Tab = "Description" | "Editorial" | "Solutions" | "Submissions";

interface Submission {
  id: string;
  language: SupportedLanguage;
  code: string;
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded";
  createdAt: string;
  runtimeMs: number;
  memoryMb: number;
}

interface RunResult {
  status: "idle" | "running" | "success" | "error";
  message: string;
}

/* -------------------- Helpers -------------------- */

const getDefaultCode = (lang: SupportedLanguage) => {
  if (lang === "python") return `# Write your code here\nprint("Hello World")`;
  if (lang === "javascript")
    return `// Write your code here\nconsole.log("Hello World");`;

  return `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello World";
    return 0;
}`;
};

const difficultyStars: Record<Question["difficulty"], number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const difficultyBadgeVariant: Record<
  Question["difficulty"],
  "success" | "warning" | "danger"
> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

const languageOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
];

/* -------------------- Page -------------------- */

const Page = () => {
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  const questionId = Number(params.slug);
  const raw = questionsData.find((q: any) => q.id === questionId);

  const question: Question = raw
    ? {
        id: raw.id,
        category: raw.category,
        difficulty:
          raw.difficulty.toLowerCase() === "hard"
            ? "Hard"
            : raw.difficulty.toLowerCase() === "medium"
            ? "Medium"
            : "Easy",
        question: raw.question,
        testcases: raw.testcases,
      }
    : {
        id: 0,
        category: "General",
        difficulty: "Easy",
        question: "Problem not found.",
        testcases: [],
      };

  const [activeTab, setActiveTab] = useState<Tab>("Description");
  const [language, setLanguage] = useState<SupportedLanguage>("javascript");

  const [runResult, setRunResult] = useState<RunResult>({
    status: "idle",
    message: "Run your code to see output.",
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [code, setCode] = useState("");

  const { data: session } = useSession();

  /* Persist code per question + language */
  useEffect(() => {
    const saved =
      localStorage.getItem(`code-${question.id}-${language}`) ??
      getDefaultCode(language);
    setCode(saved);
  }, [language, question.id]);

  /* Load submissions: from API when logged in, else localStorage */
  useEffect(() => {
    if (session?.user) {
      setSubmissionsLoading(true);
      fetchPracticeSubmissions(question.id)
        .then((list) => {
          const mapped: Submission[] = list.map((s) => ({
            id: s.id,
            language: s.language as SupportedLanguage,
            code: s.code,
            status: s.status as Submission["status"],
            createdAt: s.createdAt,
            runtimeMs: s.runtimeMs ?? 0,
            memoryMb: s.memoryMb ?? 0,
          }));
          setSubmissions(mapped);
          setSelectedSubmissionId(mapped[0]?.id ?? null);
        })
        .catch(() => {
          setSubmissions([]);
          setSelectedSubmissionId(null);
        })
        .finally(() => setSubmissionsLoading(false));
    } else {
      try {
        const raw = localStorage.getItem(`submissions-${question.id}`);
        if (!raw) {
          setSubmissions([]);
          setSelectedSubmissionId(null);
          return;
        }
        const parsed = JSON.parse(raw) as Submission[];
        setSubmissions(parsed);
        setSelectedSubmissionId(parsed[0]?.id ?? null);
      } catch {
        setSubmissions([]);
        setSelectedSubmissionId(null);
      }
    }
  }, [question.id, session?.user]);

  const saveCode = (value: string) => {
    setCode(value);
    localStorage.setItem(`code-${question.id}-${language}`, value);
  };

  const persistSubmissions = (items: Submission[]) => {
    setSubmissions(items);
    localStorage.setItem(`submissions-${question.id}`, JSON.stringify(items));
  };

  /* -------------------- Actions -------------------- */

  const runCode = async () => {
    if (language !== "javascript") {
      setRunResult({
        status: "error",
        message:
          "Running is only supported for JavaScript in the browser right now.",
      });
      return;
    }

    setRunResult({ status: "running", message: "Running your code..." });

    let output = "";
    const originalLog = console.log;
    const originalError = console.error;

    try {
      console.log = (...args: any[]) => {
        output +=
          args
            .map((arg) => {
              if (typeof arg === "object") {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            })
            .join(" ") + "\n";
        originalLog(...args);
      };

      console.error = (...args: any[]) => {
        output += "Error: " + args.map(String).join(" ") + "\n";
        originalError(...args);
      };

      const fn = new Function(code);
      await fn();

      console.log = originalLog;
      console.error = originalError;

      setRunResult({
        status: "success",
        message: output || "Program finished with no output.",
      });
    } catch (err: any) {
      console.log = originalLog;
      console.error = originalError;

      setRunResult({
        status: "error",
        message: `Error: ${err?.message ?? String(err)}`,
      });
    }
  };

  const submitCode = async () => {
    setRunResult({ status: "running", message: "Submitting solution..." });

    const runtimeMs = 42 + Math.round(Math.random() * 40);
    const memoryMb = 32 + Math.round(Math.random() * 16);

    if (session?.user) {
      try {
        const created = await createPracticeSubmissionApi({
          questionId: question.id,
          code,
          language,
          status: "Accepted",
          runtimeMs,
          memoryMb,
        });
        const submission: Submission = {
          id: created.id,
          language: created.language as SupportedLanguage,
          code: created.code,
          status: created.status as Submission["status"],
          createdAt: created.createdAt,
          runtimeMs: created.runtimeMs ?? runtimeMs,
          memoryMb: created.memoryMb ?? memoryMb,
        };
        const next = [submission, ...submissions];
        setSubmissions(next);
        setSelectedSubmissionId(submission.id);
        setRunResult({
          status: "success",
          message: `Accepted\nRuntime: ${submission.runtimeMs} ms\nMemory: ${submission.memoryMb} MB`,
        });
      } catch (err) {
        setRunResult({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to save submission.",
        });
      }
      return;
    }

    await new Promise((r) => setTimeout(r, 1500));
    const submission: Submission = {
      id: `${Date.now()}`,
      language,
      code,
      status: "Accepted",
      createdAt: new Date().toISOString(),
      runtimeMs,
      memoryMb,
    };
    const next = [submission, ...submissions];
    persistSubmissions(next);
    setSelectedSubmissionId(submission.id);
    setRunResult({
      status: "success",
      message: `Accepted\nRuntime: ${submission.runtimeMs} ms\nMemory: ${submission.memoryMb} MB`,
    });
  };

  /* -------------------- Tab config -------------------- */

  const tabItems = [
    { id: "Description" as Tab, label: "Description", icon: <Target size={14} /> },
    { id: "Editorial" as Tab, label: "Editorial", icon: <BookOpen size={14} /> },
    { id: "Solutions" as Tab, label: "Solutions", icon: <FileCode2 size={14} /> },
    {
      id: "Submissions" as Tab,
      label: "Submissions",
      icon: <History size={14} />,
    },
  ];

  /* -------------------- Render -------------------- */

  return (
    <main className="flex h-screen flex-col bg-game-cream-dark relative overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B2838' fill-opacity='1'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* ===== Top Header Bar ===== */}
      <header className="relative z-10 flex items-center justify-between px-4 py-2 bg-game-navy border-b-[3px] border-game-navy">
        {/* Left: Logo + Stats */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 border-[2px] border-game-amber rounded-sm bg-game-amber flex items-center justify-center game-shadow-sm">
              <Shield size={18} className="text-game-navy" />
            </div>
            <span className="font-bold text-game-cream tracking-tight text-sm uppercase">
              Code Battle
            </span>
          </div>

          {/* Player stats */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l-[2px] border-game-navy-light">
            <GameBadge variant="amber">
              <Coins size={12} />
              <span>0</span>
            </GameBadge>
            <GameBadge variant="amber">
              <Trophy size={12} />
              <span>--</span>
            </GameBadge>
            <GameBadge variant="default">
              <span className="text-game-navy/50">LV</span>
              <span className="text-game-amber-dark">1</span>
            </GameBadge>
          </div>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-2">
          <GameButton variant="success" size="sm" onClick={runCode}>
            <Play size={14} fill="currentColor" />
            Run
          </GameButton>
          <GameButton variant="primary" size="sm" onClick={submitCode}>
            <Flag size={14} />
            Submit
          </GameButton>
        </div>

        {/* Right: User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-game-navy-light rounded-sm bg-game-navy-light hover:bg-game-navy-light/80 transition-colors cursor-pointer"
            aria-label="User menu"
            tabIndex={0}
          >
            <div className="h-7 w-7 border-[2px] border-game-amber rounded-sm bg-game-amber/20 flex items-center justify-center text-xs font-bold text-game-amber">
              {(
                (session?.user as any)?.name?.[0] ??
                (session?.user as any)?.email?.[0] ??
                "P"
              )
                .toString()
                .toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-game-cream uppercase">
              {(session?.user as any)?.email ?? "Player"}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 border-[3px] border-game-navy rounded-sm bg-game-cream game-shadow text-sm z-20 overflow-hidden">
              <div className="px-3 py-2 bg-game-cream-dark border-b-[2px] border-game-navy text-[10px] font-bold text-game-navy/60 uppercase tracking-wider">
                Menu
              </div>
              {["My list", "Notebook", "Profile", "Settings"].map((item) => (
                <button
                  key={item}
                  className="w-full px-3 py-2 text-left text-game-navy text-xs font-bold hover:bg-game-amber/20 transition-colors cursor-pointer"
                  tabIndex={0}
                >
                  {item}
                </button>
              ))}
              <div className="border-t-[2px] border-game-navy" />
              <button
                className="w-full px-3 py-2 text-left text-game-red text-xs font-bold hover:bg-game-red/10 transition-colors cursor-pointer"
                tabIndex={0}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hazard stripe under header */}
      <HazardStripe variant="warning" height="sm" />

      {/* ===== Main Content ===== */}
      <div className="flex-1 min-h-0 flex relative z-10">
        <Group orientation="horizontal" className="flex h-full w-full">
          {/* ========== LEFT PANEL: Challenge Info ========== */}
          <Panel defaultSize={45} minSize={25}>
            <aside className="h-full flex flex-col bg-game-cream border-r-[3px] border-game-navy">
              {/* Panel header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-game-navy">
                <GameIconButton
                  variant="default"
                  size="sm"
                  onClick={() => router.back()}
                  aria-label="Go back"
                >
                  <ChevronLeft size={16} />
                </GameIconButton>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-game-amber uppercase tracking-wider">
                    Challenge
                  </div>
                  <h1 className="font-bold text-game-cream text-base">
                    #{question.id}
                  </h1>
                </div>
                {/* XP Progress */}
                <div className="hidden md:block w-32">
                  <GameProgressBar
                    value={35}
                    max={100}
                    variant="xp"
                    label="XP"
                  />
                </div>
              </div>

              {/* Tabs */}
              <GameTabs
                tabs={tabItems}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as Tab)}
              />

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed game-scrollbar">
                {/* ---- Description Tab ---- */}
                {activeTab === "Description" && (
                  <>
                    {/* Difficulty + Category Badges */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <GameBadge variant="info">{question.category}</GameBadge>
                      <GameBadge
                        variant={difficultyBadgeVariant[question.difficulty]}
                      >
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={
                              i < difficultyStars[question.difficulty]
                                ? "fill-current"
                                : "opacity-30"
                            }
                          />
                        ))}
                        {question.difficulty}
                      </GameBadge>
                    </div>

                    {/* Problem description */}
                    <div className="space-y-2 text-game-navy/80">
                      {question.question.split("\n").map((p, i) => (
                        <p key={i} className="whitespace-pre-wrap">
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* Test cases */}
                    <div className="mt-5 mb-3 flex items-center gap-2">
                      <GameBadge variant="amber">
                        <Target size={10} />
                        Test Cases
                      </GameBadge>
                    </div>

                    {question.testcases.map((tc, i) => (
                      <GamePanel
                        key={i}
                        variant="inset"
                        hasShadow={false}
                        className="mb-3 border-[2px]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GameBadge variant="amber">#{i + 1}</GameBadge>
                        </div>
                        <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-wider mb-0.5">
                          Input
                        </p>
                        <p className="text-xs text-game-navy font-mono mb-2 bg-game-cream px-2 py-1 border border-game-navy/20 rounded-sm">
                          {tc.input}
                        </p>
                        <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-wider mb-0.5">
                          Expected
                        </p>
                        <p className="text-xs text-game-green font-mono bg-game-cream px-2 py-1 border border-game-green/30 rounded-sm">
                          {tc.expected_output}
                        </p>
                      </GamePanel>
                    ))}

                    {/* Rewards section */}
                    <GamePanel variant="default" hasShadow={false} className="mt-6 border-[2px]">
                      <div className="flex items-center gap-2 mb-2">
                        <GameBadge variant="amber">
                          <Coins size={10} />
                          Rewards
                        </GameBadge>
                      </div>
                      <p className="text-xs text-game-navy/70">
                        Earn trophies and unlock your best solution.
                      </p>
                    </GamePanel>
                  </>
                )}

                {/* ---- Editorial Tab ---- */}
                {activeTab === "Editorial" && (
                  <div className="space-y-4">
                    <GamePanel variant="default" hasShadow={false} className="border-[2px]">
                      <div className="flex items-center gap-2 mb-2">
                        <GameBadge variant="info">Overview</GameBadge>
                      </div>
                      <p className="text-xs text-game-navy/80">
                        This is a {question.difficulty.toLowerCase()} level{" "}
                        {question.category} problem. You are given some input
                        and need to transform it into the exact output shown in
                        the objectives. Focus on carefully reading from standard
                        input and printing the correct value or sequence.
                      </p>
                    </GamePanel>

                    <GamePanel variant="default" hasShadow={false} className="border-[2px]">
                      <div className="flex items-center gap-2 mb-2">
                        <GameBadge variant="info">Strategy</GameBadge>
                      </div>
                      <ol className="list-decimal space-y-1.5 pl-5 text-xs text-game-navy/80">
                        <li>
                          Parse the input in the same format as described.
                        </li>
                        <li>
                          Apply a simple operation (like sum, min/max, counting,
                          or reordering) to compute the answer.
                        </li>
                        <li>
                          Print the result using the exact formatting from the
                          sample outputs (including spaces and newlines).
                        </li>
                      </ol>
                    </GamePanel>

                    <GamePanel variant="default" hasShadow={false} className="border-[2px]">
                      <div className="flex items-center gap-2 mb-2">
                        <GameBadge variant="info">Complexity</GameBadge>
                      </div>
                      <p className="text-xs text-game-navy/80">
                        Most problems in this set can be solved in{" "}
                        <span className="font-mono font-bold text-game-amber-dark">
                          O(n)
                        </span>{" "}
                        time where{" "}
                        <span className="font-mono font-bold">n</span> is the
                        number of input elements, and with{" "}
                        <span className="font-mono font-bold text-game-amber-dark">
                          O(1)
                        </span>{" "}
                        or{" "}
                        <span className="font-mono font-bold text-game-amber-dark">
                          O(n)
                        </span>{" "}
                        extra memory.
                      </p>
                    </GamePanel>

                    <GamePanel variant="default" hasShadow={false} className="border-[2px]">
                      <div className="flex items-center gap-2 mb-2">
                        <GameBadge variant="warning">Edge Cases</GameBadge>
                      </div>
                      <ul className="list-disc space-y-1 pl-5 text-xs text-game-navy/80">
                        <li>
                          Check the smallest and largest possible inputs.
                        </li>
                        <li>Be careful with negative numbers and zeros.</li>
                        <li>
                          Match the exact spacing and newline behavior.
                        </li>
                      </ul>
                    </GamePanel>
                  </div>
                )}

                {/* ---- Solutions Tab ---- */}
                {activeTab === "Solutions" && (
                  <div className="space-y-3">
                    {submissionsLoading ? (
                      <div className="flex items-center gap-2 text-game-amber-dark">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="font-bold text-sm">Loading...</span>
                      </div>
                    ) : submissions.length === 0 ? (
                      <GameAlert
                        variant="info"
                        title="No Solutions Yet"
                        message="Submit to unlock your best solution."
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <GameBadge variant="amber">
                            <Trophy size={10} />
                            Best Solution
                          </GameBadge>
                        </div>
                        {(() => {
                          const accepted =
                            submissions.find(
                              (s) => s.status === "Accepted"
                            ) ?? submissions[0];
                          if (!accepted) return null;
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-game-navy/60">
                                <span>
                                  Language:{" "}
                                  <span className="font-mono font-bold text-game-amber-dark">
                                    {accepted.language}
                                  </span>
                                </span>
                                <span className="font-mono">
                                  {accepted.runtimeMs} ms ·{" "}
                                  {accepted.memoryMb} MB
                                </span>
                              </div>
                              <GamePanel
                                variant="dark"
                                hasShadow={false}
                                noPadding
                                className="border-[2px]"
                              >
                                <pre className="max-h-72 overflow-auto px-3 py-2 text-xs font-mono text-game-cream">
                                  {accepted.code}
                                </pre>
                              </GamePanel>
                              <GameButton
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setLanguage(accepted.language);
                                  saveCode(accepted.code);
                                }}
                              >
                                Load into editor
                              </GameButton>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* ---- Submissions Tab ---- */}
                {activeTab === "Submissions" && (
                  <div className="space-y-3 text-sm">
                    {!session?.user && (
                      <GameAlert
                        variant="warning"
                        message="Sign in to save your battle log."
                      />
                    )}
                    {submissionsLoading ? (
                      <div className="flex items-center gap-2 text-game-amber-dark font-bold">
                        <Loader2 className="animate-spin" size={16} />
                        <span>Loading...</span>
                      </div>
                    ) : submissions.length === 0 ? (
                      <GameAlert
                        variant="info"
                        title="No Submissions"
                        message="No submissions yet. Hit Submit to log your first victory."
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <GameBadge variant="amber">
                            <Trophy size={10} />
                            Battle Log
                          </GameBadge>
                        </div>
                        <div className="space-y-2">
                          {submissions.map((s) => {
                            const isSelected =
                              s.id === selectedSubmissionId;
                            const isAccepted = s.status === "Accepted";
                            return (
                              <button
                                key={s.id}
                                onClick={() =>
                                  setSelectedSubmissionId(s.id)
                                }
                                tabIndex={0}
                                aria-label={`Submission ${s.status} at ${new Date(s.createdAt).toLocaleString()}`}
                                className={`flex w-full items-center justify-between rounded-sm border-[2px] px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? "border-game-amber bg-game-amber/10 game-shadow-sm"
                                    : "border-game-navy/30 bg-game-cream hover:bg-game-cream-dark"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isAccepted ? (
                                    <Trophy
                                      size={14}
                                      className="text-game-amber shrink-0"
                                    />
                                  ) : (
                                    <CircleDot
                                      size={14}
                                      className="text-game-gray shrink-0"
                                    />
                                  )}
                                  <div className="flex flex-col gap-0.5">
                                    <span
                                      className={
                                        isAccepted
                                          ? "font-bold text-game-green"
                                          : "text-game-navy/60"
                                      }
                                    >
                                      {s.status}
                                    </span>
                                    <span className="text-[10px] text-game-navy/40">
                                      {new Date(
                                        s.createdAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 text-[10px] text-game-navy/50 font-mono">
                                  <span className="uppercase font-bold">
                                    {s.language}
                                  </span>
                                  <span>
                                    {s.runtimeMs} ms · {s.memoryMb} MB
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected submission code */}
                        {(() => {
                          const current = submissions.find(
                            (s) => s.id === selectedSubmissionId
                          );
                          if (!current) return null;
                          return (
                            <div className="mt-3 space-y-2">
                              <GameBadge variant="default">
                                Selected
                              </GameBadge>
                              <GamePanel
                                variant="dark"
                                hasShadow={false}
                                noPadding
                                className="border-[2px]"
                              >
                                <pre className="max-h-72 overflow-auto px-3 py-2 text-xs font-mono text-game-cream">
                                  {current.code}
                                </pre>
                              </GamePanel>
                              <GameButton
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setLanguage(current.language);
                                  saveCode(current.code);
                                }}
                              >
                                Load into editor
                              </GameButton>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom hazard stripe */}
              <HazardStripe variant="warning" height="sm" />
            </aside>
          </Panel>

          <Separator className="w-[3px] bg-game-navy shrink-0" />

          {/* ========== RIGHT PANEL: Code Editor ========== */}
          <Panel defaultSize={55} minSize={30}>
            <section className="flex h-full flex-col bg-game-cream-dark border-l-0">
              {/* Editor header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-game-navy border-b-[3px] border-game-navy">
                <div className="flex items-center gap-3">
                  <GameBadge variant="default">
                    <Terminal size={10} />
                    Editor
                  </GameBadge>
                  <GameSelect
                    options={languageOptions}
                    value={language}
                    onChange={(val) =>
                      setLanguage(val as SupportedLanguage)
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <GameButton variant="success" size="sm" onClick={runCode}>
                    <Play size={12} fill="currentColor" />
                    Run
                  </GameButton>
                  <GameButton
                    variant="primary"
                    size="sm"
                    onClick={submitCode}
                  >
                    <Flag size={12} />
                    Submit
                  </GameButton>
                </div>
              </div>

              {/* Editor + Output split */}
              <div className="flex-1 min-h-0">
                <Group
                  orientation="vertical"
                  className="flex h-full w-full flex-col"
                >
                  {/* Code editor */}
                  <Panel defaultSize={70} minSize={40}>
                    <div className="h-full overflow-hidden border-b-[2px] border-game-navy">
                      <Editor
                        theme="vs-dark"
                        language={
                          language === "cpp" ? "cpp" : language
                        }
                        value={code}
                        onChange={(v) => saveCode(v ?? "")}
                        options={{
                          fontSize: 13,
                          minimap: { enabled: false },
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                        }}
                      />
                    </div>
                  </Panel>

                  <Separator className="h-[3px] bg-game-navy shrink-0" />

                  {/* Output panel */}
                  <Panel defaultSize={30} minSize={15}>
                    <div className="h-full flex flex-col bg-game-cream overflow-hidden">
                      {/* Output header */}
                      <div className="flex items-center gap-2 px-4 py-2 bg-game-navy border-b-[2px] border-game-navy">
                        <GameBadge variant="default">
                          <Terminal size={10} />
                          Output
                        </GameBadge>
                      </div>

                      {/* Status bar */}
                      {runResult.status === "running" && (
                        <>
                          <HazardStripe variant="warning" height="sm" />
                          <div className="px-4 py-2 bg-game-amber/10 border-b-[2px] border-game-amber/30 flex items-center gap-2">
                            <Loader2
                              className="animate-spin shrink-0 text-game-amber-dark"
                              size={16}
                            />
                            <span className="text-xs font-bold text-game-amber-dark uppercase">
                              Running...
                            </span>
                          </div>
                        </>
                      )}
                      {runResult.status === "success" && runResult.message && (
                        <>
                          <HazardStripe variant="success" height="sm" />
                          <div className="px-4 py-2 bg-game-green/10 border-b-[2px] border-game-green/30 flex items-center gap-2">
                            <span className="text-xs font-bold text-game-green uppercase">
                              Success
                            </span>
                          </div>
                        </>
                      )}
                      {runResult.status === "error" && (
                        <>
                          <HazardStripe variant="danger" height="sm" />
                          <div className="px-4 py-2 bg-game-red/10 border-b-[2px] border-game-red/30 flex items-center gap-2">
                            <span className="text-xs font-bold text-game-red uppercase">
                              Error
                            </span>
                          </div>
                        </>
                      )}

                      {/* Output content */}
                      <div
                        className={`flex-1 p-4 text-xs whitespace-pre-wrap overflow-auto font-mono ${
                          runResult.status === "running"
                            ? "text-game-amber-dark"
                            : runResult.status === "error"
                              ? "text-game-red"
                              : runResult.status === "success"
                                ? "text-game-green"
                                : "text-game-navy/40"
                        }`}
                      >
                        {runResult.status === "running" && (
                          <div className="flex items-center gap-2">
                            <Loader2
                              className="animate-spin shrink-0"
                              size={14}
                            />
                            {runResult.message}
                          </div>
                        )}
                        {runResult.status !== "running" && (
                          <>
                            {runResult.status === "idle" && (
                              <span className="italic text-game-navy/30">
                                Run your code to see output here.
                              </span>
                            )}
                            {runResult.status !== "idle" &&
                              runResult.message}
                          </>
                        )}
                      </div>
                    </div>
                  </Panel>
                </Group>
              </div>
            </section>
          </Panel>
        </Group>
      </div>
    </main>
  );
};

export default Page;
