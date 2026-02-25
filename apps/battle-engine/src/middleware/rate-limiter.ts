import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Global rate limiter — applies to all routes as a safety net.
 * 200 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

/**
 * Auth routes — strict limit to prevent brute-force attacks.
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

/**
 * Public routes (leaderboard) — moderate limit.
 * 60 requests per 15 minutes per IP.
 */
export const publicLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

/**
 * User search — moderate limit to prevent scraping.
 * 30 requests per 15 minutes per IP.
 */
export const searchLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many search requests, please slow down.' },
});

/**
 * Friend request creation — strict limit to prevent spam.
 * 20 requests per 15 minutes per IP.
 */
export const friendRequestLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many friend requests, please slow down.' },
});

/**
 * Chat message sending — moderate limit.
 * 60 requests per 15 minutes per IP.
 */
export const chatSendLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many messages, please slow down.' },
});
