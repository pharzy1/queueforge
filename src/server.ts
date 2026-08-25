import { buildApp } from './api/app.js';
import { createPool } from './infrastructure/database.js';
import { PostgresJobRepository } from './infrastructure/postgres-job-repository.js';
import { JobService } from './services/job-service.js';
import { Worker } from './services/worker.js';

const pool = createPool();
const repository = new PostgresJobRepository(pool);
const handlers = new Map([
  ['send-email', async () => { await new Promise((resolve) => setTimeout(resolve, 250)); }],
  ['generate-report', async () => { await new Promise((resolve) => setTimeout(resolve, 500)); }],
]);
const worker = new Worker(repository, `api-${process.pid}`, handlers);
const app = await buildApp(new JobService(repository), {
  ...(process.env.VERCEL ? { afterSchedule: async () => { await worker.runOnce(); } } : {}),
  runWorker: () => worker.runOnce(),
});
const port = Number(process.env.PORT ?? 3000);

const shutdown = async () => { await app.close(); await pool.end(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
if (!process.env.VERCEL) await app.listen({ port, host: '0.0.0.0' });

export default app;
