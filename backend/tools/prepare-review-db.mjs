import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import argon2 from 'argon2';
import { existsSync } from 'node:fs';

// Explicit local test setup only. Never reset/drop schemas or touch public fixture data.
const schema = process.argv[2];
if (!schema || !/^codex_review_[a-z0-9_]+$/.test(schema) || schema.length > 63) {
  throw new Error('Supply a NEW schema named codex_review_<unique_suffix>.');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required; load the ignored .env file.');
if (existsSync(new URL('../.env.test',import.meta.url))) throw new Error('Local .env.test already exists. Preserve or rename it before preparing another test namespace.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis:5000 });
try {
  const existing = await pool.query('SELECT 1 FROM pg_namespace WHERE nspname=$1', [schema]);
  if (existing.rowCount) throw new Error('Test schema already exists. Choose a new suffix; no data was reset.');
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const url = new URL(process.env.DATABASE_URL);
  // Exclude public entirely so missing test objects cannot fall through to the application data.
  url.searchParams.set('options', `-c search_path=${schema},pg_catalog`);
  const testPool = new pg.Pool({ connectionString: url.toString() });
  try {
    const client = await testPool.connect();
    let bqlId;
    try {
      await client.query(await readFile(new URL('../../SQL/schema.sql', import.meta.url), 'utf8'));
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
      await client.query('SELECT pg_advisory_xact_lock(724006,1)');
      const hash = await argon2.hash(randomBytes(32), { type: argon2.argon2id, memoryCost:65536, timeCost:3, parallelism:1, hashLength:64 });
      const result = await client.query("INSERT INTO staff_accounts(username,display_name,role,password_hash) VALUES ('review.bql','Nhân sự kiểm thử','BQL',$1) RETURNING id",[hash]);
      bqlId = result.rows[0].id;
      await client.query('COMMIT');
    } finally { client.release(); }
    await writeFile(new URL('../.env.test', import.meta.url), `TEST_DATABASE_URL=${url}\nMANAGEMENT_TEST_ACCOUNT_ID=${bqlId}\n`, { flag:'wx' });
    console.log(`Prepared isolated schema ${schema}; wrote ignored backend/.env.test. No public data changed.`);
  } finally { await testPool.end(); }
} finally { await pool.end(); }
