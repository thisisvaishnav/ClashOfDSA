import { z } from 'zod';
import { TypedSocket } from '../../core/socket/socket.types';
import { emitToUser } from '../../core/socket/socket.manager';
import { createSubmission } from './submission.service';
import { submissionQueue } from '@repo/queue';

const submitSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
  questionId: z.number().int().positive('questionId must be a positive integer'),
  code: z.string().min(1, 'code is required'),
  language: z.string().min(1, 'language is required'),
});

export const registerSubmissionHandlers = (socket: TypedSocket): void => {
  const { userId } = socket.data;

  socket.on('match:submit-code', async (data) => {
    try {
      const parsed = submitSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid submission payload', code: 'VALIDATION_ERROR' });
        return;
      }

      // 1. Persist the submission with status "pending"
      const submission = await createSubmission(userId, parsed.data);

      // 2. Enqueue for the worker to process (sandboxed code execution)
      await submissionQueue.add(
        'process-submission',
        {
          submissionId: submission.id,
          userId,
          matchId: parsed.data.matchId,
          questionId: parsed.data.questionId,
          code: parsed.data.code,
          language: parsed.data.language,
        },
        { jobId: submission.id },
      );

      // 3. Acknowledge back to the client
      emitToUser(userId, 'match:submission-result', {
        submissionId: submission.id,
        questionId: submission.questionId,
        status: submission.status,
      });
    } catch (err) {
      console.error('Error in submission:submit:', err);
      socket.emit('error', { message: 'Failed to submit code', code: 'INTERNAL_ERROR' });
    }
  });
};
