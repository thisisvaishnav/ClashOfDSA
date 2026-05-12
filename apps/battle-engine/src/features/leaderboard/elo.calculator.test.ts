import { describe, it, expect } from 'vitest';
import { calculateEloChange, type EloOutcome } from './elo.calculator';

describe('calculateEloChange', () => {
  it('should increase winner rating and decrease loser rating on a win', () => {
    const result = calculateEloChange(1200, 1200, 'win');
    expect(result.ratingA).toBeGreaterThan(1200);
    expect(result.ratingB).toBeLessThan(1200);
  });

  it('should decrease loser rating and increase winner rating on a loss', () => {
    const result = calculateEloChange(1200, 1200, 'loss');
    expect(result.ratingA).toBeLessThan(1200);
    expect(result.ratingB).toBeGreaterThan(1200);
  });

  it('should not change ratings on a draw between equal players', () => {
    const result = calculateEloChange(1200, 1200, 'draw');
    expect(result.ratingA).toBe(1200);
    expect(result.ratingB).toBe(1200);
  });

  it('should award exactly +16/-16 for equal-rated win (K=32)', () => {
    // With equal ratings, expected score = 0.5, so delta = 32 * (1 - 0.5) = 16
    const result = calculateEloChange(1200, 1200, 'win');
    expect(result.ratingA).toBe(1216);
    expect(result.ratingB).toBe(1184);
  });

  it('should award fewer points when the higher-rated player wins', () => {
    const result = calculateEloChange(1400, 1000, 'win');
    // Higher rated player expected to win, so gain is smaller
    expect(result.ratingA - 1400).toBeLessThan(16);
    expect(result.ratingA).toBeGreaterThan(1400);
    expect(result.ratingB).toBeLessThan(1000);
  });

  it('should award more points when the lower-rated player wins (upset)', () => {
    const result = calculateEloChange(1000, 1400, 'win');
    // Lower-rated player wins — surprise, so gain is larger
    expect(result.ratingA - 1000).toBeGreaterThan(16);
    expect(result.ratingA).toBeGreaterThan(1000);
    expect(result.ratingB).toBeLessThan(1400);
  });

  it('should be zero-sum (total rating points conserved)', () => {
    const outcomes: EloOutcome[] = ['win', 'loss', 'draw'];
    for (const outcome of outcomes) {
      const result = calculateEloChange(1300, 1100, outcome);
      expect(result.ratingA + result.ratingB).toBeCloseTo(1300 + 1100, 0);
    }
  });

  it('should return integer ratings (rounded)', () => {
    const result = calculateEloChange(1237, 1153, 'win');
    expect(Number.isInteger(result.ratingA)).toBe(true);
    expect(Number.isInteger(result.ratingB)).toBe(true);
  });
});
