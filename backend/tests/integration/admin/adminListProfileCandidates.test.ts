// Integration (PostgreSQL). Run on Anh's machine: `npm run test:integration` (TEST_DATABASE_URL).
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { api, seedProfile, seedSession, seedStaff, seedStudentAccount, setup, type Env, type Session } from './fixtures.js';

let env: Env;
let admin: Session;
before(async () => {
  env = await setup();
  admin = await seedSession(env, 'STAFF', (await seedStaff(env, 'admin', 'ADMIN')).id);
});
after(async () => { await env?.close(); });

test('Q-26: only profiles without an account; minimal DTO; disappears after grant', async () => {
  const free1 = await seedProfile(env, 'a1', `Nguyễn Văn ${env.tag}`);
  const free2 = await seedProfile(env, 'a2');
  const taken = await seedProfile(env, 'a3');
  await seedStudentAccount(env, taken.id);

  const res = await api(env, admin, 'GET', `/admin/student-profiles/candidates?q=${env.tag}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.json.meta, { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 });
  assert.deepEqual(res.json.data.map((c: { id: string }) => c.id), [free2.id, free1.id], 'createdAt DESC');
  for (const c of res.json.data) {
    assert.deepEqual(Object.keys(c).sort(), ['fullName', 'hasAccount', 'id', 'studentCode']);
    assert.equal(c.hasAccount, false);
  }
  const byName = await api(env, admin, 'GET', `/admin/student-profiles/candidates?q=${encodeURIComponent(`nguyễn văn ${env.tag}`)}`);
  assert.equal(byName.json.meta.totalItems, 1);

  const grant = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STUDENT', studentId: free1.id, role: 'SV', password: 'DemoOnly#2026' });
  assert.equal(grant.status, 201);
  const after = await api(env, admin, 'GET', `/admin/student-profiles/candidates?q=${env.tag}`);
  assert.deepEqual(after.json.data.map((c: { id: string }) => c.id), [free2.id]);
});

test('BQL cannot use the Admin candidates lookup', async () => {
  const bql = await seedSession(env, 'STAFF', (await seedStaff(env, 'bql', 'BQL')).id);
  assert.equal((await api(env, bql, 'GET', '/admin/student-profiles/candidates')).status, 403);
});
