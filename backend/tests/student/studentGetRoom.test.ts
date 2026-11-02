import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOM_ID, get, roomRow, withApp } from './helpers.js';

const path = (id: string) => `/api/v1/student/rooms/${id}`;
const isRoom = (sql: string) => /FROM room_availability ra WHERE ra\.id = \$1/.test(sql);

test('studentGetRoom returns one Room DTO for an ACTIVE room', async () => {
  await withApp({ handler: sql => (isRoom(sql) ? [roomRow()] : undefined) }, async h => {
    const res = await get(h, path(ROOM_ID));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, ROOM_ID);
    assert.equal(res.body.data.feeVnd, '1000000');
    assert.equal(res.body.data.allocatedPlaces + res.body.data.availablePlaces, res.body.data.capacity);
    assert.equal(Object.keys(res.body).join(), 'data');
    const read = h.pool.domainCalls[0];
    assert.match(read.sql, /ra\.status = 'ACTIVE'/, 'INACTIVE rooms are excluded in SQL, not in JS');
    assert.deepEqual(read.params, [ROOM_ID]);
    assert.equal(h.pool.calls.filter(c => c.via === 'client')[0].sql, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  });
});

test('studentGetRoom: unknown or INACTIVE room is 404 NOT_FOUND (indistinguishable)', async () => {
  await withApp({ handler: () => [] }, async h => {
    const res = await get(h, path(ROOM_ID));
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });
});

test('studentGetRoom: invalid UUID or any query is 422 and no read; uppercase UUID is normalized', async () => {
  await withApp({ handler: sql => (isRoom(sql) ? [roomRow()] : undefined) }, async h => {
    for (const id of ['abc', '123', ROOM_ID.slice(0, -1), `${ROOM_ID}x`, 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz']) {
      const res = await get(h, path(id));
      assert.equal(res.status, 422, id);
      assert.equal(res.body.error.details[0].field, 'roomId');
    }
    assert.equal((await get(h, `${path(ROOM_ID)}?page=1`)).status, 422);
    assert.equal((await get(h, `${path(ROOM_ID)}?studentId=x`)).status, 422);
    assert.equal(h.pool.connects, 0);
    assert.equal((await get(h, path(ROOM_ID.toUpperCase()))).status, 200);
    assert.deepEqual(h.pool.domainCalls[0].params, [ROOM_ID]);
  });
});

test('studentGetRoom: trailing slash is not a route (strict routing); auth and role are enforced first', async () => {
  await withApp({ handler: () => [roomRow()] }, async h => {
    assert.equal((await get(h, `${path(ROOM_ID)}/`)).status, 404);
  });
  await withApp({}, async h => { assert.equal((await get(h, path(ROOM_ID), { cookie: false })).status, 401); });
  await withApp({ lockedAt: [true] }, async h => {
    assert.equal((await get(h, path(ROOM_ID))).body.error.code, 'ACCOUNT_LOCKED');
    assert.equal(h.pool.connects, 0);
  });
  for (const role of ['BQL', 'ADMIN'] as const) {
    await withApp({ actorKind: 'STAFF', role }, async h => {
      assert.equal((await get(h, path(ROOM_ID))).status, 403, role);
      assert.equal(h.pool.connects, 0);
    });
  }
});
