import { Worker, type Job } from 'bullmq';
import {
  createRedisConnection,
  connection,
  SUBMISSION_QUEUE,
  SUBMISSION_RESULT_CHANNEL,
  type SubmissionJobData,
  type SubmissionJobResult,
} from '@repo/queue';
import { processSubmission } from '../processors/submission.processor';
import { WORKER_CONCURRENCY, isDevelopment } from '../config/env.config';

// ─── Submission Worker ───────────────────────────────────────────────

export const submissionWorker = new Worker<SubmissionJobData, SubmissionJobResult>(
  SUBMISSION_QUEUE,
  async (job: Job<SubmissionJobData>) => {
    if (isDevelopment) {
      console.log(`⚙️  Processing job ${job.id} — submission ${job.data.submissionId}`);
    }

    // Run sandboxed code execution + DB update
    const result = await processSubmission(job.data);

    // Publish result to Redis so the battle-engine can push real-time updates
    await connection.publish(
      SUBMISSION_RESULT_CHANNEL,
      JSON.stringify(result),
    );

    const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    console.log(
      `${icon} Submission ${result.submissionId}: ${result.status} (${result.testsPassed}/${result.totalTests})`,
    );

    return result;
  },
  {
    connection: createRedisConnection(),
    concurrency: WORKER_CONCURRENCY,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

// ─── Worker Events ───────────────────────────────────────────────────

submissionWorker.on('completed', (job) => {
  if (isDevelopment) {
    console.log(`📦 Job ${job.id} completed`);
  }
});

submissionWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
});

submissionWorker.on('error', (err) => {
  console.error('❌ Submission worker error:', err.message);
});

submissionWorker.on('stalled', (jobId) => {
  console.warn(`⏳ Job ${jobId} stalled — will be retried`);
});
