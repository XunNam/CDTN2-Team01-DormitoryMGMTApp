import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Pool, PoolClient } from 'pg';
import express from 'express';
import session from 'express-session';
import { createApp } from '../../src/app.js';
import { resolveActor, requireRole } from '../../src/shared/auth/guard.js';
import { AppError, errorHandler } from '../../src/shared/http/errors.js';
import { withBusinessTransaction } from '../../src/shared/db/transaction.js';
import type { SessionIdentity } from '../../src/shared/auth/types.js';
import { createHmac } from 'node:crypto';
import { request as httpRequest } from 'node:http';

const id = '11111111-1111-4111-8111-111111111111';
const identity = (): SessionIdentity => ({ actorKind: 'STUDENT', accountId: id, sessionVersion: 1, lastSeenAt: Date.now() });
function fakeDb(row: object | undefined): Pool {
  return { query: async () => ({ rows: row ? [row] : [] }) } as unknown as Pool;
}

async function withHttp(app: express.Express, work: (base: string) => Promise<void>): Promise<void> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  try { await work(`http://127.0.0.1:${port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('health is scaffold liveness only and does not create a session cookie', async () => {
  const app = createApp({ pool: fakeDb(undefined), sessionSecret: 'a'.repeat(40), appOrigin: 'http://localhost:3000', secureCookies: false, sessionStore: new session.MemoryStore() });
  await withHttp(app, async base => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { data: { status: 'ok', scope: 'backend-scaffold' } });
    assert.equal(res.headers.get('set-cookie'), null);
    const protectedRes = await fetch(`${base}/api/v1/admin/accounts`);
    assert.equal(protectedRes.status, 401);
    assert.equal((await protectedRes.json() as { error: { code: string } }).error.code, 'AUTH_REQUIRED');
    const csrfRes = await fetch(`${base}/api/v1/auth/csrf`);
    assert.equal(csrfRes.status, 200);
    assert.match((await csrfRes.json() as { data: { csrfToken: string } }).data.csrfToken, /^[0-9a-f]{64}$/);
  });
});

test('unsafe requests reject missing/wrong Origin and missing synchronizer token', async () => {
  const app = createApp({ pool: fakeDb(undefined), sessionSecret: 'a'.repeat(40), appOrigin: 'http://localhost:3000', secureCookies: false, sessionStore: new session.MemoryStore() });
  await withHttp(app, async base => {
    for (const headers of [{}, { Origin: 'http://evil.test' }, { Origin: 'http://localhost:3000' }] as Record<string, string>[]) {
      const res = await fetch(`${base}/api/v1/admin/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: '{}' });
      assert.equal(res.status, 403);
      assert.equal((await res.json() as { error: { code: string } }).error.code, 'Origin' in headers && headers.Origin === 'http://localhost:3000' ? 'CSRF_INVALID' : 'ORIGIN_FORBIDDEN');
    }
  });
});

test('fresh lookup rejects lock, stale session version, missing account and cross-namespace role', async () => {
  for (const row of [undefined,
    { id, role: 'SV', is_locked: true, session_version: 1, student_id: id },
    { id, role: 'SV', is_locked: false, session_version: 2, student_id: id },
    { id, role: 'ADMIN', is_locked: false, session_version: 1, student_id: id },
  ]) {
    await assert.rejects(resolveActor(fakeDb(row), identity()), error => error instanceof AppError && error.status === 401);
  }
  const actor = await resolveActor(fakeDb({ id, role: 'SV', is_locked: false, session_version: 1, student_id: id }), identity());
  assert.equal(actor.role, 'SV');
  assert.equal(actor.studentId, id);
  const expired = { ...identity(), lastSeenAt: Date.now() - 30 * 60 * 1000 };
  await assert.rejects(resolveActor(fakeDb(undefined), expired), AppError);
});

