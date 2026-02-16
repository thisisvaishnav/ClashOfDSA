// Load environment variables before anything else
import './config/env.config';

import { submissionWorker } from './workers/submission.worker';
import { connection, SUBMISSION_QUEUE } from '@repo/queue';

// ─── Graceful Shutdown ───────────────────────────────────────────────

const handleShutdown = async (signal: string): Promise<void> => {
  console.log(`\n📥 Received ${signal} — shutting down gracefully…`);

  try {
    // Close the BullMQ worker (waits for in-flight jobs to finish)
    await submissionWorker.close();
    console.log('🛑 Submission worker stopped');

    // Disconnect the shared Redis connection
    connection.disconnect();
    console.log('🔌 Redis disconnected');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }

  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// ─── Startup Banner ──────────────────────────────────────────────────

console.log('──────────────────────────────────────');
console.log('🚀 DSADash Worker started');
console.log(`📋 Listening on queue: ${SUBMISSION_QUEUE}`);
console.log(`⚡ Concurrency: ${submissionWorker.opts.concurrency}`);
console.log('──────────────────────────────────────');
