import assert from 'node:assert/strict';
import test from 'node:test';
import { assertNoLeak, get, withApp } from './helpers.js';

const PATH = '/api/v1/student/registration-period';
const STAFF = '77777777-7777-4777-8777-777777777777';
const isPeriod = (sql: string) => /FROM registration_period WHERE id = 1/.test(sql);

test('studentGetPeriod returns the singleton for OPEN and for CLOSED (closed is still 200)', async () => {
  for (const [status, updated_by] of [['OPEN', STAFF], ['CLOSED', null]] as const) {
    await withApp({ handler: sql => (isPeriod(sql) ? [{ id: 1, status, updated_by, updated_at: new Date('2026-10-30T03:00:00Z') }] : undefined) }, async h => {
      const res = await get(h, PATH);
      assert.equal(res.status, 200);
      assert.deepEqual(res.body, { data: { id: 1, status, updatedBy: updated_by, updatedAt: '2026-10-30T03:00:00Z' } });
      assert.ok(!h.pool.sqls.some(s => /pg_advisory/.test(s)), 'read does not take the write lock');
      assert.ok(!h.pool.calls.some(c => /UPDATE|INSERT|DELETE/.test(c.sql)), 'SV cannot change the period');
    });
  }
});

test('studentGetPeriod rejects any query (including page/studentId) with 422 and does not read', async () => {
  await withApp({}, async h => {
    for (const qs of ['?page=1', '?studentId=x', '?status=OPEN']) {
      const res = await get(h, `${PATH}${qs}`);
      assert.equal(res.status, 422, qs);
    }
    assert.equal(h.pool.connects, 0);
  });
});

test('studentGetPeriod: missing singleton row is an integrity fault => 500 INTERNAL_ERROR without details', async () => {
  await withApp({ handler: () => [] }, async h => {
    const res = await get(h, PATH);
    assert.equal(res.status, 500);
    assert.equal(res.body.error.code, 'INTERNAL_ERROR');
    assertNoLeak(JSON.stringify(res.body));
    assert.ok(!/singleton|registration_period/.test(JSON.stringify(res.body)));
  });
});

test('studentGetPeriod: 401 without session, 401 locked, 403 for BQL/ADMIN', async () => {
  await withApp({}, async h => { assert.equal((await get(h, PATH, { cookie: false })).status, 401); });
  await withApp({ lockedAt: [true] }, async h => {
    assert.equal((await get(h, PATH)).body.error.code, 'ACCOUNT_LOCKED');
    assert.equal(h.pool.connects, 0);
  });
  for (const role of ['BQL', 'ADMIN'] as const) {
    await withApp({ actorKind: 'STAFF', role }, async h => {
      assert.equal((await get(h, PATH)).status, 403, role);
      assert.equal(h.pool.connects, 0);
    });
  }
});