test('transport errors keep specified status and precede Origin/auth checks', async () => {
  const app = createApp({ pool: fakeDb(undefined), sessionSecret: 'a'.repeat(40), appOrigin: 'http://localhost:3000', secureCookies: false, sessionStore: new session.MemoryStore() });
  await withHttp(app, async base => {
    for (const [body, type, status, code] of [
      ['{broken', 'application/json', 400, 'INVALID_JSON'],
      ['[]', 'application/json', 422, 'VALIDATION_ERROR'],
      ['null', 'application/json', 422, 'VALIDATION_ERROR'],
      ['{}', 'text/plain', 415, 'UNSUPPORTED_MEDIA_TYPE'],
      [JSON.stringify({ q: 'x'.repeat(33 * 1024) }), 'application/json', 413, 'PAYLOAD_TOO_LARGE'],
    ] as const) {
      const res = await fetch(`${base}/api/v1/admin/accounts`, { method: 'POST', headers: { 'Content-Type': type }, body });
      assert.equal(res.status, status);
      assert.equal((await res.json() as { error: { code: string } }).error.code, code);
    }
  });
});

test('role middleware denies Admin implicit BQL rights', async () => {
  const app = express();
  app.use((_req, res, next) => { res.locals.actor = { actorKind: 'STAFF', accountId: id, role: 'ADMIN', sessionVersion: 1 }; next(); });
  app.get('/management', requireRole('BQL'), (_req, res) => res.json({ data: 'must not be reached' }));
  app.use(errorHandler);
  await withHttp(app, async base => { const res = await fetch(`${base}/management`); assert.equal(res.status, 403); });
});

test('unexpected errors do not expose SQL, stack or password hashes', async () => {
  const app = express();
  app.get('/error', () => { throw new Error('password_hash=$argon2 SQL SELECT * FROM secret'); });
  app.use(errorHandler);
  await withHttp(app, async base => {
    const res = await fetch(`${base}/error`); assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: { code: 'INTERNAL_ERROR', message: 'Không thể xử lý yêu cầu.' } });
  });
});

test('transaction lock precedes fresh actor lookup; failure rolls back and releases client', async () => {
  const calls: string[] = [];
  const client = {
    query: async (sql: string) => { calls.push(sql); return { rows: sql.includes('student_accounts') ? [{ id, role: 'SV', is_locked: false, session_version: 1, student_id: id }] : [] }; },
    release: () => { calls.push('release'); },
  } as unknown as PoolClient;
  const pool = { connect: async () => client } as unknown as Pool;
  const original = new AppError(409, 'STATE_CONFLICT', 'Trạng thái không còn phù hợp.');
  await assert.rejects(withBusinessTransaction(pool, identity(), async () => { calls.push('work'); throw original; }), error => error === original);
  assert.equal(calls[0], 'BEGIN ISOLATION LEVEL READ COMMITTED');
  assert.equal(calls[1], 'SELECT pg_advisory_xact_lock(724006, 1)');
  assert.match(calls[2], /student_accounts/);
  assert.deepEqual(calls.slice(-3), ['work', 'ROLLBACK', 'release']);
});

