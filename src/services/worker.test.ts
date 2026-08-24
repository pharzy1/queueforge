import { describe, expect, it, vi } from 'vitest';
import { InMemoryJobRepository } from '../testing/in-memory-job-repository.js';
import { Worker } from './worker.js';

const schedule = (repository: InMemoryJobRepository, overrides = {}) => repository.create({
  name: 'send-email', payload: {}, priority: 10, maxAttempts: 3, runAt: new Date(0), ...overrides,
});

describe('Worker', () => {
  it('processes a job and records success', async () => {
    const repository = new InMemoryJobRepository(); const job = await schedule(repository); const handler = vi.fn();
    const worker = new Worker(repository, 'worker-1', new Map([['send-email', handler]]));
    expect(await worker.runOnce()).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
    expect((await repository.find(job.id))?.status).toBe('succeeded');
  });
  it('schedules a retry after a transient failure', async () => {
    const repository = new InMemoryJobRepository(); const job = await schedule(repository);
    const worker = new Worker(repository, 'worker-1', new Map([['send-email', async () => { throw new Error('timeout'); }]]));
    await worker.runOnce(); const saved = await repository.find(job.id);
    expect(saved?.status).toBe('retrying'); expect(saved?.lastError).toBe('timeout'); expect(saved?.attempts).toBe(1);
  });
  it('dead-letters a job after its final attempt', async () => {
    const repository = new InMemoryJobRepository(); const job = await schedule(repository, { maxAttempts: 1 });
    const worker = new Worker(repository, 'worker-1', new Map());
    await worker.runOnce(); expect((await repository.find(job.id))?.status).toBe('failed');
  });
  it('claims higher-priority work first', async () => {
    const repository = new InMemoryJobRepository(); await schedule(repository, { priority: 1 }); const high = await schedule(repository, { priority: 99 });
    const claimed = await repository.claimNext('worker-1'); expect(claimed?.id).toBe(high.id);
  });
});
