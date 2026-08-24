import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });
export const jobsProcessed = new Counter({ name: 'queueforge_jobs_processed_total', help: 'Processed jobs', labelNames: ['status'], registers: [registry] });
export const jobDuration = new Histogram({ name: 'queueforge_job_duration_seconds', help: 'Job processing time', labelNames: ['name'], registers: [registry] });
export const queueDepth = new Gauge({ name: 'queueforge_queue_depth', help: 'Jobs waiting to run', registers: [registry] });
