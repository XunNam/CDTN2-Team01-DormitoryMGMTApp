// Integration (PostgreSQL). Run on Anh's machine: `npm run test:integration` (TEST_DATABASE_URL).
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { api, seedProfile, seedSession, seedStaff, seedStudentAccount, setup, type Env, type Session } from './fixtures.js';

let env: Env;
let admin: Session;
let adminId: string;
before(async () => {
  env = await setup();
  adminId = (await seedStaff(env, 'admin', 'ADMIN')).id;
  admin = await seedSession(env, 'STAFF', adminId);
});
after(async () => { await env?.close(); });

test('TC-01.2: lock blocks the next protected request of a logged-in BQL; unlock restores access; repeat is 409', async () => {
  const bql = await seedStaff(env, 'bql', 'BQL');
  const bqlSession = await seedSession(env, 'STAFF', bql.id);
  // Before lock: guard passes, the (still empty) management router answers 404.
  assert.equal((await api(env, bqlSession, 'GET', '/management/statistics')).status, 404);
  const before = (await env.pool.query('SELECT updated_at, session_version FROM staff_accounts WHERE id = $1', [bql.id])).rows[0];

  const locked = await api(env, admin, 'PATCH', `/admin/accounts/STAFF/${bql.id}/lock`, { isLocked: true });
  assert.equal(locked.status, 200);
  assert.equal(locked.json.data.isLocked, true);
  const row = (await env.pool.query('SELECT is_locked, updated_at, session_version FROM staff_accounts WHERE id = $1', [bql.id])).rows[0];
  assert.equal(row.is_locked, true);
  assert.ok(row.updated_at > before.updated_at, 'updated_at set by trigger');
  assert.equal(row.session_version, before.session_version, 'lock does not touch session_version');

  const blocked = await api(env, bqlSession, 'GET', '/management/statistics');
  assert.equal(blocked.status, 401);
  assert.equal(blocked.json.error.code, 'ACCOUNT_LOCKED');
  const repeat = await api(env, admin, 'PATCH', `/admin/accounts/STAFF/${bql.id}/lock`, { isLocked: true });
  assert.equal(repeat.status, 409);
  assert.equal(repeat.json.error.code, 'INVALID_STATE');

  assert.equal((await api(env, admin, 'PATCH', `/admin/accounts/STAFF/${bql.id}/lock`, { isLocked: false })).status, 200);
  assert.equal((await api(env, bqlSession, 'GET', '/management/statistics')).status, 404, 'unlocked: guard passes again');
});

test('TC-01.2: locking a student account keeps the profile unchanged', async () => {
  const profile = await seedProfile(env, 'sv');
  const accountId = await seedStudentAccount(env, profile.id);
  const before = (await env.pool.query('SELECT * FROM student_profiles WHERE id = $1', [profile.id])).rows[0];
  const res = await api(env, admin, 'PATCH', `/admin/accounts/STUDENT/${accountId}/lock`, { isLocked: true });
  assert.equal(res.status, 200);
  assert.equal(res.json.data.studentId, profile.id);
  assert.deepEqual((await env.pool.query('SELECT * FROM student_profiles WHERE id = $1', [profile.id])).rows[0], before);
  // Wrong namespace for the same id: 404, nothing changed.
  assert.equal((await api(env, admin, 'PATCH', `/admin/accounts/STAFF/${accountId}/lock`, { isLocked: false })).status, 404);
});

test('Q-17/Q-27: Admin may lock itself; that response is 200 and its next request is 401', async () => {
  const self = await seedStaff(env, 'selfadmin', 'ADMIN');
  const s = await seedSession(env, 'STAFF', self.id);
  const res = await api(env, s, 'PATCH', `/admin/accounts/STAFF/${self.id}/lock`, { isLocked: true });
  assert.equal(res.status, 200);
  assert.equal(res.json.data.isLocked, true);
  const next = await api(env, s, 'GET', '/admin/accounts');
  assert.equal(next.status, 401);
  assert.equal(next.json.error.code, 'ACCOUNT_LOCKED');
});

test('Race: two concurrent locks of the same account -> 200 + 409, final state locked', async () => {
  const target = await seedStaff(env, 'racetarget', 'BQL');
  const results = await Promise.all([
    api(env, admin, 'PATCH', `/admin/accounts/STAFF/${target.id}/lock`, { isLocked: true }),
    api(env, admin, 'PATCH', `/admin/accounts/STAFF/${target.id}/lock`, { isLocked: true }),
  ]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  assert.equal((await env.pool.query('SELECT is_locked FROM staff_accounts WHERE id = $1', [target.id])).rows[0].is_locked, true);
});
