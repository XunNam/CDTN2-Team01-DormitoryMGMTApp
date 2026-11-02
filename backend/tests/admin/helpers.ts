// Shared fixtures for ADMIN unit tests (no PostgreSQL). Not a *.test.ts file, so the runner does not
// execute it directly. Fakes only check routing, validation, envelope and call order; they do not prove
// SQL, constraints, triggers or concurrency (see tests/integration/admin).
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Pool, PoolClient } from 'pg';
import session from 'express-session';
import { createApp } from '../../src/app.js';
import type { ActorKind, Role } from '../../src/shared/auth/types.js';

export const ORIGIN = 'http://localhost:3000';
export const CSRF = 'c'.repeat(64);
export const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const OTHER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const PROFILE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SECRET = 's'.repeat(40);

export interface ActorState { actorKind: ActorKind; role: Role; isLocked: boolean }
export type Handler = (sql: string, params: unknown[]) => { rows: unknown[]; rowCount?: number } | Promise<{ rows: unknown[]; rowCount?: number }>;

export interface FakeDb { pool: Pool; calls: string[]; released: boolean[] }

/** Actor lookups (shared guard / transaction re-read) answer from `actor`; everything else goes to `handler`. */
export function fakeDb(actor: ActorState, handler: Handler = () => ({ rows: [] })): FakeDb {
  const calls: string[] = [];
  const released: boolean[] = [];
  const actorRow = () => ({ id: ADMIN_ID, role: actor.role, is_locked: actor.isLocked, session_version: 1,
    ...(actor.actorKind === 'STUDENT' ? { student_id: PROFILE_ID } : {}) });
  const answer = async (sql: string, params: unknown[] = []) => {
    calls.push(sql.replace(/\s+/g, ' ').trim());
    if (/^(BEGIN|COMMIT|ROLLBACK)|pg_advisory_xact_lock/.test(sql.trim())) return { rows: [] };
    if (/session_version(, student_id)? FROM (student|staff)_accounts WHERE id = \$1/.test(sql)) {
      const matchesKind = sql.includes(actor.actorKind === 'STUDENT' ? 'student_accounts' : 'staff_accounts');
      return { rows: matchesKind && params[0] === ADMIN_ID ? [actorRow()] : [] };
    }
    return handler(sql, params);
  };
  const client = { query: answer, release: (destroy?: boolean) => { released.push(!!destroy); } } as unknown as PoolClient;
  const pool = { query: answer, connect: async () => client } as unknown as Pool;
  return { pool, calls, released };
}

export interface Harness { base: string; cookie: string; db: FakeDb; actor: ActorState; close: () => Promise<void> }

/** createApp with a seeded MemoryStore session; the app factory supplies the actual Pool. */
export async function startApp(initial: ActorState, handler?: Handler, options: { loggedIn?: boolean } = {}): Promise<Harness> {
  const actor = { ...initial }; // tests may mutate lock state; never share the module constant
  const store = new session.MemoryStore();
  const sid = `admin-test-${Math.random().toString(36).slice(2)}`;
  if (options.loggedIn !== false) {
    await new Promise<void>((resolve, reject) => store.set(sid, {
      cookie: { originalMaxAge: 1800000, expires: new Date(Date.now() + 1800000), httpOnly: true, secure: false, sameSite: 'lax' },
      identity: { actorKind: actor.actorKind, accountId: ADMIN_ID, sessionVersion: 1, lastSeenAt: Date.now() },
      csrfToken: CSRF,
    }, error => error ? reject(error) : resolve()));
  }
  const db = fakeDb(actor, handler);
  const app = createApp({ pool: db.pool, sessionSecret: SECRET, appOrigin: ORIGIN, secureCookies: false, sessionStore: store });
  assert.equal(app.locals.pool, db.pool, 'createApp must wire Pool');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  const signature = createHmac('sha256', SECRET).update(sid).digest('base64').replace(/=+$/, '');
  return {
    base: `http://127.0.0.1:${port}/api/v1/admin`, cookie: `dormflow.sid=${encodeURIComponent(`s:${sid}.${signature}`)}`, db, actor,
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

export const ADMIN: ActorState = { actorKind: 'STAFF', role: 'ADMIN', isLocked: false };

export async function call(h: Harness, method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}):
  Promise<{ status: number; json: any; text: string }> {
  const headers: Record<string, string> = { Cookie: h.cookie, ...extraHeaders };
  if (method !== 'GET') Object.assign(headers, { 'Content-Type': 'application/json', Origin: ORIGIN, 'X-CSRF-Token': CSRF }, extraHeaders);
  const res = await fetch(`${h.base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null, text };
}

export function businessCalls(db: FakeDb): string[] {
  return db.calls.filter(sql => !/^(BEGIN|COMMIT|ROLLBACK)|pg_advisory_xact_lock|session_version(, student_id)? FROM/.test(sql));
}

/** Standard auth matrix for any ADMIN operation: no session, locked, BQL, SV — and no business SQL runs. */
export async function assertAuthMatrix(method: string, path: string, body?: unknown): Promise<void> {
  const cases: Array<[ActorState, boolean, number, string]> = [
    // Mutations check Origin/CSRF before authentication (Shared order), so no session -> 403 CSRF_INVALID.
    [ADMIN, false, method === 'GET' ? 401 : 403, method === 'GET' ? 'AUTH_REQUIRED' : 'CSRF_INVALID'],
    [{ ...ADMIN, isLocked: true }, true, 401, 'ACCOUNT_LOCKED'],
    [{ actorKind: 'STAFF', role: 'BQL', isLocked: false }, true, 403, 'FORBIDDEN'],
    [{ actorKind: 'STUDENT', role: 'SV', isLocked: false }, true, 403, 'FORBIDDEN'],
  ];
  for (const [actor, loggedIn, status, code] of cases) {
    const h = await startApp(actor, () => { throw new Error('business SQL must not run'); }, { loggedIn });
    try {
      const res = await call(h, method, path, body);
      assert.equal(res.status, status, `${actor.role}/${loggedIn}`);
      assert.equal(res.json.error.code, code);
      assert.deepEqual(businessCalls(h.db), []);
    } finally { await h.close(); }
  }
}

export function assertNoSecrets(text: string): void {
  assert.doesNotMatch(text, /password|argon2|hash|session_version|sessionVersion/i);
}

export function accountRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: OTHER_ID, actor_kind: 'STAFF', role: 'BQL', identifier: 'bql.demo', display_name: 'Ban quản lý mẫu',
    student_id: null, is_locked: false, created_at: new Date('2026-10-30T03:00:00Z'), updated_at: new Date('2026-10-30T03:00:00Z'),
    ...overrides,
  };
}
