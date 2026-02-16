import { createContext, runInContext, type Context } from 'node:vm';
import prisma from '@repo/db';
import type { SubmissionJobData, SubmissionJobResult } from '@repo/queue';
import { CODE_EXECUTION_TIMEOUT_MS } from '../config/env.config';

// ─── Types ───────────────────────────────────────────────────────────
type TestCase = {
  input: Record<string, unknown>;
  expected: unknown;
};

type ExecutionResult = {
  status: 'passed' | 'failed' | 'error';
  testsPassed: number;
  totalTests: number;
  errorMessage?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────

/** Deep-equal via JSON serialisation (order-sensitive for arrays, order-insensitive for primitives) */
const deepEqual = (actual: unknown, expected: unknown): boolean => {
  return JSON.stringify(actual) === JSON.stringify(expected);
};

/**
 * Extract the first user-defined function name from submitted code.
 * Supports both `function foo(…)` declarations and `const/let/var foo = (…) =>` expressions.
 */
const extractFunctionName = (code: string): string | null => {
  const funcDecl = code.match(/function\s+(\w+)\s*\(/);
  if (funcDecl) return funcDecl[1]!;

  const varDecl = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\(|function)/);
  if (varDecl) return varDecl[1]!;

  return null;
};

/**
 * Replace top-level `const` / `let` with `var` so that declarations
 * are added to the vm context object (const/let are script-scoped and
 * invisible to the host).
 */
const normalizeForVm = (code: string): string => {
  return code.replace(/^(const|let)\s+/gm, 'var ');
};

// ─── JavaScript Executor ─────────────────────────────────────────────

const executeJavaScript = (code: string, testcases: TestCase[]): ExecutionResult => {
  const totalTests = testcases.length;

  if (totalTests === 0) {
    return { status: 'passed', testsPassed: 0, totalTests: 0 };
  }

  const fnName = extractFunctionName(code);
  if (!fnName) {
    return {
      status: 'error',
      testsPassed: 0,
      totalTests,
      errorMessage: 'Could not detect a function definition in the submitted code',
    };
  }

  const normalizedCode = normalizeForVm(code);
  let testsPassed = 0;

  for (const tc of testcases) {
    try {
      const args = Object.values(tc.input);
      const argsJson = JSON.stringify(args);

      // Build a script that defines the user function, then invokes it.
      // `runInContext` returns the completion value of the last expression.
      const script = `
        ${normalizedCode}
        ${fnName}.apply(null, ${argsJson});
      `;

      const context: Context = createContext(Object.create(null));
      const output = runInContext(script, context, {
        timeout: CODE_EXECUTION_TIMEOUT_MS,
        filename: 'submission.js',
      });

      if (deepEqual(output, tc.expected)) {
        testsPassed++;
      }
    } catch {
      // Timeout, runtime error, etc. — count as failed test
      continue;
    }
  }

  return {
    status: testsPassed === totalTests ? 'passed' : 'failed',
    testsPassed,
    totalTests,
  };
};

// ─── Main Processor ──────────────────────────────────────────────────

export const processSubmission = async (
  data: SubmissionJobData,
): Promise<SubmissionJobResult> => {
  const { submissionId, userId, matchId, questionId, code, language } = data;

  try {
    // 1. Fetch the question and its test cases
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'error' },
      });

      return {
        submissionId,
        userId,
        matchId,
        questionId,
        status: 'error',
        testsPassed: 0,
        totalTests: 0,
        errorMessage: 'Question not found',
      };
    }

    const testcases = question.testcases as TestCase[];

    // 2. Execute code against test cases
    let result: ExecutionResult;

    if (language === 'javascript' || language === 'js') {
      result = executeJavaScript(code, testcases);
    } else {
      result = {
        status: 'error',
        testsPassed: 0,
        totalTests: testcases.length,
        errorMessage: `Unsupported language: ${language}`,
      };
    }

    // 3. Persist the result
    const dbStatus =
      result.status === 'passed'
        ? 'passed'
        : result.status === 'failed'
          ? 'failed'
          : 'error';

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: dbStatus },
    });

    return {
      submissionId,
      userId,
      matchId,
      questionId,
      status: result.status,
      testsPassed: result.testsPassed,
      totalTests: result.totalTests,
      errorMessage: result.errorMessage,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';

    // Best-effort status update
    try {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'error' },
      });
    } catch {
      // If even this fails, just log and move on
    }

    return {
      submissionId,
      userId,
      matchId,
      questionId,
      status: 'error',
      testsPassed: 0,
      totalTests: 0,
      errorMessage,
    };
  }
};
