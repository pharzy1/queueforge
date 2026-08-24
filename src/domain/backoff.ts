export function exponentialBackoffMs(attempt: number, baseMs = 1_000, capMs = 60_000): number {
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error('attempt must be a positive integer');
  return Math.min(baseMs * 2 ** (attempt - 1), capMs);
}
