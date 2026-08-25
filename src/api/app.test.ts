import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { InMemoryJobRepository } from '../testing/in-memory-job-repository.js';
import { JobService } from '../services/job-service.js';
import { buildApp } from './app.js';

describe('jobs API', () => {
  let app: FastifyInstance;
  beforeEach(async () => { app = await buildApp(new JobService(new InMemoryJobRepository())); });
  afterEach(async () => app.close());
  it('exposes a health check', async () => { const response = await app.inject({ method: 'GET', url: '/health' }); expect(response.statusCode).toBe(200); expect(response.json().status).toBe('ok'); });
  it('creates and lists a validated job', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/jobs', payload: { name: 'send-email', payload: { to: 'a@b.com' }, priority: 80, maxAttempts: 4 } });
    expect(created.statusCode).toBe(201); expect(created.json().status).toBe('scheduled');
    const list = await app.inject({ method: 'GET', url: '/api/jobs' }); expect(list.json()).toHaveLength(1);
  });
  it('returns useful validation errors', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/jobs', payload: { name: '', priority: 999 } });
    expect(response.statusCode).toBe(400); expect(response.json().error).toBe('Invalid request');
  });
  it('returns 404 for a missing job', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/jobs/00000000-0000-4000-8000-000000000000' });
    expect(response.statusCode).toBe(404);
  });
  it('runs the deployment adapter after accepting a job', async () => {
    const afterSchedule = vi.fn();
    await app.close();
    app = await buildApp(new JobService(new InMemoryJobRepository()), { afterSchedule });
    await app.inject({ method: 'POST', url: '/api/jobs', payload: { name: 'send-email' } });
    expect(afterSchedule).toHaveBeenCalledOnce();
  });
  it('protects the scheduled worker endpoint', async () => {
    const previousSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-secret';
    const unauthorized = await app.inject({ method: 'GET', url: '/api/internal/run-worker' });
    expect(unauthorized.statusCode).toBe(401);
    const runWorker = vi.fn(async () => true);
    await app.close();
    app = await buildApp(new JobService(new InMemoryJobRepository()), { runWorker });
    const authorized = await app.inject({ method: 'GET', url: '/api/internal/run-worker', headers: { authorization: 'Bearer test-secret' } });
    expect(authorized.json()).toEqual({ processed: true });
    expect(runWorker).toHaveBeenCalledOnce();
    if (previousSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousSecret;
  });
});
