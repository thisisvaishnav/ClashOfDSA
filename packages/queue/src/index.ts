import Redis from 'ioredis';
import { Queue } from 'bullmq';

// ─── Redis URL ───────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ─── Shared Redis Connection (general pub/sub, caching) ─────────────
export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

/**
 * Create a dedicated Redis connection.
 * BullMQ workers use blocking commands, so each Queue/Worker
 * should own its own connection instance.
 */
export const createRedisConnection = (): Redis => {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
};

// ─── Queue Names ─────────────────────────────────────────────────────
export const SUBMISSION_QUEUE = 'submission.process';

// ─── Redis Keys (matchmaking) ───────────────────────────────────────
export const WAITING_LIST = 'match:waiting';
export const ACTIVE_MATCHES = 'match:active';

// ─── Pub/Sub Channels ───────────────────────────────────────────────
export const SUBMISSION_RESULT_CHANNEL = 'channel:submission:result';

// ─── Job Data Types ─────────────────────────────────────────────────
export type SubmissionJobData = {
  submissionId: string;
  userId: string;
  matchId: string;
  questionId: number;
  code: string;
  language: string;
};

export type SubmissionJobResult = {
  submissionId: string;
  userId: string;
  matchId: string;
  questionId: number;
  status: 'passed' | 'failed' | 'error';
  testsPassed: number;
  totalTests: number;
  errorMessage?: string;
};

// ─── Queue Instances (producers) ─────────────────────────────────────
export const submissionQueue = new Queue<SubmissionJobData>(SUBMISSION_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});
