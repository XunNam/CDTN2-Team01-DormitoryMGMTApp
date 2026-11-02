import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN, ADMIN_ID, OTHER_ID, accountRow, assertAuthMatrix, businessCalls, call, startApp, type Handler, type Harness } from './helpers.js';

/** Stateful fake for one STAFF account row; the caller's own row is ADMIN_ID (self-lock). */
function lockStore(h: () => Harness | undefined, initial: Record<string, boolean>) {
  const state = { ...initial };
  const handler: Handler = (sql, params) => {
    const id = params[0] as string;
    if (sql.startsWith('UPDATE staff_accounts SET is_locked = $2 WHERE id = $1')) {
      if (!(id in state)) return { rows: [], rowCount: 0 };
      state[id] = params[1] as boolean;
      if (id === ADMIN_ID) h()!.actor.isLocked = state[id];
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('FROM staff_accounts s WHERE s.id = $1')) {
      return { rows: id in state ? [accountRow({ id, is_locked: state[id], role: id === ADMIN_ID ? 'ADMIN' : 'BQL' })] : [] };
    }
    if (sql.includes('FROM student_accounts a JOIN student_profiles p')) return { rows: [] };
    throw new Error(`unexpected SQL: ${sql}`);
  };
  return { state, handler };
}

test('adminSetAccountLock: lock then unlock; only is_locked is written; repeat is 409 INVALID_STATE', async () => {
  let harness: Harness | undefined;
  const s = lockStore(() => harness, { [OTHER_ID]: false });
  harness = await startApp(ADMIN, s.handler);
  const h = harness;
  try {
    const locked = await call(h, 'PATCH', `/accounts/STAFF/${OTHER_ID}/lock`, { isLocked: true });
    assert.equal(locked.status, 200);
    assert.equal(locked.json.data.isLocked, true);
    assert.equal(s.state[OTHER_ID], true);
    const updates = businessCalls(h.db).filter(sql => sql.startsWith('UPDATE'));
    assert.deepEqual(updates, ['UPDATE staff_accounts SET is_locked = $2 WHERE id = $1']);
    const again = await call(h, 'PATCH', `/accounts/STAFF/${OTHER_ID}/lock`, { isLocked: true });
    assert.equal(again.status, 409);
    assert.equal(again.json.error.code, 'INVALID_STATE');
    assert.equal(h.db.calls.at(-1), 'ROLLBACK');
    const unlocked = await call(h, 'PATCH', `/accounts/STAFF/${OTHER_ID}/lock`, { isLocked: false });
    assert.equal(unlocked.status, 200);
    assert.equal(unlocked.json.data.isLocked, false);
  } finally { await h.close(); }
});

test('adminSetAccountLock: self-lock returns 200, the next protected request is 401 ACCOUNT_LOCKED', async () => {
  let harness: Harness | undefined;
  const s = lockStore(() => harness, { [ADMIN_ID]: false });
  harness = await startApp(ADMIN, s.handler);
  const h = harness;
  try {
    const res = await call(h, 'PATCH', `/accounts/STAFF/${ADMIN_ID}/lock`, { isLocked: true });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.isLocked, true);
    const next = await call(h, 'GET', `/accounts/STAFF/${ADMIN_ID}`);
    assert.equal(next.status, 401);
    assert.equal(next.json.error.code, 'ACCOUNT_LOCKED');
  } finally { await h.close(); }
});

test('adminSetAccountLock: unknown account 404 in the requested namespace only', async () => {
  let harness: Harness | undefined;
  const s = lockStore(() => harness, { [OTHER_ID]: false });
  harness = await startApp(ADMIN, s.handler);
  try {
    const res = await call(harness, 'PATCH', `/accounts/STUDENT/${OTHER_ID}/lock`, { isLocked: true });
    assert.equal(res.status, 404);
    assert.equal(res.json.error.code, 'NOT_FOUND');
    assert.equal(s.state[OTHER_ID], false);
  } finally { await harness.close(); }
});

test('adminSetAccountLock: strict body/path/query -> 422 before transaction', async () => {
  const h = await startApp(ADMIN, () => { throw new Error('must not query'); });
  try {
    for (const [path, body] of [
      [`/accounts/STAFF/${OTHER_ID}/lock`, {}], [`/accounts/STAFF/${OTHER_ID}/lock`, { isLocked: 'true' }],
      [`/accounts/STAFF/${OTHER_ID}/lock`, { isLocked: null }], [`/accounts/STAFF/${OTHER_ID}/lock`, { isLocked: true, role: 'BQL' }],
      [`/accounts/STAFF/${OTHER_ID}/lock?x=1`, { isLocked: true }], [`/accounts/STAF/${OTHER_ID}/lock`, { isLocked: true }],
      ['/accounts/STAFF/123/lock', { isLocked: true }],
    ] as const) {
      const res = await call(h, 'PATCH', path, body);
      assert.equal(res.status, 422, `${path} ${JSON.stringify(body)}`);
    }
    assert.deepEqual(h.db.calls.filter(sql => sql.startsWith('BEGIN')), []);
  } finally { await h.close(); }
});

test('adminSetAccountLock: auth matrix', async () => {
  await assertAuthMatrix('PATCH', `/accounts/STAFF/${OTHER_ID}/lock`, { isLocked: true });
});
