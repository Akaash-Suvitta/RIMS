/**
 * Migration runner — reads all *.sql files from apps/api/migrations/ in
 * lexicographic order and applies them to the database.
 *
 * Tracks applied migrations in a `schema_migrations` table.
 * Safe to run multiple times (idempotent).
 *
 * Usage:  ts-node src/db/migrate.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '../lib/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedMigrations(client: pg.PoolClient): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY id',
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function run(): Promise<void> {
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await appliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // lexicographic — relies on numeric prefix (001_, 002_, …)

    let ran = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  skip  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      console.log(`  apply ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Migration failed — ${file}: ${message}`);
      }
    }

    if (ran === 0) {
      console.log('[migrate] Nothing to apply — database is up to date.');
    } else {
      console.log(`[migrate] Applied ${ran} migration(s).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err: unknown) => {
  console.error('[migrate] Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
