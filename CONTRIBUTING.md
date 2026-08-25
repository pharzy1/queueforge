# Contributing

Thanks for improving QueueForge. Open an issue before a large change so its behavior and trade-offs can be agreed on first.

1. Create a focused branch from `main`.
2. Run `pnpm install` and `pnpm check`.
3. Add tests for observable behavior and document architectural trade-offs.
4. Open a pull request with the problem, approach, validation evidence, and risks.

Keep commits scoped and use imperative messages such as `fix: reclaim expired worker leases`. Never commit credentials, `.env` files, generated coverage output, or benchmark claims without raw results.
