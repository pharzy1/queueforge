import { describe, expect, it } from 'vitest';
import { exponentialBackoffMs } from './backoff.js';

describe('exponentialBackoffMs', () => {
  it('doubles delay for each subsequent attempt', () => {
    expect([1, 2, 3, 4].map((attempt) => exponentialBackoffMs(attempt))).toEqual([1000, 2000, 4000, 8000]);
  });
  it('caps runaway delay', () => expect(exponentialBackoffMs(20)).toBe(60_000));
  it('rejects invalid attempts', () => expect(() => exponentialBackoffMs(0)).toThrow());
});
