# Benchmark methodology

QueueForge includes a small, reproducible load generator for the job-creation path. It records throughput, failures, and p50/p95/p99/max client-observed latency. Results are printed as JSON so runs can be compared without hand-editing numbers.

## Run it

Start the complete application, then run:

```bash
BENCHMARK_REQUESTS=1000 BENCHMARK_CONCURRENCY=50 pnpm benchmark
```

Use `BENCHMARK_URL` when testing a deployed environment. Run a warm-up first, record the machine or cloud service size, repeat at least three times, and report the median run. Monitor database CPU, connections, and queue depth during each run.

## Reporting rules

- Do not quote numbers from a laptop as production performance.
- Include the commit SHA, environment, request count, concurrency, and date.
- Report failed requests alongside latency; excluding failures makes the result misleading.
- Keep the raw JSON result in `docs/benchmarks/` and explain any meaningful variance.
- Test the worker throughput separately from API enqueue throughput; they measure different bottlenecks.

## Recorded production verification

The first production sample is stored in [`benchmarks/vercel-neon-2026-08-25.json`](benchmarks/vercel-neon-2026-08-25.json). After two warm-up requests, three runs each sent 20 requests at concurrency 2. All 60 measured requests succeeded. The median run recorded 1.86 requests/second, 1,023.60 ms p50 latency, and 1,109.03 ms p95 latency.

This is a correctness-oriented serverless sample, not a capacity claim: every request writes to Neon and synchronously executes the 500 ms `generate-report` demonstration handler. A dedicated-worker deployment must be measured separately before claiming enqueue or worker throughput at scale.
