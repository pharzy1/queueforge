import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { registry } from '../infrastructure/metrics.js';
import type { JobService } from '../services/job-service.js';

type AppOptions = {
  afterSchedule?: () => Promise<void>;
  runWorker?: () => Promise<boolean>;
};

const createJobSchema = z.object({
  name: z.string().min(1).max(80),
  payload: z.record(z.unknown()).default({}),
  priority: z.number().int().min(0).max(100).default(0),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  runAt: z.string().datetime().optional(),
});

export async function configureApp(app: FastifyInstance, service: JobService, options: AppOptions = {}) {
  await app.register(cors, { origin: false });
  await app.register(fastifyStatic, { root: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public') });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/metrics', async (_request, reply) => reply.type(registry.contentType).send(await registry.metrics()));
  app.get('/api/jobs', async (request) => {
    const query = z.object({ limit: z.coerce.number().int().optional() }).parse(request.query);
    return service.list(query.limit);
  });
  app.get('/api/jobs/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const job = await service.get(id);
    return job ?? reply.code(404).send({ error: 'Job not found' });
  });
  app.post('/api/jobs', async (request, reply) => {
    const input = createJobSchema.parse(request.body);
    const job = await service.schedule({
      name: input.name, payload: input.payload, priority: input.priority,
      maxAttempts: input.maxAttempts, ...(input.runAt ? { runAt: new Date(input.runAt) } : {}),
    });
    await options.afterSchedule?.();
    return reply.code(201).send(job);
  });
  app.delete('/api/jobs/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return (await service.cancel(id)) ? reply.code(204).send() : reply.code(409).send({ error: 'Job cannot be cancelled' });
  });
  app.get('/api/stats', async () => service.counts());
  app.get('/api/internal/run-worker', async (request, reply) => {
    if (!process.env.CRON_SECRET || request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    return { processed: await options.runWorker?.() ?? false };
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) return reply.code(400).send({ error: 'Invalid request', details: error.flatten() });
    app.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });
  return app;
}

export async function buildApp(service: JobService, options: AppOptions = {}) {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });
  return configureApp(app, service, options);
}
