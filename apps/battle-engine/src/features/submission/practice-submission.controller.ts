import { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  createPracticeSubmission,
  getPracticeSubmissionsByQuestion,
} from './practice-submission.service';

const createPracticeSubmissionSchema = z.object({
  questionId: z.number().int().positive('questionId must be a positive integer'),
  code: z.string().min(1, 'code is required'),
  language: z.string().min(1, 'language is required'),
  status: z.string().min(1).default('Accepted'),
  runtimeMs: z.number().int().nonnegative().optional(),
  memoryMb: z.number().int().nonnegative().optional(),
});

const querySchema = z.object({
  questionId: z.coerce.number().int().positive('questionId is required'),
});

export const handleCreatePracticeSubmission = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const parsed = createPracticeSubmissionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const submission = await createPracticeSubmission(authReq.user.id, parsed.data);
  res.status(201).json({ success: true, data: submission });
};

export const handleGetPracticeSubmissions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const parsed = querySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const submissions = await getPracticeSubmissionsByQuestion(
    authReq.user.id,
    parsed.data.questionId,
  );
  res.json({ success: true, data: submissions });
};
