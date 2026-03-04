import { describe, it, expect, vi } from 'vitest';

// Mock external dependencies that aren't available in the test environment
vi.mock('@repo/db', () => ({ default: {} }));
vi.mock('../config/env.config', () => ({ CODE_EXECUTION_TIMEOUT_MS: 5000 }));

import {
  deepEqual,
  extractFunctionName,
  normalizeForVm,
  executeJavaScript,
  type TestCase,
} from './submission.processor';

// ─── deepEqual ───────────────────────────────────────────────────────

describe('deepEqual', () => {
  it('should return true for identical primitives', () => {
    expect(deepEqual(42, 42)).toBe(true);
    expect(deepEqual('hello', 'hello')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
  });

  it('should return false for different primitives', () => {
    expect(deepEqual(42, 43)).toBe(false);
    expect(deepEqual('hello', 'world')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  it('should compare arrays element-by-element', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('should compare nested objects', () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it('should handle null and undefined', () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });
});

// ─── extractFunctionName ─────────────────────────────────────────────

describe('extractFunctionName', () => {
  it('should extract name from function declaration', () => {
    expect(extractFunctionName('function add(a, b) { return a + b; }')).toBe('add');
  });

  it('should extract name from const arrow function', () => {
    expect(extractFunctionName('const multiply = (a, b) => a * b;')).toBe('multiply');
  });

  it('should extract name from let arrow function', () => {
    expect(extractFunctionName('let subtract = (a, b) => a - b;')).toBe('subtract');
  });

  it('should extract name from var function expression', () => {
    expect(extractFunctionName('var divide = function(a, b) { return a / b; }')).toBe('divide');
  });

  it('should return null for code without a function definition', () => {
    expect(extractFunctionName('console.log("hello")')).toBe(null);
    expect(extractFunctionName('return 42;')).toBe(null);
  });

  it('should return the first function name when multiple exist', () => {
    const code = `
      function first(a) { return a; }
      function second(b) { return b; }
    `;
    expect(extractFunctionName(code)).toBe('first');
  });
});

// ─── normalizeForVm ──────────────────────────────────────────────────

describe('normalizeForVm', () => {
  it('should replace const with var', () => {
    expect(normalizeForVm('const x = 5;')).toBe('var x = 5;');
  });

  it('should replace let with var', () => {
    expect(normalizeForVm('let y = 10;')).toBe('var y = 10;');
  });

  it('should not modify var declarations', () => {
    expect(normalizeForVm('var z = 15;')).toBe('var z = 15;');
  });

  it('should replace multiple declarations', () => {
    const input = 'const a = 1;\nlet b = 2;\nvar c = 3;';
    const expected = 'var a = 1;\nvar b = 2;\nvar c = 3;';
    expect(normalizeForVm(input)).toBe(expected);
  });

  it('should not replace const/let inside strings or comments', () => {
    // Only replaces at the beginning of a line
    const input = '  const inner = 5;';
    // Indented const should not be replaced (not at start of line)
    expect(normalizeForVm(input)).toBe('  const inner = 5;');
  });
});

// ─── executeJavaScript ───────────────────────────────────────────────

describe('executeJavaScript', () => {
  it('should return passed for correct code', () => {
    const code = 'function add(a, b) { return a + b; }';
    const testcases: TestCase[] = [
      { input: { a: 1, b: 2 }, expected: 3 },
      { input: { a: -1, b: 1 }, expected: 0 },
    ];

    const result = executeJavaScript(code, testcases);
    expect(result.status).toBe('passed');
    expect(result.testsPassed).toBe(2);
    expect(result.totalTests).toBe(2);
  });

  it('should return failed for partially correct code', () => {
    const code = 'function add(a, b) { return a + b + 1; }';
    const testcases: TestCase[] = [
      { input: { a: 0, b: -1 }, expected: 0 },
      { input: { a: 1, b: 2 }, expected: 3 },
    ];

    const result = executeJavaScript(code, testcases);
    expect(result.status).toBe('failed');
    expect(result.testsPassed).toBe(1);
    expect(result.totalTests).toBe(2);
  });

  it('should return failed when all tests fail', () => {
    const code = 'function add(a, b) { return 0; }';
    const testcases: TestCase[] = [
      { input: { a: 1, b: 2 }, expected: 3 },
      { input: { a: 3, b: 4 }, expected: 7 },
    ];

    const result = executeJavaScript(code, testcases);
    expect(result.status).toBe('failed');
    expect(result.testsPassed).toBe(0);
    expect(result.totalTests).toBe(2);
  });

  it('should return error when no function is detected', () => {
    const code = 'console.log("hello")';
    const testcases: TestCase[] = [
      { input: { a: 1 }, expected: 1 },
    ];

    const result = executeJavaScript(code, testcases);
    expect(result.status).toBe('error');
    expect(result.errorMessage).toBeDefined();
  });

  it('should return passed with 0 tests when testcases is empty', () => {
    const code = 'function add(a, b) { return a + b; }';
    const result = executeJavaScript(code, []);
    expect(result.status).toBe('passed');
    expect(result.testsPassed).toBe(0);
    expect(result.totalTests).toBe(0);
  });

  it('should handle code with const/let declarations', () => {
    const code = 'const sum = (a, b) => a + b;';
    const testcases: TestCase[] = [
      { input: { a: 5, b: 3 }, expected: 8 },
    ];

    const result = executeJavaScript(code, testcases);
    expect(result.status).toBe('passed');
    expect(result.testsPassed).toBe(1);
  });

  it('should handle runtime errors gracefully (count as failed tests)', () => {
    const code = 'function fail(a) { throw new Error("boom"); }';
    const testcases: TestCase[] = [
      { input: { a: 1 }, expected: 1 },
    ];

    const result = executeJavaScript(code, testcases);
    expect(result.status).toBe('failed');
    expect(result.testsPassed).toBe(0);
    expect(result.totalTests).toBe(1);
  });

  it('should handle array return values', () => {
    const code = 'function reverse(arr) { return arr.slice().reverse(); }';
    const testcases: TestCase[] = [
      { input: { arr: [1, 2, 3] }, expected: [3, 2, 1] },
      { input: { arr: [] }, expected: [] },
    ];

    const result = executeJavaScript(code, testcases);
    expect(result.status).toBe('passed');
    expect(result.testsPassed).toBe(2);
  });
});
