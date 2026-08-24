import { exponentialBackoffMs } from '../domain/backoff.js';
import type { Job, JobRepository } from '../domain/job.js';

export type JobHandler = (job: Job) => Promise<void>;
export type WorkerEvent = { type: 'succeeded' | 'retrying' | 'failed'; job: Job; error?: Error };

export class Worker {
  constructor(
    private readonly repository: JobRepository,
    private readonly workerId: string,
    private readonly handlers: ReadonlyMap<string, JobHandler>,
    private readonly onEvent: (event: WorkerEvent) => void = () => undefined,
  ) {}

  async runOnce(): Promise<boolean> {
    const job = await this.repository.claimNext(this.workerId);
    if (!job) return false;

    try {
      const handler = this.handlers.get(job.name);
      if (!handler) throw new Error(`No handler registered for ${job.name}`);
      await handler(job);
      await this.repository.markSucceeded(job.id);
      this.onEvent({ type: 'succeeded', job });
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      if (job.attempts < job.maxAttempts) {
        const nextRunAt = new Date(Date.now() + exponentialBackoffMs(job.attempts));
        await this.repository.markForRetry(job.id, error.message, nextRunAt);
        this.onEvent({ type: 'retrying', job, error });
      } else {
        await this.repository.markFailed(job.id, error.message);
        this.onEvent({ type: 'failed', job, error });
      }
    }
    return true;
  }
}
