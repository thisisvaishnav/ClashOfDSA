import dotenv from 'dotenv';

// Load .env from monorepo root
dotenv.config({ path: '../../.env' });

// ─── Server ──────────────────────────────────────────────────────────
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';

// ─── Database ────────────────────────────────────────────────────────
export const DATABASE_URL = process.env.DATABASE_URL || '';

// ─── Redis ───────────────────────────────────────────────────────────
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ─── Worker Tuning ───────────────────────────────────────────────────
/** Number of jobs processed concurrently per worker */
export const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 5;

/** Max milliseconds a single code execution may run before being killed */
export const CODE_EXECUTION_TIMEOUT_MS = Number(process.env.CODE_EXECUTION_TIMEOUT_MS) || 5_000;
