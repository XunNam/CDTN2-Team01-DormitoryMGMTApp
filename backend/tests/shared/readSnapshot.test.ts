import assert from 'node:assert/strict';
import test from 'node:test';
import type { Pool, PoolClient } from 'pg';
import { withReadSnapshot } from '../../src/shared/db/read-snapshot.js';

function fixture(fail: Record<string, Error> = {}) {
  const statements: string[] = [];
  const releases: boolean[] = [];
  const client = {
    query: async (sql: string) => {
      statements.push(sql);
      if (fail[sql]) throw fail[sql];
      return { rows: [{ value: 42 }] };
    },
    release: (destroy: boolean) => releases.push(destroy),
  } as unknown as PoolClient;
  const pool = { connect: async () => client } as unknown as Pool;
  return { pool, client, statements, releases };
}

test('read snapshot commits on one client without acquiring a business write lock', async () => {
  const f = fixture();
  const result = await withReadSnapshot(f.pool, async client => {
    assert.equal(client, f.client);
    return (await client.query('SELECT value')).rows[0].value;
  });
  assert.equal(result, 42);
  assert.deepEqual(f.statements, ['BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY', 'SELECT value', 'COMMIT']);
  assert.deepEqual(f.releases, [false]);
});

test('read snapshot rolls back a failed query and releases a reusable client', async () => {
  const original = new Error('read failed');
  const f = fixture({ 'SELECT value': original });
  await assert.rejects(withReadSnapshot(f.pool, client => client.query('SELECT value')), e => e === original);
  assert.equal(f.statements.at(-1), 'ROLLBACK');
  assert.deepEqual(f.releases, [false]);
});

test('read snapshot discards a client after BEGIN fails and never runs the callback', async () => {
  const original = new Error('BEGIN failed');
  const f = fixture({ 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY': original });
  await assert.rejects(withReadSnapshot(f.pool, async () => assert.fail('must not run')), e => e === original);
  assert.equal(f.statements.length, 1);
  assert.deepEqual(f.releases, [true]);
});

test('read snapshot preserves the original error if rollback also fails', async () => {
  const original = new Error('read failed');
  const f = fixture({ 'SELECT value': original, ROLLBACK: new Error('rollback failed') });
  await assert.rejects(withReadSnapshot(f.pool, client => client.query('SELECT value')), e => e === original);
  assert.deepEqual(f.releases, [true]);
});

test('read snapshot rolls back when COMMIT fails', async () => {
  const original = new Error('COMMIT failed');
  const f = fixture({ COMMIT: original });
  await assert.rejects(withReadSnapshot(f.pool, async () => 42), e => e === original);
  assert.deepEqual(f.statements.slice(-2), ['COMMIT', 'ROLLBACK']);
  assert.deepEqual(f.releases, [false]);
});

test('read snapshot propagates acquisition failure without running the callback', async () => {
  const original = new Error('connection unavailable');
  const pool = { connect: async () => { throw original; } } as unknown as Pool;
  await assert.rejects(withReadSnapshot(pool, async () => assert.fail('must not run')), e => e === original);
});
