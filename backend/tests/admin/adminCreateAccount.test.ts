import assert from 'node:assert/strict';
import test from 'node:test';
import argon2 from 'argon2';
import { ADMIN, PROFILE_ID, assertAuthMatrix, assertNoSecrets, businessCalls, call, startApp, type Handler } from './helpers.js';

const created = new Date('2026-11-01T01:02:03Z');

/** Minimal in-memory store emulating the rows the repository reads/writes. */
function store(options: { profileExists?: boolean; profileHasAccount?: boolean; usernames?: string[]; raceOn?: 'student' | 'staff' } = {}) {
  const inserted: unknown[][] = [];
  const handler: Handler = (sql, params) => {
    if (sql.includes('FROM student_profiles p WHERE p.id = $1')) {
      return { rows: options.profileExists === false ? [] : [{ id: params[0], has_account: !!options.profileHasAccount }] };
    }
    if (sql.includes('SELECT 1 FROM staff_accounts WHERE username = $1')) return { rows: (options.usernames ?? []).includes(params[0] as string) ? [{}] : [] };
    if (sql.includes('INSERT INTO student_accounts')) {
      if (options.raceOn === 'student') throw Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'student_accounts_student_id_key' });
      inserted.push(params);
      return { rows: [{ id: '99999999-9999-4999-8999-999999999999', actor_kind: 'STUDENT', role: 'SV', identifier: 'SV001', display_name: 'Sinh viên mẫu', student_id: params[0], is_locked: false, created_at: created, updated_at: created }] };
    }
    if (sql.includes('INSERT INTO staff_accounts')) {
      if (options.raceOn === 'staff') throw Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'staff_accounts_username_key' });
      inserted.push(params);
      return { rows: [{ id: '88888888-8888-4888-8888-888888888888', actor_kind: 'STAFF', role: params[2], identifier: params[0], display_name: params[1], student_id: null, is_locked: false, created_at: created, updated_at: created }] };
    }
    throw new Error(`unexpected SQL: ${sql}`);
  };
  return { handler, inserted };
}

const studentBody = { accountType: 'STUDENT', studentId: PROFILE_ID, role: 'SV', password: '  DemoOnly#2026  ' };
const staffBody = { accountType: 'STAFF', username: '  BQL.Demo ', displayName: '  Ban quản lý mẫu ', role: 'BQL', password: 'DemoOnly#2026' };

