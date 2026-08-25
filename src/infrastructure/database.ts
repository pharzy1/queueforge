import pg from 'pg';

export function createPool(databaseUrl = process.env.DATABASE_URL): pg.Pool {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  return new pg.Pool({ connectionString: databaseUrl, max: process.env.VERCEL ? 1 : 10, idleTimeoutMillis: 30_000 });
}
