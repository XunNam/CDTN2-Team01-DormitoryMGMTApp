import assert from 'node:assert/strict';
import test from 'node:test';
import { get, roomRow, withApp } from './helpers.js';

const BASE = '/api/v1/student/rooms';
const BUILDING = '66666666-6666-4666-8666-666666666666';
const isList = (sql: string) => /FROM room_availability ra/.test(sql) && /LIMIT/.test(sql);
const isCount = (sql: string) => /count\(\*\)/.test(sql);
const handler = (rows: Array<Record<string, unknown>>, total = rows.length) => (sql: string) => (isCount(sql) ? [{ total }] : isList(sql) ? rows : undefined);

const ROOM_KEYS = ['allocatedPlaces', 'availablePlaces', 'buildingCode', 'buildingId', 'buildingName', 'capacity', 'code',
  'createdAt', 'feeVnd', 'gender', 'id', 'status', 'updatedAt'];

test('studentListRooms maps the view row to the Room DTO (money as string, counts as integers)', async () => {
  await withApp({ handler: handler([roomRow({ fee_vnd: '9223372036854775807' })]) }, async h => {
    const res = await get(h, BASE);
    assert.equal(res.status, 200);
    const room = res.body.data[0];
    assert.deepEqual(Object.keys(room).sort(), ROOM_KEYS);
    assert.equal(room.feeVnd, '9223372036854775807', 'BIGINT never goes through Number');
    assert.equal(room.allocatedPlaces, 5);
    assert.equal(room.availablePlaces, 1);
    assert.equal(room.buildingCode, 'A');
    assert.deepEqual(res.body.meta, { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });
});

test('studentListRooms always forces ACTIVE and uses the cataloged sort; count shares the same WHERE and params', async () => {
  await withApp({ handler: handler([]) }, async h => {
    await get(h, BASE);
    const list = h.pool.domainCalls.find(c => isList(c.sql))!;
    const count = h.pool.domainCalls.find(c => isCount(c.sql))!;
    assert.match(list.sql, /WHERE ra\.status = 'ACTIVE'/);
    assert.match(list.sql, /ORDER BY ra\.building_code ASC, ra\.code ASC, ra\.id ASC/);
    assert.match(count.sql, /WHERE ra\.status = 'ACTIVE'/);
    assert.match(list.sql, /FROM room_availability/, 'occupancy comes from the shared view');
  });
});

test('studentListRooms combines buildingId + gender + hasAvailability + q with AND, all parameterized', async () => {
  await withApp({ handler: handler([]) }, async h => {
    const res = await get(h, `${BASE}?buildingId=${BUILDING.toUpperCase()}&gender=FEMALE&hasAvailability=true&q=%20a1%20&page=2&pageSize=5`);
    assert.equal(res.status, 200);
    const list = h.pool.domainCalls.find(c => isList(c.sql))!;
    const count = h.pool.domainCalls.find(c => isCount(c.sql))!;
    assert.match(list.sql, /ra\.building_id = \$1 AND ra\.gender = \$2 AND ra\.available_places > 0 AND \(ra\.code ILIKE \$3 ESCAPE '\\' OR ra\.building_code ILIKE \$3 ESCAPE '\\' OR ra\.building_name ILIKE \$3 ESCAPE '\\'\)/);
    assert.deepEqual(list.params, [BUILDING, 'FEMALE', '%a1%', 5, '5']);
    assert.deepEqual(count.params, [BUILDING, 'FEMALE', '%a1%'], 'count has the same filters, no paging');
    assert.ok(!/a1|FEMALE|FEMALE/.test(list.sql.replace(/\$\d/g, '')), 'no user value is interpolated into SQL text');
  });
});

test('studentListRooms: hasAvailability=false means availablePlaces = 0; omitted means no availability condition', async () => {
  await withApp({ handler: handler([]) }, async h => {
    await get(h, `${BASE}?hasAvailability=false`);
    await get(h, BASE);
    const [withFalse, withoutFilter] = h.pool.domainCalls.filter(c => isList(c.sql));
    assert.match(withFalse.sql, /ra\.available_places = 0/);
    assert.doesNotMatch(withoutFilter.sql, /available_places\s*(=|>)/);
  });
});

test('studentListRooms treats % _ and backslash in q literally (escaped), and blank q means no filter', async () => {
  await withApp({ handler: handler([]) }, async h => {
    await get(h, `${BASE}?q=${encodeURIComponent('50%_off\\')}`);
    assert.equal(h.pool.domainCalls.find(c => isList(c.sql))!.params[0], '%50\\%\\_off\\\\%');
  });
  await withApp({ handler: handler([]) }, async h => {
    await get(h, `${BASE}?q=%20%20`);
    const list = h.pool.domainCalls.find(c => isList(c.sql))!;
    assert.ok(!/ILIKE/.test(list.sql));
    assert.deepEqual(list.params, [20, '0']);
  });
});

test('studentListRooms rejects forbidden/malformed query with 422 and never reads', async () => {
  const bad = ['status=INACTIVE', 'status=ACTIVE', 'studentId=x', 'hasAvailability=1', 'hasAvailability=TRUE', 'hasAvailability=',
    'hasAvailability=true&hasAvailability=false', 'gender=male', 'gender=OTHER', 'gender=', 'buildingId=abc',
    'buildingId=66666666-6666-4666-8666-66666666666', 'buildingId=', `q=${'x'.repeat(101)}`, 'q=a&q=b', 'availableOnly=true',
    'page=0', 'pageSize=101', 'sort=code'];
  await withApp({ handler: handler([]) }, async h => {
    for (const qs of bad) {
      const res = await get(h, `${BASE}?${qs}`);
      assert.equal(res.status, 422, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR', qs);
    }
    assert.equal(h.pool.connects, 0);
    // boundary that must pass: exactly 100 characters
    assert.equal((await get(h, `${BASE}?q=${'x'.repeat(100)}`)).status, 200);
  });
});

test('studentListRooms: empty result, beyond-last page, snapshot shape, and role/auth rejection', async () => {
  await withApp({ handler: handler([], 0) }, async h => {
    assert.deepEqual((await get(h, BASE)).body.meta, { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
    const client = h.pool.calls.filter(c => c.via === 'client').map(c => c.sql);
    assert.equal(client[0], 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    assert.ok(!client.some(s => /pg_advisory/.test(s)));
  });
  await withApp({ handler: handler([], 25) }, async h => {
    const res = await get(h, `${BASE}?page=7&pageSize=10`);
    assert.deepEqual(res.body, { data: [], meta: { page: 7, pageSize: 10, totalItems: 25, totalPages: 3 } });
  });
  await withApp({}, async h => {
    assert.equal((await get(h, BASE, { cookie: false })).status, 401);
  });
  for (const role of ['BQL', 'ADMIN'] as const) {
    await withApp({ actorKind: 'STAFF', role }, async h => {
      assert.equal((await get(h, BASE)).status, 403, role);
      assert.equal(h.pool.connects, 0);
    });
  }
});
