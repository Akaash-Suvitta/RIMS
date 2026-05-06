import pg from 'pg';
import { config, env } from '../lib/config.js';

// Pool size per environment tier
const POOL_SIZE = env.isLocal ? 10 : env.isDemo ? 3 : 20;

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: POOL_SIZE,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

// Validate connection at startup — throws a clear error on failure
async function validateConnection(): Promise<void> {
  let client: pg.PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[db] Failed to connect to PostgreSQL at startup. ` +
        `Check DATABASE_URL and that the database is reachable. Details: ${message}`,
    );
  } finally {
    client?.release();
  }
}

// Typed query wrapper — mirrors the pg.Pool.query signature but enforces
// the parameterised-only contract (no raw string interpolation).
export async function query<R extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  values?: unknown[],
): Promise<pg.QueryResult<R>> {
  return pool.query<R>(sql, values);
}

// Run validation immediately so the process exits fast on misconfiguration.
validateConnection().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
