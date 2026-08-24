# ADR 001: Use PostgreSQL as the durable queue

- Status: Accepted
- Date: 2026-08-24

## Context

QueueForge needs durable scheduling, priority ordering, retries, and safe concurrent claims. A separate broker would add operational complexity to a portfolio-sized deployment.

## Decision

Store jobs in PostgreSQL and claim them in a short transaction using `SELECT … FOR UPDATE SKIP LOCKED`. Order candidates by priority descending and scheduled time ascending. A partial index covers only runnable states.

## Consequences

We gain transactional consistency, a small operational footprint, and inspectable state. We accept polling latency, extra database writes, and lower maximum throughput than a dedicated broker. Workers must keep the claim transaction short. A production version should add heartbeats and lease expiry so jobs held by terminated workers can be reclaimed.
