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

No benchmark result is checked in yet because the repository has not been run against a controlled PostgreSQL environment. This is intentional: the portfolio should contain measured evidence, not invented numbers.
