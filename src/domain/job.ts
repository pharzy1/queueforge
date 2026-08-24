export const jobStatuses = ['scheduled', 'running', 'succeeded', 'retrying', 'failed'] as const;
export type JobStatus = (typeof jobStatuses)[number];

export type Job = {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  lockedBy: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateJob = Pick<Job, 'name' | 'payload' | 'priority' | 'maxAttempts' | 'runAt'>;

export interface JobRepository {
  create(input: CreateJob): Promise<Job>;
  list(limit: number): Promise<Job[]>;
  find(id: string): Promise<Job | null>;
  claimNext(workerId: string): Promise<Job | null>;
  markSucceeded(id: string): Promise<void>;
  markForRetry(id: string, error: string, nextRunAt: Date): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  cancel(id: string): Promise<boolean>;
  counts(): Promise<Record<JobStatus, number>>;
}
