// Integration (PostgreSQL). Run on Anh's machine: `npm run test:integration` (TEST_DATABASE_URL).
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { ACCOUNT_KEYS, api, assertNoSecrets, seedProfile, seedSession, seedStaff, setup, type Env, type Session } from './fixtures.js';

let env: Env;
let admin: Session;
before(async () => {
  env = await setup();
  const actor = await seedStaff(env, 'admin', 'ADMIN');
  admin = await seedSession(env, 'STAFF', actor.id);
});
after(async () => { await env?.close(); });

test('TC-01.1 STUDENT: profile must exist, one account per profile, Argon2id stored, no secrets returned', async () => {
  const profile = await seedProfile(env, 'p1');
  const password = '  Mật khẩu#2026 ';
  const res = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STUDENT', studentId: profile.id, role: 'SV', password });
  assert.equal(res.status, 201);
  assert.deepEqual(Object.keys(res.json.data).sort(), ACCOUNT_KEYS);
  assert.equal(res.json.data.identifier, profile.code);
  assert.equal(res.json.data.studentId, profile.id);
  assert.equal(res.json.data.isLocked, false);
  assertNoSecrets(res.text);
  const { rows } = await env.pool.query('SELECT password_hash, session_version, role FROM student_accounts WHERE id = $1', [res.json.data.id]);
  assert.match(rows[0].password_hash, /^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
  assert.equal(Buffer.from(rows[0].password_hash.split('$')[5], 'base64').length, 64, 'new password digest is 64 bytes');
  assert.ok(await argon2.verify(rows[0].password_hash, password), 'password stored untrimmed');
  assert.deepEqual([rows[0].session_version, rows[0].role], [1, 'SV']);

  const again = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STUDENT', studentId: profile.id, role: 'SV', password: 'Another#2026' });
  assert.equal(again.status, 409);
  assert.equal(again.json.error.code, 'ACCOUNT_ALREADY_EXISTS');
  const missing = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STUDENT', studentId: '00000000-0000-4000-8000-00000000abcd', role: 'SV', password: 'Another#2026' });
  assert.equal(missing.status, 404);
  assert.equal(missing.json.error.code, 'NOT_FOUND');
  const count = await env.pool.query('SELECT count(*)::int AS n FROM student_accounts WHERE student_id = $1', [profile.id]);
  assert.equal(count.rows[0].n, 1);
});

test('TC-01.1 STAFF: BQL and ADMIN created, username normalized and unique within STAFF namespace only', async () => {
  const bql = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STAFF', username: ` ${env.tag.toUpperCase()}.BQL1 `, displayName: ' BQL mẫu ', role: 'BQL', password: 'DemoOnly#2026' });
  assert.equal(bql.status, 201);
  assert.equal(bql.json.data.identifier, `${env.tag}.bql1`);
  assert.equal(bql.json.data.displayName, 'BQL mẫu');
  assert.equal(bql.json.data.studentId, null);
  const adm = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STAFF', username: `${env.tag}.adm1`, displayName: 'Admin mẫu', role: 'ADMIN', password: 'DemoOnly#2026' });
  assert.equal(adm.status, 201);
  assert.equal(adm.json.data.role, 'ADMIN');
  for (const account of [bql, adm]) {
    const hash=(await env.pool.query('SELECT password_hash FROM staff_accounts WHERE id=$1',[account.json.data.id])).rows[0].password_hash;
    assert.equal(Buffer.from(hash.split('$')[5],'base64').length,64,'new STAFF password digest is 64 bytes');
    assert.ok(await argon2.verify(hash,'DemoOnly#2026'));
  }
  const dup = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STAFF', username: `${env.tag}.BQL1`, displayName: 'Trùng', role: 'ADMIN', password: 'DemoOnly#2026' });
  assert.equal(dup.status, 409);
  assert.equal(dup.json.error.code, 'DUPLICATE_USERNAME');
  // Same string as a student code is allowed: separate namespace.
  const profile = await seedProfile(env, 'ns');
  const sameAsCode = await api(env, admin, 'POST', '/admin/accounts', { accountType: 'STAFF', username: profile.code.toLowerCase(), displayName: 'Trùng mã SV', role: 'BQL', password: 'DemoOnly#2026' });
  assert.equal(sameAsCode.status, 201);
});

test('Race: two Admins grant the same profile concurrently -> exactly one account (201 + 409)', async () => {
  const profile = await seedProfile(env, 'race');
  const second = await seedSession(env, 'STAFF', (await seedStaff(env, 'admin2', 'ADMIN')).id);
  const body = { accountType: 'STUDENT', studentId: profile.id, role: 'SV', password: 'DemoOnly#2026' };
  const results = await Promise.all([api(env, admin, 'POST', '/admin/accounts', body), api(env, second, 'POST', '/admin/accounts', body)]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(results.find(r => r.status === 409)!.json.error.code, 'ACCOUNT_ALREADY_EXISTS');
  const count = await env.pool.query('SELECT count(*)::int AS n FROM student_accounts WHERE student_id = $1', [profile.id]);
  assert.equal(count.rows[0].n, 1);
});

test('Race: same username concurrently -> 201 + 409 DUPLICATE_USERNAME', async () => {
  const body = { accountType: 'STAFF', username: `${env.tag}.race`, displayName: 'Race', role: 'BQL', password: 'DemoOnly#2026' };
  const results = await Promise.all([api(env, admin, 'POST', '/admin/accounts', body), api(env, admin, 'POST', '/admin/accounts', body)]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(results.find(r => r.status === 409)!.json.error.code, 'DUPLICATE_USERNAME');
});

test('Denied callers write nothing: BQL 403, locked Admin 401, missing CSRF 403', async () => {
  const profile = await seedProfile(env, 'deny');
  const body = { accountType: 'STUDENT', studentId: profile.id, role: 'SV', password: 'DemoOnly#2026' };
  const bql = await seedSession(env, 'STAFF', (await seedStaff(env, 'bqlactor', 'BQL')).id);
  const locked = await seedSession(env, 'STAFF', (await seedStaff(env, 'lockedadmin', 'ADMIN', true)).id);
  assert.equal((await api(env, bql, 'POST', '/admin/accounts', body)).json.error.code, 'FORBIDDEN');
  assert.equal((await api(env, locked, 'POST', '/admin/accounts', body)).json.error.code, 'ACCOUNT_LOCKED');
  assert.equal((await api(env, { ...admin, csrf: 'x'.repeat(64) }, 'POST', '/admin/accounts', body)).json.error.code, 'CSRF_INVALID');
  const count = await env.pool.query('SELECT count(*)::int AS n FROM student_accounts WHERE student_id = $1', [profile.id]);
  assert.equal(count.rows[0].n, 0);
});
