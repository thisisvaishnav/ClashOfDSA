import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { db } from "./core/database/db.client";
import { redis } from "./core/queue/redis.client";
import { initSocket } from "./core/socket/socket.manager";
import { corsConfig } from "./config/cors.config";
import { EFFECTIVE_PORT } from "./config/env.config";
import { globalLimiter, authLimiter, publicLimiter, searchLimiter, friendRequestLimiter, chatSendLimiter } from "./middleware/rate-limiter";
import { authRouter } from "./features/auth/auth.routes";
import { submissionRouter } from "./features/submission/submission.routes";
import { friendRouter } from "./features/social/friend.routes";
import { chatRouter } from "./features/chat/chat.routes";
import { leaderboardRouter } from "./features/leaderboard/leaderboard.routes";
import { matchRouter } from "./features/match/match.routes";
import { userRouter } from "./features/user/user.routes";
import { SUBMISSION_RESULT_CHANNEL, type SubmissionJobResult } from "@repo/queue";
import { applySubmissionResult } from "./features/submission/submission.service";

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────
app.use(cors(corsConfig));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
}));
app.use(express.json({ limit: "10kb" }));
app.use(globalLimiter);

// ─── Per-Route Rate Limiters ──────────────────────────────────────────
app.use("/api/auth/sign-up", authLimiter);
app.use("/api/auth/sign-in", authLimiter);
app.use("/api/leaderboard", publicLimiter);
app.use("/api/users/search", searchLimiter);
app.use("/api/friends/request", friendRequestLimiter);
app.use("/api/chat", chatSendLimiter);

// ─── Route Handlers ──────────────────────────────────────────────────
app.use(authRouter);
app.use(submissionRouter);
app.use(friendRouter);
app.use(chatRouter);
app.use(leaderboardRouter);
app.use(matchRouter);
app.use(userRouter);

const startServer = async () => {
  await redis.connect();

  // ─── Subscribe to submission results from the worker ─────────────
  const subscriber = await redis.getSubscriber();
  await subscriber.subscribe(SUBMISSION_RESULT_CHANNEL, async (message) => {
    try {
      const result: SubmissionJobResult = JSON.parse(message);
      await applySubmissionResult(result);
    } catch (err) {
      console.error('Failed to handle submission result:', err);
    }
  });
  console.log(`✅ Subscribed to ${SUBMISSION_RESULT_CHANNEL}`);

  const server = http.createServer(app);
  const io = initSocket(server);

  server.listen(EFFECTIVE_PORT, () => {
    console.log(`Server running on port ${EFFECTIVE_PORT}`);
  });

  return { server, io };
};

export const serverPromise = startServer();