test('adminCreateAccount STUDENT: 201, Argon2id hash of the untrimmed password, lock before reads, no secrets', async () => {
  const s = store();
  const h = await startApp(ADMIN, s.handler);
  try {
    const res = await call(h, 'POST', '/accounts', studentBody);
    assert.equal(res.status, 201);
    assert.deepEqual(res.json.data, { id: '99999999-9999-4999-8999-999999999999', actorKind: 'STUDENT', role: 'SV', identifier: 'SV001',
      displayName: 'Sinh viên mẫu', studentId: PROFILE_ID, isLocked: false, createdAt: created.toISOString(), updatedAt: created.toISOString() });
    assertNoSecrets(res.text);
    const [studentId, hash] = s.inserted[0] as [string, string];
    assert.equal(studentId, PROFILE_ID);
    assert.match(hash, /^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    assert.ok(await argon2.verify(hash, '  DemoOnly#2026  '), 'password is not trimmed');
    assert.ok(!(await argon2.verify(hash, 'DemoOnly#2026')));
    const lock = h.db.calls.indexOf('SELECT pg_advisory_xact_lock(724006, 1)');
    assert.equal(h.db.calls[lock - 1], 'BEGIN ISOLATION LEVEL READ COMMITTED');
    assert.match(h.db.calls[lock + 1], /session_version FROM staff_accounts/, 'actor re-read right after the lock');
    assert.ok(h.db.calls.indexOf(businessCalls(h.db)[0]) > lock);
    assert.equal(h.db.calls.at(-1), 'COMMIT');
  } finally { await h.close(); }
});

test('adminCreateAccount STAFF: username trim+lowercase, displayName trimmed, BQL and ADMIN roles', async () => {
  const s = store();
  const h = await startApp(ADMIN, s.handler);
  try {
    const bql = await call(h, 'POST', '/accounts', staffBody);
    assert.equal(bql.status, 201);
    assert.equal(bql.json.data.identifier, 'bql.demo');
    assert.equal(bql.json.data.displayName, 'Ban quản lý mẫu');
    assert.equal(bql.json.data.studentId, null);
    assert.deepEqual((s.inserted[0] as unknown[]).slice(0, 3), ['bql.demo', 'Ban quản lý mẫu', 'BQL']);
    const admin = await call(h, 'POST', '/accounts', { ...staffBody, username: 'admin2', role: 'ADMIN' });
    assert.equal(admin.status, 201);
    assert.equal(admin.json.data.role, 'ADMIN');
    assertNoSecrets(admin.text);
  } finally { await h.close(); }
});

test('adminCreateAccount: missing profile 404, profile with account 409, duplicate username 409, unique races map to the same 409', async () => {
  const cases: Array<[Parameters<typeof store>[0], object, number, string]> = [
    [{ profileExists: false }, studentBody, 404, 'NOT_FOUND'],
    [{ profileHasAccount: true }, studentBody, 409, 'ACCOUNT_ALREADY_EXISTS'],
    [{ raceOn: 'student' }, studentBody, 409, 'ACCOUNT_ALREADY_EXISTS'],
    [{ usernames: ['bql.demo'] }, staffBody, 409, 'DUPLICATE_USERNAME'],
    [{ raceOn: 'staff' }, staffBody, 409, 'DUPLICATE_USERNAME'],
  ];
  for (const [options, body, status, code] of cases) {
    const s = store(options);
    const h = await startApp(ADMIN, s.handler);
    try {
      const res = await call(h, 'POST', '/accounts', body);
      assert.equal(res.status, status, code);
      assert.equal(res.json.error.code, code);
      assert.equal(h.db.calls.at(-1), 'ROLLBACK', 'failed mutation leaves no partial write');
      assert.equal(s.inserted.length, 0);
    } finally { await h.close(); }
  }
});

test('adminCreateAccount: strict variants, password bounds in code points, no query, 422 before transaction', async () => {
  const h = await startApp(ADMIN, () => { throw new Error('must not query'); });
  try {
    const bad: unknown[] = [
      {}, { accountType: 'ADMIN' }, { ...studentBody, role: 'BQL' }, { ...studentBody, username: 'x' }, { ...studentBody, studentId: 'nope' },
      { ...studentBody, password: 'short7!' }, { ...studentBody, password: '😀'.repeat(129) }, { ...studentBody, password: 12345678 },
      { ...studentBody, isLocked: true }, { ...staffBody, role: 'SV' }, { ...staffBody, username: 'ab' }, { ...staffBody, username: 'Ab c' },
      { ...staffBody, displayName: '   ' }, { ...staffBody, displayName: 'x'.repeat(151) }, { ...staffBody, studentId: PROFILE_ID },
      { ...staffBody, displayName: null },
    ];
    for (const body of bad) {
      const res = await call(h, 'POST', '/accounts', body);
      assert.equal(res.status, 422, JSON.stringify(body).slice(0, 80));
      assert.equal(res.json.error.code, 'VALIDATION_ERROR');
      assertNoSecrets(JSON.stringify(res.json.error.details ?? []).replace(/"field":"password"/g, ''));
    }
    assert.equal((await call(h, 'POST', '/accounts?page=1', studentBody)).status, 422);
    assert.deepEqual(h.db.calls.filter(sql => sql.startsWith('BEGIN')), []);
  } finally { await h.close(); }
  // 8 and 128 code points are accepted (boundary) — reach the fake store.
  const s = store();
  const ok = await startApp(ADMIN, s.handler);
  try {
    assert.equal((await call(ok, 'POST', '/accounts', { ...studentBody, password: '12345678' })).status, 201);
    assert.equal((await call(ok, 'POST', '/accounts', { ...studentBody, password: '😀'.repeat(128) })).status, 201);
  } finally { await ok.close(); }
});

test('adminCreateAccount: CSRF/Origin required; actor locked while waiting for the lock gets 401 and nothing is written', async () => {
  const s = store();
  const h = await startApp(ADMIN, s.handler);
  try {
    assert.equal((await call(h, 'POST', '/accounts', studentBody, { 'X-CSRF-Token': 'wrong' })).json.error.code, 'CSRF_INVALID');
    assert.equal((await call(h, 'POST', '/accounts', studentBody, { Origin: 'http://evil.test' })).json.error.code, 'ORIGIN_FORBIDDEN');
    let lookups = 0;
    const original = h.db.pool.connect.bind(h.db.pool);
    (h.db.pool as unknown as { connect: () => Promise<unknown> }).connect = async () => {
      const client = await original() as { query: (sql: string, params?: unknown[]) => Promise<unknown> };
      const inner = client.query;
      return { ...client, query: async (sql: string, params?: unknown[]) => {
        if (sql.includes('session_version FROM staff_accounts')) { lookups++; h.actor.isLocked = true; }
        return inner(sql, params);
      } };
    };
    const res = await call(h, 'POST', '/accounts', studentBody);
    assert.equal(res.status, 401);
    assert.equal(res.json.error.code, 'ACCOUNT_LOCKED');
    assert.equal(lookups, 1);
    assert.equal(s.inserted.length, 0);
  } finally { await h.close(); }
});

test('adminCreateAccount: auth matrix', async () => {
  await assertAuthMatrix('POST', '/accounts', studentBody);
});
