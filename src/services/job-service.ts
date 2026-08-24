import { randomUUID } from 'node:crypto';
import type { CreateJob, Job, JobRepository, JobStatus } from '../domain/job.js';

export class JobService {
  constructor(private readonly repository: JobRepository) {}

  schedule(input: Omit<CreateJob, 'runAt'> & { runAt?: Date }): Promise<Job> {
    return this.repository.create({ ...input, runAt: input.runAt ?? new Date() });
  }

  list(limit = 50): Promise<Job[]> {
    return this.repository.list(Math.min(Math.max(limit, 1), 100));
  }

  get(id: string): Promise<Job | null> { return this.repository.find(id); }
  cancel(id: string): Promise<boolean> { return this.repository.cancel(id); }
  counts(): Promise<Record<JobStatus, number>> { return this.repository.counts(); }

  static examplePayload(): Record<string, unknown> {
    return { requestId: randomUUID(), recipient: 'recruiter@example.com', template: 'welcome' };
  }
}
