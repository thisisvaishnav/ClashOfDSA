import http from "http";
import express from "express";
import cors from "cors";

import { db } from "./core/database/db.client";
import { redis } from "./core/queue/redis.client";
import { initSocket } from "./core/socket/socket.manager";
import { corsConfig } from "./config/cors.config";
import { SERVER_PORT } from "./config/env.config";
import { authRouter } from "./features/auth/auth.routes";
import { submissionRouter } from "./features/submission/submission.routes";

const app = express();

app.use(cors(corsConfig));
app.use(express.json());
app.use(authRouter);
app.use(submissionRouter);

const server = http.createServer(app);

export const io = initSocket(server);

server.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
});
