import type { Pool, PoolClient, QueryResultRow } from 'pg';
import type { CreateJob, Job, JobRepository, JobStatus } from '../domain/job.js';

type JobRow = QueryResultRow & {
  id: string; name: string; payload: Record<string, unknown>; status: JobStatus;
  priority: number; attempts: number; max_attempts: number; run_at: Date;
  locked_by: string | null; last_error: string | null; created_at: Date; updated_at: Date;
};

const map = (row: JobRow): Job => ({
  id: row.id, name: row.name, payload: row.payload, status: row.status,
  priority: row.priority, attempts: row.attempts, maxAttempts: row.max_attempts,
  runAt: row.run_at, lockedBy: row.locked_by, lastError: row.last_error,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

export class PostgresJobRepository implements JobRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateJob): Promise<Job> {
    const result = await this.pool.query<JobRow>(
      `INSERT INTO jobs (name, payload, priority, max_attempts, run_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.name, input.payload, input.priority, input.maxAttempts, input.runAt],
    );
    return map(result.rows[0]!);
  }

  async list(limit: number): Promise<Job[]> {
    const result = await this.pool.query<JobRow>('SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1', [limit]);
    return result.rows.map(map);
  }

  async find(id: string): Promise<Job | null> {
    const result = await this.pool.query<JobRow>('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }

  async claimNext(workerId: string): Promise<Job | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const selected = await client.query<JobRow>(
        `SELECT * FROM jobs
         WHERE status IN ('scheduled', 'retrying') AND run_at <= NOW()
         ORDER BY priority DESC, run_at ASC
         FOR UPDATE SKIP LOCKED LIMIT 1`,
      );
      if (!selected.rows[0]) { await client.query('COMMIT'); return null; }
      const updated = await this.markRunning(client, selected.rows[0].id, workerId);
      await client.query('COMMIT');
      return map(updated);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  private async markRunning(client: PoolClient, id: string, workerId: string): Promise<JobRow> {
    const result = await client.query<JobRow>(
      `UPDATE jobs SET status='running', locked_by=$2, attempts=attempts+1, updated_at=NOW()
       WHERE id=$1 RETURNING *`, [id, workerId],
    );
    return result.rows[0]!;
  }

  async markSucceeded(id: string): Promise<void> { await this.transition(id, 'succeeded', null, null); }
  async markFailed(id: string, error: string): Promise<void> { await this.transition(id, 'failed', error, null); }
  async markForRetry(id: string, error: string, nextRunAt: Date): Promise<void> {
    await this.transition(id, 'retrying', error, nextRunAt);
  }

  private async transition(id: string, status: JobStatus, error: string | null, runAt: Date | null): Promise<void> {
    await this.pool.query(
      `UPDATE jobs SET status=$2, last_error=$3, run_at=COALESCE($4, run_at),
       locked_by=NULL, updated_at=NOW() WHERE id=$1`, [id, status, error, runAt],
    );
  }

  async cancel(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE jobs SET status='failed', last_error='Cancelled by user', updated_at=NOW()
       WHERE id=$1 AND status IN ('scheduled','retrying')`, [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async counts(): Promise<Record<JobStatus, number>> {
    const result = await this.pool.query<{ status: JobStatus; count: string }>('SELECT status, COUNT(*) count FROM jobs GROUP BY status');
    const counts = { scheduled: 0, running: 0, succeeded: 0, retrying: 0, failed: 0 };
    for (const row of result.rows) counts[row.status] = Number(row.count);
    return counts;
  }
}
