import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { coverage: { provider: 'v8', reporter: ['text', 'html'], thresholds: { lines: 75, functions: 75, statements: 75, branches: 70 }, include: ['src/**/*.ts'], exclude: ['src/**/*.test.ts', 'src/domain/job.ts', 'src/server.ts', 'src/worker-main.ts', 'src/infrastructure/**'] } } });
