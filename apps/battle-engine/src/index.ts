import http from "http";
import express from "express";
import cors from "cors";

import { db } from "./core/database/db.client";
import { redis } from "./core/queue/redis.client";
import { initSocket } from "./core/socket/socket.manager";
import { corsConfig } from "./config/cors.config";
import { EFFECTIVE_PORT } from "./config/env.config";
import { authRouter } from "./features/auth/auth.routes";
import { submissionRouter } from "./features/submission/submission.routes";
import { friendRouter } from "./features/social/friend.routes";
import { chatRouter } from "./features/chat/chat.routes";
import { leaderboardRouter } from "./features/leaderboard/leaderboard.routes";
import { matchRouter } from "./features/match/match.routes";
import { userRouter } from "./features/user/user.routes";

const app = express();

app.use(cors(corsConfig));
app.use(express.json());
app.use(authRouter);
app.use(submissionRouter);
app.use(friendRouter);
app.use(chatRouter);
app.use(leaderboardRouter);
app.use(matchRouter);
app.use(userRouter);

const startServer = async () => {
  await redis.connect();

  const server = http.createServer(app);
  const io = initSocket(server);

  server.listen(EFFECTIVE_PORT, () => {
    console.log(`Server running on port ${EFFECTIVE_PORT}`);
  });

  return { server, io };
};

export const serverPromise = startServer();
