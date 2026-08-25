# Portfolio and internship launch checklist

QueueForge supplies the engineering evidence. Complete these human-owned steps before placing it on a résumé.

## Publish this repository

1. Keep repository links and the live deployment URL current in `README.md`.
2. Protect the public `queueforge` repository's `main` branch by requiring CI after its first successful workflow run.
3. Deploy the API, worker, and PostgreSQL to a provider of your choice. Add the real URL near the top of the README.
4. Replace `docs/dashboard.svg` with a fresh screenshot from the deployed application if its appearance changes.
5. Pin the repository on your GitHub profile and write a one-sentence repository description.

## Make the evidence credible

- Open issues for the planned extensions; implement them through focused branches and pull requests.
- Ask a peer to review at least one PR and respond to the feedback in the code—not just in comments.
- Run a repeatable concurrency benchmark before quoting throughput or latency. Commit the benchmark code and results.
- Keep CI green. Add release tags and concise release notes for meaningful milestones.
- Never claim users, scale, collaboration, or deployment that did not happen.

## Close the remaining gaps through open source

Building this repository cannot substitute for contributing to someone else's shared codebase. Choose one TypeScript, Node.js, PostgreSQL, or developer-tools project you actually use. Read `CONTRIBUTING.md`, reproduce one labeled issue, comment with your findings, then submit a small tested change. Aim for 3–5 substantive merged PRs over several months.

Track each contribution with: issue link, maintainer discussion, technical decision, tests added, PR link, and outcome. Good first contributions include a regression test for an existing bug, documentation confirmed against the current API, CI reliability improvements, and small reproducible fixes.

## GitHub profile

- Add a professional photo, short technical headline, location/time zone, résumé link, and contact method.
- Create a profile README with a two-sentence introduction, current focus, selected projects, and technologies backed by project evidence.
- Pin QueueForge plus one project from coursework, research, or a team. Polish that second repository to the same documentation standard.
- Remove abandoned tutorial forks from the pinned section; preserve them privately if useful.

## Suggested résumé bullets

Use only the strongest truthful version:

- Built a concurrent TypeScript job scheduler with Fastify and PostgreSQL, using row-level locking to prevent duplicate execution across workers and exponential backoff for bounded retries.
- Designed a constrained relational schema and priority index, exposed validated REST APIs and Prometheus metrics, and enforced linting, strict type checks, coverage thresholds, and container builds in CI.
- Deployed the containerized API, worker, and database to **[provider]** and measured **[real p95 latency]** under **[real tested concurrency]** using a committed benchmark.

## Eight-week execution plan

| Week | Verifiable outcome |
|---|---|
| 1 | Publish QueueForge, make CI green, open architecture issues |
| 2 | Deploy it and add live link plus screenshot |
| 3 | Add worker leases/heartbeats through a reviewed PR |
| 4 | Build and run a concurrency benchmark; publish honest results |
| 5 | Polish a second existing repository and pin both |
| 6 | Reproduce an issue in a selected open-source project and propose a fix |
| 7 | Submit a tested open-source PR and address review feedback |
| 8 | Update résumé/profile, request two reviews, and begin targeted applications |
