import { buildApp } from './api/app.js';
import { createPool } from './infrastructure/database.js';
import { PostgresJobRepository } from './infrastructure/postgres-job-repository.js';
import { JobService } from './services/job-service.js';

const pool = createPool();
const app = await buildApp(new JobService(new PostgresJobRepository(pool)));
const port = Number(process.env.PORT ?? 3000);

const shutdown = async () => { await app.close(); await pool.end(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
await app.listen({ port, host: '0.0.0.0' });
