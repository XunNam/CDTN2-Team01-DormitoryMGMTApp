import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN, OTHER_ID, PROFILE_ID, accountRow, assertAuthMatrix, assertNoSecrets, businessCalls, call, startApp } from './helpers.js';

test('adminGetAccount: STAFF and STUDENT read only their own namespace', async () => {
  const h = await startApp(ADMIN, (sql, params) => {
    if (sql.includes('FROM staff_accounts s WHERE s.id = $1') && params[0] === OTHER_ID) return { rows: [accountRow()] };
    if (sql.includes('FROM student_accounts a JOIN student_profiles p') && params[0] === PROFILE_ID) {
      return { rows: [accountRow({ id: PROFILE_ID, actor_kind: 'STUDENT', role: 'SV', identifier: 'SV001', student_id: PROFILE_ID })] };
    }
    return { rows: [] };
  });
  try {
    const staff = await call(h, 'GET', `/accounts/STAFF/${OTHER_ID.toUpperCase()}`);
    assert.equal(staff.status, 200);
    assert.equal(staff.json.data.id, OTHER_ID);
    assert.equal(staff.json.data.studentId, null);
    assertNoSecrets(staff.text);
    const student = await call(h, 'GET', `/accounts/STUDENT/${PROFILE_ID}`);
    assert.equal(student.status, 200);
    assert.equal(student.json.data.actorKind, 'STUDENT');
    // Same UUID in the other namespace is 404: no fallback to the other store.
    const crossed = await call(h, 'GET', `/accounts/STUDENT/${OTHER_ID}`);
    assert.equal(crossed.status, 404);
    assert.equal(crossed.json.error.code, 'NOT_FOUND');
    const lookups = businessCalls(h.db);
    assert.ok(lookups.every(sql => !(sql.includes('student_accounts') && sql.includes('staff_accounts'))));
  } finally { await h.close(); }
});

test('adminGetAccount: invalid path or any query is 422 before SQL', async () => {
  const h = await startApp(ADMIN, () => { throw new Error('must not query'); });
  try {
    for (const path of [`/accounts/ADMIN/${OTHER_ID}`, `/accounts/staff/${OTHER_ID}`, '/accounts/STAFF/not-a-uuid',
      `/accounts/STAFF/${OTHER_ID}?page=1`, `/accounts/STAFF/${OTHER_ID}?studentId=${PROFILE_ID}`]) {
      const res = await call(h, 'GET', path);
      assert.equal(res.status, 422, path);
      assert.equal(res.json.error.code, 'VALIDATION_ERROR');
    }
    assert.equal((await call(h, 'GET', `/accounts/STAFF/${OTHER_ID}/`)).status, 404, 'strict routing: no trailing slash');
  } finally { await h.close(); }
});

test('adminGetAccount: auth matrix', async () => {
  await assertAuthMatrix('GET', `/accounts/STAFF/${OTHER_ID}`);
});
