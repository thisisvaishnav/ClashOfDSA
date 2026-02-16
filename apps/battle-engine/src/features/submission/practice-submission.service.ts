import { db } from '../../core/database/db.client';

export type CreatePracticeSubmissionInput = {
  questionId: number;
  code: string;
  language: string;
  status: string;
  runtimeMs?: number;
  memoryMb?: number;
};

export type PracticeSubmissionItem = {
  id: string;
  questionId: number;
  code: string;
  language: string;
  status: string;
  runtimeMs: number | null;
  memoryMb: number | null;
  createdAt: string;
};

export const createPracticeSubmission = async (
  userId: string,
  input: CreatePracticeSubmissionInput,
): Promise<PracticeSubmissionItem> => {
  const row = await db.practiceSubmission.create({
    data: {
      userId,
      questionId: input.questionId,
      code: input.code,
      language: input.language,
      status: input.status,
      runtimeMs: input.runtimeMs ?? null,
      memoryMb: input.memoryMb ?? null,
    },
  });
  return {
    id: row.id,
    questionId: row.questionId,
    code: row.code,
    language: row.language,
    status: row.status,
    runtimeMs: row.runtimeMs,
    memoryMb: row.memoryMb,
    createdAt: row.createdAt.toISOString(),
  };
};

export const getPracticeSubmissionsByQuestion = async (
  userId: string,
  questionId: number,
): Promise<PracticeSubmissionItem[]> => {
  const rows = await db.practiceSubmission.findMany({
    where: { userId, questionId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => ({
    id: row.id,
    questionId: row.questionId,
    code: row.code,
    language: row.language,
    status: row.status,
    runtimeMs: row.runtimeMs,
    memoryMb: row.memoryMb,
    createdAt: row.createdAt.toISOString(),
  }));
};
