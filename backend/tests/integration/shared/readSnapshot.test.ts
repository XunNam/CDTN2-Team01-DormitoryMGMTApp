import assert from 'node:assert/strict';
import test from 'node:test';
import { withReadSnapshot } from '../../../src/shared/db/read-snapshot.js';
import { world, locked } from './harness.js';

test('PostgreSQL read snapshot stays stable across a committed concurrent writer without holding the write lock', async t => {
  const w = await world();
  t.after(() => w.close());
  await withReadSnapshot(w.pool, async client => {
    const state = (await client.query(`SELECT current_setting('transaction_isolation') AS isolation,
      current_setting('transaction_read_only') AS read_only,
      EXISTS (SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND locktype='advisory'
        AND classid=724006 AND objid=1 AND granted) AS holds_write_lock`)).rows[0];
    assert.equal(state.isolation, 'repeatable read');
    assert.equal(state.read_only, 'on');
    assert.equal(state.holds_write_lock, false);
    const count = async () => Number((await client.query('SELECT count(*) FROM rooms WHERE building_id=$1', [w.building.id])).rows[0].count);
    assert.equal(await count(), 1);
    await locked(w.pool, c => c.query(`INSERT INTO rooms(building_id,code,capacity,gender,fee_vnd,status)
      VALUES($1,'SNAPSHOT2',1,'MALE',0,'ACTIVE')`, [w.building.id]));
    assert.equal(await count(), 1, 'same snapshot must not observe the committed second room');
  });
  assert.equal(Number((await w.pool.query('SELECT count(*) FROM rooms WHERE building_id=$1', [w.building.id])).rows[0].count), 2);
});
