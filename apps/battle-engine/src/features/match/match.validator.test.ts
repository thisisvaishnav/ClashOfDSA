import { describe, it, expect } from 'vitest';
import {
  joinQueueSchema,
  leaveQueueSchema,
  submitCodeSchema,
  readySchema,
  matchHistoryQuerySchema,
  matchIdParamSchema,
} from './match.validator';

describe('joinQueueSchema', () => {
  it('should accept a valid userId', () => {
    const result = joinQueueSchema.safeParse({ userId: 'user-123' });
    expect(result.success).toBe(true);
  });

  it('should reject an empty userId', () => {
    const result = joinQueueSchema.safeParse({ userId: '' });
    expect(result.success).toBe(false);
  });

  it('should reject a missing userId', () => {
    const result = joinQueueSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('leaveQueueSchema', () => {
  it('should accept a valid userId', () => {
    const result = leaveQueueSchema.safeParse({ userId: 'user-456' });
    expect(result.success).toBe(true);
  });

  it('should reject an empty userId', () => {
    const result = leaveQueueSchema.safeParse({ userId: '' });
    expect(result.success).toBe(false);
  });
});

describe('submitCodeSchema', () => {
  it('should accept valid submission data', () => {
    const result = submitCodeSchema.safeParse({
      matchId: 'match-1',
      questionId: 1,
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
    });
    expect(result.success).toBe(true);
  });

  it('should reject a missing matchId', () => {
    const result = submitCodeSchema.safeParse({
      questionId: 1,
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
    });
    expect(result.success).toBe(false);
  });

  it('should reject a non-positive questionId', () => {
    const result = submitCodeSchema.safeParse({
      matchId: 'match-1',
      questionId: 0,
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
    });
    expect(result.success).toBe(false);
  });

  it('should reject a negative questionId', () => {
    const result = submitCodeSchema.safeParse({
      matchId: 'match-1',
      questionId: -5,
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
    });
    expect(result.success).toBe(false);
  });

  it('should reject a non-integer questionId', () => {
    const result = submitCodeSchema.safeParse({
      matchId: 'match-1',
      questionId: 1.5,
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty code', () => {
    const result = submitCodeSchema.safeParse({
      matchId: 'match-1',
      questionId: 1,
      code: '',
      language: 'javascript',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty language', () => {
    const result = submitCodeSchema.safeParse({
      matchId: 'match-1',
      questionId: 1,
      code: 'function add(a, b) { return a + b; }',
      language: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('readySchema', () => {
  it('should accept valid matchId and userId', () => {
    const result = readySchema.safeParse({
      matchId: 'match-1',
      userId: 'user-1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject an empty matchId', () => {
    const result = readySchema.safeParse({
      matchId: '',
      userId: 'user-1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject an empty userId', () => {
    const result = readySchema.safeParse({
      matchId: 'match-1',
      userId: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('matchHistoryQuerySchema', () => {
  it('should use defaults when no values provided', () => {
    const result = matchHistoryQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it('should coerce string values to numbers', () => {
    const result = matchHistoryQuerySchema.safeParse({ page: '2', limit: '20' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should reject limit above 50', () => {
    const result = matchHistoryQuerySchema.safeParse({ page: 1, limit: 51 });
    expect(result.success).toBe(false);
  });

  it('should reject non-positive page', () => {
    const result = matchHistoryQuerySchema.safeParse({ page: 0, limit: 10 });
    expect(result.success).toBe(false);
  });
});

describe('matchIdParamSchema', () => {
  it('should accept a valid matchId', () => {
    const result = matchIdParamSchema.safeParse({ matchId: 'abc-123' });
    expect(result.success).toBe(true);
  });

  it('should reject an empty matchId', () => {
    const result = matchIdParamSchema.safeParse({ matchId: '' });
    expect(result.success).toBe(false);
  });
});
