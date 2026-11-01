// Integration (PostgreSQL). Run on Anh's machine: `npm run test:integration` (TEST_DATABASE_URL).
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { ACCOUNT_KEYS, api, assertNoSecrets, seedProfile, seedSession, seedStaff, seedStudentAccount, setup, type Env, type Session } from './fixtures.js';

let env: Env;
let admin: Session;
before(async () => {
  env = await setup();
  admin = await seedSession(env, 'STAFF', (await seedStaff(env, 'admin', 'ADMIN')).id);
});
after(async () => { await env?.close(); });

test('Reads the requested namespace only; 404 for other namespace or unknown id', async () => {
  const bql = await seedStaff(env, 'bql', 'BQL');
  const profile = await seedProfile(env, 'sv');
  const studentAccount = await seedStudentAccount(env, profile.id);

  const staff = await api(env, admin, 'GET', `/admin/accounts/STAFF/${bql.id}`);
  assert.equal(staff.status, 200);
  assert.deepEqual(Object.keys(staff.json.data).sort(), ACCOUNT_KEYS);
  assert.equal(staff.json.data.identifier, bql.username);
  assertNoSecrets(staff.text);

  const student = await api(env, admin, 'GET', `/admin/accounts/STUDENT/${studentAccount}`);
  assert.equal(student.status, 200);
  assert.equal(student.json.data.studentId, profile.id);
  assert.equal(student.json.data.identifier, profile.code);

  assert.equal((await api(env, admin, 'GET', `/admin/accounts/STUDENT/${bql.id}`)).status, 404);
  assert.equal((await api(env, admin, 'GET', `/admin/accounts/STAFF/${studentAccount}`)).status, 404);
  // studentId is not an accountId.
  assert.equal((await api(env, admin, 'GET', `/admin/accounts/STUDENT/${profile.id}`)).status, 404);
  assert.equal((await api(env, admin, 'GET', '/admin/accounts/STAFF/not-a-uuid')).status, 422);
});
