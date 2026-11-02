// Test helper for the Student role (unit group: no PostgreSQL, no .env, no server.ts import).
// Uses the REAL createApp (guard, role, CSRF/Origin, transport rules, error handler) with a fake Pool
// and an in-memory session store. The fake Pool records every statement so tests can assert
// transaction shape, ownership parameters and "nothing was read/written when rejected".
// A forged session row is a test fixture only; it is NOT evidence that login works (AUTH-01).
import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import session from 'express-session';
import type { Pool, PoolClient } from 'pg';
import { createApp } from '../../src/app.js';

export const ORIGIN = 'http://localhost:3000';
export const SECRET = 'a'.repeat(40);
export const CSRF = 'c'.repeat(64);
export const ACCOUNT_A = '11111111-1111-4111-8111-111111111111';
export const STUDENT_A = '22222222-2222-4222-8222-222222222222';
export const ACCOUNT_B = '33333333-3333-4333-8333-333333333333';
export const STUDENT_B = '44444444-4444-4444-8444-444444444444';
export const ROOM_ID = '55555555-5555-4555-8555-555555555555';

export interface Call { via: 'pool' | 'client'; sql: string; params: unknown[] }
type Row = Record<string, unknown>;
export type Handler = (sql: string, params: unknown[]) => Row[] | undefined;

export interface FakeOptions {
  actorKind?: 'STUDENT' | 'STAFF';
  accountId?: string;
  studentId?: string | null;
  role?: 'SV' | 'BQL' | 'ADMIN';
  /** Account lookups: [guard lookup, in-transaction lookup]; true = locked at that time. */
  lockedAt?: boolean[];
  handler?: Handler;
}

export class FakePool {
  calls: Call[] = [];
  connects = 0;
  releases: Array<boolean | undefined> = [];
  private lookups = 0;
  constructor(private readonly options: FakeOptions = {}) {}

  private run(via: Call['via'], sql: string, params: unknown[] = []): { rows: Row[]; rowCount: number } {
    this.calls.push({ via, sql, params });
    if (/FROM (student|staff)_accounts/.test(sql)) {
      const locked = this.options.lockedAt?.[this.lookups] ?? false;
      this.lookups += 1;
      const staff = this.options.actorKind === 'STAFF';
      const row: Row = { id: this.options.accountId ?? ACCOUNT_A, role: this.options.role ?? (staff ? 'BQL' : 'SV'),
        is_locked: locked, session_version: 1 };
      if (!staff) row.student_id = this.options.studentId === undefined ? STUDENT_A : this.options.studentId;
      return { rows: [row], rowCount: 1 };
    }
    const rows = this.options.handler?.(sql, params) ?? [];
    return { rows, rowCount: rows.length };
  }

  query = async (sql: string, params?: unknown[]) => this.run('pool', sql, params);
  connect = async (): Promise<PoolClient> => {
    this.connects += 1;
    return {
      query: async (sql: string, params?: unknown[]) => this.run('client', sql, params),
      release: (destroy?: boolean) => { this.releases.push(destroy); },
    } as unknown as PoolClient;
  };

  /** Statements other than session/transaction control and the account lookup. */
  get domainCalls(): Call[] {
    return this.calls.filter(c => !/^(BEGIN|COMMIT|ROLLBACK)/.test(c.sql)
      && !/pg_advisory_xact_lock/.test(c.sql) && !/FROM (student|staff)_accounts/.test(c.sql));
  }
  get sqls(): string[] { return this.calls.map(c => c.sql); }
}

export interface Harness {
  pool: FakePool;
  base: string;
  cookie: string;
  close: () => Promise<void>;
}

export async function startApp(options: FakeOptions & { withSession?: boolean } = {}): Promise<Harness> {
  const pool = new FakePool(options);
  const store = new session.MemoryStore();
  const sid = 'student-test-session';
  const kind = options.actorKind ?? 'STUDENT';
  await new Promise<void>((resolve, reject) => store.set(sid, {
    cookie: { originalMaxAge: 1800000, expires: new Date(Date.now() + 1800000), httpOnly: true, secure: false, sameSite: 'lax' },
    identity: { actorKind: kind, accountId: options.accountId ?? ACCOUNT_A, sessionVersion: 1, lastSeenAt: Date.now() },
    csrfToken: CSRF,
  } as session.SessionData, error => error ? reject(error) : resolve()));
  const signature = createHmac('sha256', SECRET).update(sid).digest('base64').replace(/=+$/, '');
  const cookie = `dormflow.sid=${encodeURIComponent(`s:${sid}.${signature}`)}`;
  const app = createApp({ pool: pool as unknown as Pool, sessionSecret: SECRET, appOrigin: ORIGIN,
    secureCookies: false, sessionStore: store });
  // Mirrors the one-line change requested from the Shared owner (see controller.ts / handoff).
  app.locals.pool = pool;
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    pool, cookie, base: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

export async function withApp(options: FakeOptions & { withSession?: boolean }, work: (h: Harness) => Promise<void>): Promise<void> {
  const h = await startApp(options);
  try { await work(h); } finally { await h.close(); }
}

export interface Reply { status: number; body: any; contentType: string | null }

export async function get(h: Harness, path: string, opts: { cookie?: boolean } = {}): Promise<Reply> {
  const res = await fetch(`${h.base}${path}`, { headers: opts.cookie === false ? {} : { Cookie: h.cookie } });
  return { status: res.status, body: await res.json(), contentType: res.headers.get('content-type') };
}

export async function patch(h: Harness, path: string, body: unknown, opts: { origin?: string | null; csrf?: string | null; cookie?: boolean; raw?: boolean } = {}): Promise<Reply> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.cookie !== false) headers.Cookie = h.cookie;
  if (opts.origin !== null) headers.Origin = opts.origin ?? ORIGIN;
  if (opts.csrf !== null) headers['X-CSRF-Token'] = opts.csrf ?? CSRF;
  const res = await fetch(`${h.base}${path}`, { method: 'PATCH', headers, body: opts.raw ? String(body) : JSON.stringify(body) });
  return { status: res.status, body: await res.json(), contentType: res.headers.get('content-type') };
}

export function profileRow(overrides: Row = {}): Row {
  return {
    id: STUDENT_A, student_code: 'SV001', full_name: 'Sinh viên mẫu', gender: 'MALE', class_name: 'K29', faculty: 'CNTT',
    phone: '0900000000', email: null, date_of_birth: null, permanent_address: null,
    created_at: new Date('2026-10-30T03:00:00.000Z'), updated_at: new Date('2026-10-30T03:00:00.000Z'), ...overrides,
  };
}

export function roomRow(overrides: Row = {}): Row {
  return {
    id: ROOM_ID, building_id: '66666666-6666-4666-8666-666666666666', building_code: 'A', building_name: 'Tòa A', code: 'A101',
    capacity: 6, gender: 'MALE', fee_vnd: '1000000', status: 'ACTIVE', allocated_places: 5, available_places: 1,
    created_at: new Date('2026-10-30T03:00:00.000Z'), updated_at: new Date('2026-10-30T03:00:00.000Z'), ...overrides,
  };
}

/** Asserts the response carries no DB internals. */
export function assertNoLeak(text: string): void {
  if (/SELECT|UPDATE|student_profiles|pg_advisory|stack|at .*\.ts/i.test(text)) throw new Error(`response leaks internals: ${text}`);
}
