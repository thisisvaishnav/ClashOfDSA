"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { connectSocket, getSocket, disconnectSocket } from "../lib/socket";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

export type MatchmakingStatus =
  | "idle"
  | "searching"
  | "found"
  | "countdown"
  | "redirecting";

export type OpponentInfo = {
  id: string;
  name: string;
  rating: number;
};

type MatchFoundPayload = {
  matchId: string;
  opponent: OpponentInfo;
  questions: Array<{
    id: number;
    category: string;
    difficulty: string;
    question: string;
  }>;
};

type CountdownPayload = {
  matchId: string;
  seconds: number;
};

type MatchStartedPayload = {
  matchId: string;
  startedAt: string;
};

type SocketErrorPayload = {
  message: string;
  code?: string;
};

/* ────────────────────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────────────────────── */

export const useMatchmaking = () => {
  const router = useRouter();

  const [status, setStatus] = useState<MatchmakingStatus>("idle");
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string>("");

  /* ── helpers ──────────────────────────────────────────────── */

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  const clearReadyTimeout = useCallback(() => {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  }, []);

  /* ── socket event listeners (registered when status !== idle) ── */

  useEffect(() => {
    if (status === "idle") return;

    const socket = getSocket();
    if (!socket) return;

    const handleMatchFound = (data: MatchFoundPayload) => {
      clearSearchTimer();
      setOpponent(data.opponent);
      setMatchId(data.matchId);
      setStatus("found");

      // Auto-ready after 2 s so the user can see the "Opponent Found" UI
      readyTimeoutRef.current = setTimeout(() => {
        socket.emit("match:ready", {
          matchId: data.matchId,
          userId: userIdRef.current,
        });
      }, 2000);
    };

    const handleCountdown = (data: CountdownPayload) => {
      setStatus("countdown");
      setCountdown(data.seconds);
    };

    const handleStarted = (data: MatchStartedPayload) => {
      setStatus("redirecting");
      router.push(`/battle/${data.matchId}`);
    };
    const handleError = (data: SocketErrorPayload) => {
      setError(data.message);

      if (
        data.code === "ALREADY_IN_QUEUE" ||
        data.code === "ALREADY_IN_MATCH"
      ) {
        clearSearchTimer();
        setStatus("idle");
      }
    };

    const handleConnectError = () => {
      // Don't close the overlay — Socket.IO auto-retries.
      // Just surface the error so the user can see it; they can cancel manually.
      setError("Connecting to server… retrying automatically.");
    };

    const handleConnect = () => {
      // Clear any previous connection error once we're connected
      setError(null);
    };

    const handleDisconnect = (reason: string) => {
      // If the server drops mid-search, show a message but stay open
      if (status === "searching") {
        setError(`Disconnected: ${reason}. Reconnecting…`);
      }
    };

    socket.on("match:found", handleMatchFound);
    socket.on("match:countdown", handleCountdown);
    socket.on("match:started", handleStarted);
    socket.on("error", handleError);
    socket.on("connect_error", handleConnectError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("match:found", handleMatchFound);
      socket.off("match:countdown", handleCountdown);
      socket.off("match:started", handleStarted);
      socket.off("error", handleError);
      socket.off("connect_error", handleConnectError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [status, clearSearchTimer, router]);

  /* ── actions ──────────────────────────────────────────────── */

  const joinQueue = useCallback(
    (userId: string) => {
      userIdRef.current = userId;
      setError(null);
      setOpponent(null);
      setMatchId(null);
      setSearchTime(0);

      const socket = connectSocket();

      // Emit join-queue once connected (socket.io buffers if already connected)
      const emitJoin = () => {
        socket.emit("match:join-queue", { userId });
      };

      if (socket.connected) {
        emitJoin();
      } else {
        socket.once("connect", emitJoin);
      }

      setStatus("searching");

      searchTimerRef.current = setInterval(() => {
        setSearchTime((prev) => prev + 1);
      }, 1000);
    },
    []
  );

  const leaveQueue = useCallback(
    (userId: string) => {
      const socket = getSocket();
      if (socket) {
        socket.removeAllListeners("connect");
        socket.emit("match:leave-queue", { userId });
      }

      clearSearchTimer();
      clearReadyTimeout();
      disconnectSocket();

      setStatus("idle");
      setOpponent(null);
      setMatchId(null);
      setSearchTime(0);
      setError(null);
    },
    [clearSearchTimer, clearReadyTimeout]
  );

  const reset = useCallback(() => {
    clearSearchTimer();
    clearReadyTimeout();
    disconnectSocket();

    setStatus("idle");
    setOpponent(null);
    setMatchId(null);
    setSearchTime(0);
    setCountdown(0);
    setError(null);
  }, [clearSearchTimer, clearReadyTimeout]);

  /* ── cleanup on unmount ───────────────────────────────────── */

  useEffect(() => {
    return () => {
      clearSearchTimer();
      clearReadyTimeout();
    };
  }, [clearSearchTimer, clearReadyTimeout]);

  return {
    status,
    opponent,
    matchId,
    countdown,
    searchTime,
    error,
    joinQueue,
    leaveQueue,
    reset,
  };
};
