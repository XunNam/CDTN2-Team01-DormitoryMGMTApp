import assert from 'node:assert/strict';
import test from 'node:test';
import { ACCOUNT_B, STUDENT_A, STUDENT_B, assertNoLeak, get, profileRow, withApp } from './helpers.js';

const PROFILE_KEYS = ['className', 'createdAt', 'dateOfBirth', 'email', 'faculty', 'fullName', 'gender', 'id',
  'permanentAddress', 'phone', 'studentCode', 'updatedAt'];

test('studentGetProfile returns the exact StudentProfile DTO for the session student', async () => {
  await withApp({ handler: sql => (/FROM student_profiles/.test(sql) ? [profileRow()] : undefined) }, async h => {
    const res = await get(h, '/api/v1/student/profile');
    assert.equal(res.status, 200);
    assert.match(res.contentType ?? '', /application\/json/);
    assert.deepEqual(Object.keys(res.body.data).sort(), PROFILE_KEYS, 'every DTO key present, nothing extra');
    assert.equal(res.body.data.email, null, 'null stays null');
    assert.equal(res.body.data.dateOfBirth, null);
    assert.equal(res.body.data.createdAt, '2026-10-30T03:00:00.000Z', 'UTC ISO-8601 with millisecond precision');
    assert.equal(Object.keys(res.body).join(), 'data', 'envelope has only data');
    assert.ok(!('password' in res.body.data) && !('passwordHash' in res.body.data));
  });
});

test('studentGetProfile preserves timestamp milliseconds and normalizes timezone without changing business dates', async () => {
  await withApp({ handler: sql => (/FROM student_profiles/.test(sql) ? [profileRow({
    created_at: new Date('2026-10-30T03:00:00.123Z'),
    updated_at: '2026-10-30T10:00:00.456+07:00',
    date_of_birth: '2005-03-09',
  })] : undefined) }, async h => {
    const res = await get(h, '/api/v1/student/profile');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.createdAt, '2026-10-30T03:00:00.123Z');
    assert.equal(res.body.data.updatedAt, '2026-10-30T03:00:00.456Z');
    assert.equal(res.body.data.dateOfBirth, '2005-03-09');
  });
});

