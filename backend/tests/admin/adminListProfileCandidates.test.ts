import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN, PROFILE_ID, assertAuthMatrix, businessCalls, call, startApp } from './helpers.js';

test('adminListProfileCandidates: only profiles without account, minimal DTO, snapshot, stable sort', async () => {
  let params: unknown[] = [];
  const h = await startApp(ADMIN, (sql, p) => {
    if (sql.includes('count(*)')) return { rows: [{ total: '3' }] };
    params = p;
    return { rows: [{ id: PROFILE_ID, student_code: 'SV001', full_name: 'Sinh viên mẫu' }] };
  });
  try {
    const res = await call(h, 'GET', '/student-profiles/candidates?q=sv%25&pageSize=1&page=2');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { data: [{ id: PROFILE_ID, studentCode: 'SV001', fullName: 'Sinh viên mẫu', hasAccount: false }],
      meta: { page: 2, pageSize: 1, totalItems: 3, totalPages: 3 } });
    assert.deepEqual(params, ['%sv\\%%', 1, '1']);
    const sql = businessCalls(h.db).find(s => s.includes('LIMIT'))!;
    assert.match(sql, /NOT EXISTS \(SELECT 1 FROM student_accounts a WHERE a\.student_id = p\.id\)/);
    assert.match(sql, /ORDER BY p\.created_at DESC, p\.id ASC/);
    assert.doesNotMatch(sql, /gender|phone|email|date_of_birth|address/);
    assert.ok(h.db.calls.includes('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'));
  } finally { await h.close(); }
});

test('adminListProfileCandidates: only page/pageSize/q are accepted', async () => {
  const h = await startApp(ADMIN, () => { throw new Error('must not query'); });
  try {
    for (const query of ['actorKind=STUDENT', 'isLocked=false', 'page=0', 'pageSize=500', 'q=a&q=b']) {
      const res = await call(h, 'GET', `/student-profiles/candidates?${query}`);
      assert.equal(res.status, 422, query);
    }
  } finally { await h.close(); }
});

test('adminListProfileCandidates: auth matrix', async () => {
  await assertAuthMatrix('GET', '/student-profiles/candidates');
});
