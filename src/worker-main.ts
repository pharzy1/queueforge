import pino from 'pino';
import { createPool } from './infrastructure/database.js';
import { jobsProcessed } from './infrastructure/metrics.js';
import { PostgresJobRepository } from './infrastructure/postgres-job-repository.js';
import { Worker } from './services/worker.js';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const pool = createPool();
const repository = new PostgresJobRepository(pool);
const handlers = new Map([
  ['send-email', async () => { await new Promise((resolve) => setTimeout(resolve, 250)); }],
  ['generate-report', async () => { await new Promise((resolve) => setTimeout(resolve, 500)); }],
]);
const worker = new Worker(repository, process.env.WORKER_ID ?? `worker-${process.pid}`, handlers, (event) => {
  jobsProcessed.inc({ status: event.type });
  logger.info({ jobId: event.job.id, jobName: event.job.name, status: event.type, error: event.error?.message }, 'job processed');
});
const interval = Number(process.env.POLL_INTERVAL_MS ?? 1000);
let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });
while (!stopping) {
  const processed = await worker.runOnce();
  if (!processed) await new Promise((resolve) => setTimeout(resolve, interval));
}
await pool.end();
