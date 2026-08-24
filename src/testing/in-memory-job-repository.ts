import { randomUUID } from 'node:crypto';
import type { CreateJob, Job, JobRepository, JobStatus } from '../domain/job.js';

export class InMemoryJobRepository implements JobRepository {
  readonly jobs = new Map<string, Job>();

  async create(input: CreateJob): Promise<Job> {
    const now = new Date();
    const job: Job = { id: randomUUID(), ...input, status: 'scheduled', attempts: 0, lockedBy: null, lastError: null, createdAt: now, updatedAt: now };
    this.jobs.set(job.id, job);
    return job;
  }
  async list(limit: number): Promise<Job[]> { return [...this.jobs.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit); }
  async find(id: string): Promise<Job | null> { return this.jobs.get(id) ?? null; }
  async claimNext(workerId: string): Promise<Job | null> {
    const now = Date.now();
    const job = [...this.jobs.values()]
      .filter((item) => ['scheduled', 'retrying'].includes(item.status) && item.runAt.getTime() <= now)
      .sort((a, b) => b.priority - a.priority || a.runAt.getTime() - b.runAt.getTime())[0];
    if (!job) return null;
    Object.assign(job, { status: 'running' as const, lockedBy: workerId, attempts: job.attempts + 1, updatedAt: new Date() });
    return { ...job };
  }
  async markSucceeded(id: string): Promise<void> { this.update(id, { status: 'succeeded', lockedBy: null }); }
  async markForRetry(id: string, lastError: string, runAt: Date): Promise<void> { this.update(id, { status: 'retrying', lastError, runAt, lockedBy: null }); }
  async markFailed(id: string, lastError: string): Promise<void> { this.update(id, { status: 'failed', lastError, lockedBy: null }); }
  async cancel(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || !['scheduled', 'retrying'].includes(job.status)) return false;
    this.update(id, { status: 'failed', lastError: 'Cancelled by user' }); return true;
  }
  async counts(): Promise<Record<JobStatus, number>> {
    const result = { scheduled: 0, running: 0, succeeded: 0, retrying: 0, failed: 0 };
    for (const job of this.jobs.values()) result[job.status] += 1;
    return result;
  }
  private update(id: string, patch: Partial<Job>): void {
    const job = this.jobs.get(id); if (!job) throw new Error('Job not found');
    Object.assign(job, patch, { updatedAt: new Date() });
  }
}
