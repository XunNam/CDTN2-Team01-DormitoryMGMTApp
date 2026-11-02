// PostgreSQL fixtures for ADMIN integration tests. Needs a disposable test DB where SQL/schema.sql was
// applied once (SQL/README.md). The runner sets DATABASE_URL from TEST_DATABASE_URL; nothing here creates,
// resets or migrates the database. Every fixture row carries a random tag and is deleted in cleanup().
//
// Focused ADMIN tests seed a real PostgreSQL session so they can isolate account behavior.
// Login itself is exercised through HTTP in integration/shared/auth.test.ts and tests/system/.
// The guard still re-reads account/role/lock/session_version on every request.
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import argon2 from 'argon2';
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import type { Pool, PoolClient } from 'pg';
import { createApp } from '../../../src/app.js';
import { createPool } from '../../../src/shared/db/pool.js';
import type { ActorKind } from '../../../src/shared/auth/types.js';

export const ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';
const SECRET = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 ? process.env.SESSION_SECRET : randomBytes(32).toString('hex');

export interface Env {
  pool: Pool; store: session.Store; base: string; tag: string;
  created: { profiles: string[]; students: string[]; staff: string[]; sids: string[] };
  close: () => Promise<void>;
}

export async function withLock<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    await client.query('SELECT pg_advisory_xact_lock(724006, 1)');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

/** Fixture-only hash: real Argon2id format (schema CHECK), cheaper cost to keep the suite fast. */
export const fixtureHash = (password: string) => argon2.hash(password, { type: argon2.argon2id, memoryCost: 4096, timeCost: 1, parallelism: 1 });

export async function setup(): Promise<Env> {
  const url = process.env.DATABASE_URL;
  assert.ok(url, 'DATABASE_URL missing: run `npm run test:integration` with TEST_DATABASE_URL (see .env.test.example).');
  const pool = createPool(url);
  const PgStore = connectPgSimple(session);
  const store = new PgStore({ pool, tableName: 'sessions', createTableIfMissing: false });
  const app = createApp({ pool, sessionSecret: SECRET, appOrigin: ORIGIN, secureCookies: false, sessionStore: store });
  // Regression: the app factory must expose its real Pool without fixture patching.
  assert.equal(app.locals.pool, pool, 'createApp must wire its single Pool');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  const created = { profiles: [] as string[], students: [] as string[], staff: [] as string[], sids: [] as string[] };
  const env: Env = {
    pool, store, base: `http://127.0.0.1:${port}/api/v1`, tag: `it${randomBytes(4).toString('hex')}`, created,
    close: async () => {
      await cleanup(env);
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      (store as unknown as { close?: () => void }).close?.();
      await pool.end();
    },
  };
  return env;
}

/** Deletes only rows created by this file's fixtures or API calls (tracked ids / tag). */
export async function cleanup(env: Env): Promise<void> {
  const { tag } = env;
  await withLock(env.pool, async client => {
    await client.query(`DELETE FROM student_accounts WHERE id = ANY($1::uuid[]) OR student_id IN (SELECT id FROM student_profiles WHERE student_code LIKE $2)`,
      [env.created.students, `${tag.toUpperCase()}%`]);
    await client.query('DELETE FROM staff_accounts WHERE id = ANY($1::uuid[]) OR username LIKE $2', [env.created.staff, `${tag}%`]);
    await client.query('DELETE FROM student_profiles WHERE id = ANY($1::uuid[]) OR student_code LIKE $2', [env.created.profiles, `${tag.toUpperCase()}%`]);
  });
  await env.pool.query('DELETE FROM sessions WHERE sid = ANY($1)', [env.created.sids]);
}

export async function seedProfile(env: Env, suffix: string, fullName = `Sinh viên ${env.tag} ${suffix}`): Promise<{ id: string; code: string }> {
  const code = `${env.tag}${suffix}`.toUpperCase();
  const { rows } = await withLock(env.pool, client => client.query<{ id: string }>(
    `INSERT INTO student_profiles (student_code, full_name, gender, class_name, faculty) VALUES ($1, $2, 'MALE', 'Lớp IT', 'Khoa IT') RETURNING id`,
    [code, fullName]));
  env.created.profiles.push(rows[0].id);
  return { id: rows[0].id, code };
}

export async function seedStaff(env: Env, suffix: string, role: 'BQL' | 'ADMIN', isLocked = false): Promise<{ id: string; username: string }> {
  const username = `${env.tag}.${suffix}`;
  const hash = await fixtureHash('Fixture#Only1');
  const { rows } = await withLock(env.pool, client => client.query<{ id: string }>(
    `INSERT INTO staff_accounts (username, display_name, role, password_hash, is_locked) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [username, `Nhân sự ${env.tag} ${suffix}`, role, hash, isLocked]));
  env.created.staff.push(rows[0].id);
  return { id: rows[0].id, username };
}

export async function seedStudentAccount(env: Env, profileId: string, isLocked = false): Promise<string> {
  const hash = await fixtureHash('Fixture#Only1');
  const { rows } = await withLock(env.pool, client => client.query<{ id: string }>(
    `INSERT INTO student_accounts (student_id, password_hash, is_locked) VALUES ($1, $2, $3) RETURNING id`, [profileId, hash, isLocked]));
  env.created.students.push(rows[0].id);
  return rows[0].id;
}

export interface Session { cookie: string; csrf: string }

/** Writes a session into the real PostgreSQL store for an existing account (see AUTH NOTE). */
export async function seedSession(env: Env, actorKind: ActorKind, accountId: string): Promise<Session> {
  const sid = `it-${randomBytes(16).toString('hex')}`;
  const csrf = randomBytes(32).toString('hex');
  await new Promise<void>((resolve, reject) => env.store.set(sid, {
    cookie: { originalMaxAge: 1800000, expires: new Date(Date.now() + 1800000), httpOnly: true, secure: false, sameSite: 'lax' } as session.Cookie,
    identity: { actorKind, accountId, sessionVersion: 1, lastSeenAt: Date.now() },
    csrfToken: csrf,
  }, error => error ? reject(error) : resolve()));
  env.created.sids.push(sid);
  const signature = createHmac('sha256', SECRET).update(sid).digest('base64').replace(/=+$/, '');
  return { cookie: `dormflow.sid=${encodeURIComponent(`s:${sid}.${signature}`)}`, csrf };
}

export async function api(env: Env, s: Session | null, method: string, path: string, body?: unknown): Promise<{ status: number; json: any; text: string }> {
  const headers: Record<string, string> = s ? { Cookie: s.cookie } : {};
  if (method !== 'GET') Object.assign(headers, { 'Content-Type': 'application/json', Origin: ORIGIN, ...(s ? { 'X-CSRF-Token': s.csrf } : {}) });
  const res = await fetch(`${env.base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null, text };
}

export const ACCOUNT_KEYS = ['actorKind', 'createdAt', 'displayName', 'id', 'identifier', 'isLocked', 'role', 'studentId', 'updatedAt'];
export function assertNoSecrets(text: string): void {
  assert.doesNotMatch(text, /password|argon2|hash|session_?version/i);
}