test('studentGetProfile filters by the studentId of the session, in a read-only snapshot without the write lock', async () => {
  await withApp({ studentId: STUDENT_A, handler: sql => (/FROM student_profiles/.test(sql) ? [profileRow()] : undefined) }, async h => {
    await get(h, '/api/v1/student/profile');
    const [read] = h.pool.domainCalls;
    assert.deepEqual(read.params, [STUDENT_A]);
    assert.match(read.sql, /WHERE id = \$1/);
    assert.equal(h.pool.sqls.find(s => /^BEGIN/.test(s)), 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    assert.ok(!h.pool.sqls.some(s => /pg_advisory_xact_lock/.test(s)), 'GET must not take the global write lock');
    assert.ok(h.pool.sqls.includes('COMMIT'));
    assert.deepEqual(h.pool.releases, [false], 'client released once, not destroyed');
  });
});

test('two students never see each other: owner comes only from the session', async () => {
  const handler = (sql: string, params: unknown[]) => {
    if (!/FROM student_profiles/.test(sql)) return undefined;
    return params[0] === STUDENT_B ? [profileRow({ id: STUDENT_B, student_code: 'SV002' })] : [profileRow()];
  };
  await withApp({ accountId: ACCOUNT_B, studentId: STUDENT_B, handler }, async h => {
    const res = await get(h, '/api/v1/student/profile');
    assert.equal(res.body.data.studentCode, 'SV002');
    assert.equal(res.body.data.id, STUDENT_B);
  });
  await withApp({ handler }, async h => {
    assert.equal((await get(h, '/api/v1/student/profile')).body.data.studentCode, 'SV001');
    const sneaky = await get(h, `/api/v1/student/profile?studentId=${STUDENT_B}`);
    assert.equal(sneaky.status, 422, 'client cannot choose another student');
  });
});

test('studentGetProfile rejects any query key (page, studentId, repeated) with 422 and does not read', async () => {
  await withApp({}, async h => {
    for (const qs of ['?page=1', `?studentId=${STUDENT_B}`, '?a=1&a=2', '?x']) {
      const res = await get(h, `/api/v1/student/profile${qs}`);
      assert.equal(res.status, 422, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
    assert.equal(h.pool.domainCalls.length, 0);
    assert.equal(h.pool.connects, 0);
  });
});

test('studentGetProfile: no session 401, locked account 401, BQL/ADMIN 403 — no domain data touched', async () => {
  await withApp({}, async h => {
    const res = await get(h, '/api/v1/student/profile', { cookie: false });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'AUTH_REQUIRED');
    assert.equal(h.pool.calls.length, 0);
  });
  await withApp({ lockedAt: [true] }, async h => {
    const res = await get(h, '/api/v1/student/profile');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'ACCOUNT_LOCKED');
    assert.equal(h.pool.domainCalls.length, 0);
  });
  for (const role of ['BQL', 'ADMIN'] as const) {
    await withApp({ actorKind: 'STAFF', role }, async h => {
      const res = await get(h, '/api/v1/student/profile');
      assert.equal(res.status, 403, role);
      assert.equal(res.body.error.code, 'FORBIDDEN');
      assert.equal(h.pool.domainCalls.length, 0);
      assert.equal(h.pool.connects, 0);
    });
  }
});

test('studentGetProfile: missing profile link or row is 404 NOT_FOUND', async () => {
  await withApp({ studentId: null }, async h => {
    const res = await get(h, '/api/v1/student/profile');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(h.pool.connects, 0, 'no snapshot opened without an owner');
  });
  await withApp({ handler: () => [] }, async h => {
    const res = await get(h, '/api/v1/student/profile');
    assert.equal(res.status, 404);
  });
});

test('studentGetProfile: unexpected DB failure is 500 INTERNAL_ERROR, rolled back, nothing leaked', async () => {
  await withApp({ handler: sql => { if (/FROM student_profiles/.test(sql)) throw new Error('relation student_profiles broke: SELECT secret'); return undefined; } }, async h => {
    const res = await get(h, '/api/v1/student/profile');
    assert.equal(res.status, 500);
    assert.equal(res.body.error.code, 'INTERNAL_ERROR');
    assertNoLeak(JSON.stringify(res.body));
    assert.ok(h.pool.sqls.includes('ROLLBACK'));
    assert.deepEqual(h.pool.releases, [false]);
  });
});

test('service layer re-checks role and owner by itself (defense in depth behind requireRole)', async () => {
  const { FakePool } = await import('./helpers.js');
  const service = await import('../../src/roles/student/service.js');
  const { AppError } = await import('../../src/shared/http/errors.js');
  type Pool = Parameters<typeof service.studentGetProfile>[0];
  const bql = { actorKind: 'STAFF', accountId: 'x', role: 'BQL', sessionVersion: 1 } as const;
  const noOwner = { actorKind: 'STUDENT', accountId: 'x', role: 'SV', sessionVersion: 1 } as const;
  const page = { page: 1, pageSize: 20 };
  const calls: Array<(p: Pool, a: typeof bql | typeof noOwner) => Promise<unknown>> = [
    (p, a) => service.studentGetProfile(p, a),
    (p, a) => service.studentListBuildings(p, a, page),
    (p, a) => service.studentListRooms(p, a, page),
    (p, a) => service.studentGetRoom(p, a, '55555555-5555-4555-8555-555555555555'),
    (p, a) => service.studentGetPeriod(p, a),
  ];
  for (const call of calls) {
    const pool = new FakePool();
    await assert.rejects(call(pool as unknown as Pool, bql), (e: unknown) => e instanceof AppError && e.status === 403);
    await assert.rejects(call(pool as unknown as Pool, noOwner), (e: unknown) => e instanceof AppError && e.status === 404);
    assert.equal(pool.connects, 0, 'rejected before any DB access');
  }
});
