// Integration (PostgreSQL). Run on Anh's machine: `npm run test:integration` (TEST_DATABASE_URL).
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { ACCOUNT_KEYS, api, assertNoSecrets, seedProfile, seedSession, seedStaff, seedStudentAccount, setup, type Env, type Session } from './fixtures.js';

let env: Env;
let admin: Session;
before(async () => {
  env = await setup();
  admin = await seedSession(env, 'STAFF', (await seedStaff(env, 'admin', 'ADMIN')).id);
  await seedStaff(env, 'bql1', 'BQL');
  await seedStaff(env, 'bql2', 'BQL', true);
  const profile = await seedProfile(env, 'sv1');
  await seedStudentAccount(env, profile.id);
  await seedProfile(env, 'noacc'); // profile without account: never listed as an account
});
after(async () => { await env?.close(); });

test('TC-01.1: both namespaces merged into Account DTO; AND filters; no secrets', async () => {
  const all = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag}&pageSize=100`);
  assert.equal(all.status, 200);
  assert.equal(all.json.meta.totalItems, 4);
  for (const item of all.json.data) assert.deepEqual(Object.keys(item).sort(), ACCOUNT_KEYS);
  assertNoSecrets(all.text);
  const kinds = all.json.data.map((a: { actorKind: string }) => a.actorKind).sort();
  assert.deepEqual(kinds, ['STAFF', 'STAFF', 'STAFF', 'STUDENT']);

  const lockedBql = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag}&actorKind=STAFF&role=BQL&isLocked=true`);
  assert.equal(lockedBql.json.meta.totalItems, 1);
  assert.equal(lockedBql.json.data[0].identifier, `${env.tag}.bql2`);
  const student = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag.toUpperCase()}SV1&actorKind=STUDENT`);
  assert.equal(student.json.meta.totalItems, 1, 'q is case-insensitive on studentCode');
  assert.equal(student.json.data[0].role, 'SV');
  const none = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag}&actorKind=STUDENT&role=BQL`);
  assert.deepEqual(none.json, { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
  const literal = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag}%25`);
  assert.equal(literal.json.meta.totalItems, 0, '% is literal, not a wildcard');
});

test('Pagination: stable createdAt DESC order, no duplicates or gaps, page beyond end keeps meta', async () => {
  const p1 = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag}&pageSize=3&page=1`);
  const p2 = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag}&pageSize=3&page=2`);
  const p9 = await api(env, admin, 'GET', `/admin/accounts?q=${env.tag}&pageSize=3&page=9`);
  assert.deepEqual(p1.json.meta, { page: 1, pageSize: 3, totalItems: 4, totalPages: 2 });
  const ids = [...p1.json.data, ...p2.json.data].map((a: { id: string }) => a.id);
  assert.equal(new Set(ids).size, 4);
  const times = [...p1.json.data, ...p2.json.data].map((a: { createdAt: string }) => a.createdAt);
  assert.deepEqual(times, [...times].sort().reverse());
  assert.deepEqual(p9.json, { data: [], meta: { page: 9, pageSize: 3, totalItems: 4, totalPages: 2 } });
});

test('BQL and SV cannot list accounts', async () => {
  const bql = await seedSession(env, 'STAFF', (await seedStaff(env, 'bqlcaller', 'BQL')).id);
  assert.equal((await api(env, bql, 'GET', '/admin/accounts')).status, 403);
  const profile = await seedProfile(env, 'svcaller');
  const sv = await seedSession(env, 'STUDENT', await seedStudentAccount(env, profile.id));
  assert.equal((await api(env, sv, 'GET', '/admin/accounts')).status, 403);
  assert.equal((await api(env, null, 'GET', '/admin/accounts')).status, 401);
});
