import { performance } from 'node:perf_hooks';

type Result = { ok: boolean; latencyMs: number };

const target = process.env.BENCHMARK_URL ?? 'http://localhost:3000';
const requests = positiveInteger(process.env.BENCHMARK_REQUESTS, 500);
const concurrency = positiveInteger(process.env.BENCHMARK_CONCURRENCY, 25);

function positiveInteger(raw: string | undefined, fallback: number): number {
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < 1) throw new Error('Benchmark values must be positive integers');
  return value;
}

async function schedule(index: number): Promise<Result> {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${target}/api/jobs`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'generate-report', payload: { benchmark: true, index }, priority: index % 101, maxAttempts: 3 }),
    });
    return { ok: response.status === 201, latencyMs: performance.now() - startedAt };
  } catch { return { ok: false, latencyMs: performance.now() - startedAt }; }
}

async function main(): Promise<void> {
  const results: Result[] = new Array(requests);
  let cursor = 0;
  const startedAt = performance.now();
  await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, async () => {
    while (cursor < requests) { const index = cursor++; results[index] = await schedule(index); }
  }));
  const elapsedMs = performance.now() - startedAt;
  const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
  const successful = results.filter((result) => result.ok).length;
  const percentile = (value: number) => latencies[Math.min(Math.ceil(value * latencies.length) - 1, latencies.length - 1)] ?? 0;
  console.log(JSON.stringify({
    target, requests, concurrency, successful, failed: requests - successful,
    durationSeconds: round(elapsedMs / 1000), requestsPerSecond: round(requests / (elapsedMs / 1000)),
    latencyMs: { p50: round(percentile(0.5)), p95: round(percentile(0.95)), p99: round(percentile(0.99)), max: round(latencies.at(-1) ?? 0) },
    measuredAt: new Date().toISOString(),
  }, null, 2));
  if (successful !== requests) process.exitCode = 1;
}

const round = (value: number): number => Math.round(value * 100) / 100;
await main();
