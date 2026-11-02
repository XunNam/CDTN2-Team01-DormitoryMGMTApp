import assert from 'node:assert/strict';
import test from 'node:test';
import { get, withApp } from './helpers.js';

const BASE = '/api/v1/student/buildings';
const buildingRow = (code: string, id: string) => ({ id, code, name: `Tòa ${code}`,
  created_at: new Date('2026-10-30T03:00:00Z'), updated_at: '2026-10-30T03:00:00.000Z' });
const isList = (sql: string) => /FROM buildings b/.test(sql) && /LIMIT/.test(sql);
const isCount = (sql: string) => /count\(\*\)/.test(sql);

function handler(rows: Array<Record<string, unknown>>, total = rows.length) {
  return (sql: string) => (isCount(sql) ? [{ total }] : isList(sql) ? rows : undefined);
}

test('studentListBuildings returns Building[] + meta with defaults page=1 pageSize=20', async () => {
  const id = '66666666-6666-4666-8666-666666666666';
  await withApp({ handler: handler([buildingRow('A', id)]) }, async h => {
    const res = await get(h, BASE);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      data: [{ id, code: 'A', name: 'Tòa A', createdAt: '2026-10-30T03:00:00Z', updatedAt: '2026-10-30T03:00:00Z' }],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    const list = h.pool.domainCalls.find(c => isList(c.sql))!;
    assert.deepEqual(list.params, [20, '0']);
  });
});

test('studentListBuildings: only buildings with an ACTIVE room, fixed sort, data+count in ONE snapshot with no write lock', async () => {
  await withApp({ handler: handler([]) }, async h => {
    await get(h, BASE);
    const list = h.pool.domainCalls.find(c => isList(c.sql))!.sql;
    assert.match(list, /EXISTS \(SELECT 1 FROM rooms r WHERE r\.building_id = b\.id AND r\.status = 'ACTIVE'\)/);
    assert.match(list, /ORDER BY b\.code ASC, b\.id ASC/);
    const client = h.pool.calls.filter(c => c.via === 'client').map(c => c.sql);
    const begin = client.findIndex(s => /^BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY$/.test(s));
    const commit = client.lastIndexOf('COMMIT');
    const listAt = client.findIndex(isList);
    const countAt = client.findIndex(isCount);
    assert.ok(begin === 0 && listAt > begin && countAt > begin && commit > listAt && commit > countAt, 'list and count between BEGIN and COMMIT');
    assert.ok(!client.some(s => /pg_advisory/.test(s)));
    assert.ok(!/\bhas|available|capacity/i.test(list), 'a full building still appears: availability is not a filter');
  });
});

test('studentListBuildings paging: empty data => totalPages 0; past the last page keeps requested page with real totals', async () => {
  await withApp({ handler: handler([]) }, async h => {
    assert.deepEqual((await get(h, BASE)).body, { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
  });
  await withApp({ handler: handler([], 41) }, async h => {
    const res = await get(h, `${BASE}?page=9&pageSize=10`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { data: [], meta: { page: 9, pageSize: 10, totalItems: 41, totalPages: 5 } });
    assert.deepEqual(h.pool.domainCalls.find(c => isList(c.sql))!.params, [10, '80']);
  });
});

test('studentListBuildings accepts pageSize 1 and 100 and rejects everything else with 422 and no read', async () => {
  await withApp({ handler: handler([]) }, async h => {
    assert.equal((await get(h, `${BASE}?pageSize=1`)).status, 200);
    assert.equal((await get(h, `${BASE}?pageSize=100`)).status, 200);
  });
  const bad = ['page=0', 'page=-1', 'page=abc', 'page=01', 'page=1.5', 'page=%2B1', 'page=', 'page=1&page=2', 'page[]=1',
    'pageSize=0', 'pageSize=101', 'pageSize=1e1', 'pageSize=', 'q=a', 'status=ACTIVE', 'studentId=x', 'sort=code', 'page=99999999999999999999'];
  await withApp({ handler: handler([]) }, async h => {
    for (const qs of bad) {
      const res = await get(h, `${BASE}?${qs}`);
      assert.equal(res.status, 422, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR', qs);
    }
    assert.equal(h.pool.connects, 0);
  });
});

test('studentListBuildings: 401 / locked 401 / BQL+ADMIN 403 without touching data', async () => {
  await withApp({}, async h => {
    assert.equal((await get(h, BASE, { cookie: false })).status, 401);
    assert.equal(h.pool.calls.length, 0);
  });
  await withApp({ lockedAt: [true] }, async h => {
    const res = await get(h, BASE);
    assert.equal(res.body.error.code, 'ACCOUNT_LOCKED');
    assert.equal(h.pool.connects, 0);
  });
  for (const role of ['BQL', 'ADMIN'] as const) {
    await withApp({ actorKind: 'STAFF', role }, async h => {
      assert.equal((await get(h, BASE)).status, 403, role);
      assert.equal(h.pool.connects, 0);
    });
  }
});