test('store touch cannot revive an actor whose explicit idle deadline has passed', async () => {
  const secret = 'a'.repeat(40);
  const store = new session.MemoryStore();
  const sid = 'seeded-expired-actor';
  const oldLastSeen = Date.now() - 31 * 60 * 1000;
  await new Promise<void>((resolve, reject) => store.set(sid, {
    cookie: { originalMaxAge: 1800000, expires: new Date(Date.now() + 1800000), httpOnly: true, secure: false, sameSite: 'lax' },
    identity: { ...identity(), lastSeenAt: oldLastSeen },
    csrfToken: 'a'.repeat(64),
  }, error => error ? reject(error) : resolve()));
  const signature = createHmac('sha256', secret).update(sid).digest('base64').replace(/=+$/, '');
  const cookie = `dormflow.sid=${encodeURIComponent(`s:${sid}.${signature}`)}`;
  const app = createApp({ pool: fakeDb(undefined), sessionSecret: secret, appOrigin: 'http://localhost:3000', secureCookies: false, sessionStore: store });
  await withHttp(app, async base => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${base}/api/v1/student/profile`, { headers: { Cookie: cookie } });
      assert.equal(res.status, 401);
      assert.equal((await res.json() as { error: { code: string } }).error.code, 'SESSION_EXPIRED');
    }
  });
  const persisted = await new Promise<session.SessionData | null>((resolve, reject) => store.get(sid, (error, value) => error ? reject(error) : resolve(value ?? null)));
  assert.equal(persisted?.identity?.lastSeenAt, oldLastSeen);
});

test('pool acquisition and BEGIN failure never call work; unusable connection is discarded', async () => {
  const connectionError = Object.assign(new Error('connection failed'), { code: 'ECONNREFUSED' });
  const rejectedPool = { connect: async () => { throw connectionError; } } as unknown as Pool;
  await assert.rejects(withBusinessTransaction(rejectedPool, identity(), async () => { assert.fail('work must not run'); }), error => error === connectionError);
  const calls: string[] = [];
  const client = {
    query: async (sql: string) => { calls.push(sql); throw connectionError; },
    release: (destroy: boolean) => calls.push(`release:${destroy}`),
  } as unknown as PoolClient;
  await assert.rejects(withBusinessTransaction({ connect: async () => client } as unknown as Pool, identity(), async () => { assert.fail('work must not run'); }), error => error === connectionError);
  assert.deepEqual(calls, ['BEGIN ISOLATION LEVEL READ COMMITTED', 'release:true']);
});

test('rollback failure discards client but preserves original error', async () => {
  let destroyed = false;
  const original = new AppError(409, 'INVALID_STATE', 'Trạng thái không hợp lệ.');
  const client = {
    query: async (sql: string) => {
      if (sql === 'ROLLBACK') throw new Error('rollback connection failed');
      return { rows: sql.includes('student_accounts') ? [{ id, role: 'SV', is_locked: false, session_version: 1, student_id: id }] : [] };
    },
    release: (destroy: boolean) => { destroyed = destroy; },
  } as unknown as PoolClient;
  await assert.rejects(withBusinessTransaction({ connect: async () => client } as unknown as Pool, identity(), async () => { throw original; }), error => error === original);
  assert.equal(destroyed, true);
});

test('PostgreSQL lock timeout maps to safe503 without leaking raw database error', async () => {
  const app = express();
  app.get('/locked', () => { throw Object.assign(new Error('raw query and table name'), { code: '55P03' }); });
  app.use(errorHandler);
  await withHttp(app, async base => {
    const res = await fetch(`${base}/locked`); assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: { code: 'SERVICE_UNAVAILABLE', message: 'Dịch vụ tạm thời không sẵn sàng.' } });
  });
});

test('GET requests with a body fail422 before auth while ordinary GET remains unchanged', async () => {
  const app = createApp({ pool: fakeDb(undefined), sessionSecret: 'a'.repeat(40), appOrigin: 'http://localhost:3000', secureCookies: false, sessionStore: new session.MemoryStore() });
  await withHttp(app, async base => {
    for (const [body, type] of [['{}', 'application/json'], ['text', 'text/plain']] as const) {
      const response = await new Promise<{ status: number | undefined; body: string }>((resolve, reject) => {
        const req = httpRequest(`${base}/api/v1/student/profile`, { method: 'GET', headers: { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body) } }, res => {
          let data = ''; res.setEncoding('utf8');
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject); req.end(body);
      });
      assert.equal(response.status, 422);
      assert.equal((JSON.parse(response.body) as { error: { code: string } }).error.code, 'VALIDATION_ERROR');
    }
    assert.equal((await fetch(`${base}/api/v1/student/profile`)).status, 401);
  });
});
