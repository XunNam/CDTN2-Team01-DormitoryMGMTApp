import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN, OTHER_ID, PROFILE_ID, accountRow, assertAuthMatrix, assertNoSecrets, businessCalls, call, startApp } from './helpers.js';
import { likePattern } from '../../src/roles/admin/repository.js';

test('adminListAccounts: 200 envelope, both namespaces, DTO only, one read-only snapshot', async () => {
  const rows = [accountRow(), accountRow({ id: PROFILE_ID, actor_kind: 'STUDENT', role: 'SV', identifier: 'SV001', display_name: 'Sinh viên mẫu', student_id: PROFILE_ID })];
  const h = await startApp(ADMIN, sql => sql.includes('count(*)') ? { rows: [{ total: '2' }] } : { rows });
  try {
    const res = await call(h, 'GET', '/accounts');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.meta, { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 });
    assert.deepEqual(res.json.data[0], { id: OTHER_ID, actorKind: 'STAFF', role: 'BQL', identifier: 'bql.demo', displayName: 'Ban quản lý mẫu',
      studentId: null, isLocked: false, createdAt: '2026-10-30T03:00:00.000Z', updatedAt: '2026-10-30T03:00:00.000Z' });
    assert.equal(res.json.data[1].studentId, PROFILE_ID);
    assertNoSecrets(res.text);
    const begin = h.db.calls.indexOf('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    assert.ok(begin >= 0, 'list and count share one snapshot');
    assert.ok(h.db.calls.slice(begin).some(sql => sql.includes('count(*)')));
    assert.ok(!h.db.calls.some(sql => sql.includes('pg_advisory_xact_lock')), 'GET never takes the global write lock');
    assert.ok(h.db.calls.includes('COMMIT'));
    assert.deepEqual(h.db.released, [false]);
  } finally { await h.close(); }
});

test('adminListAccounts: filters combine with AND, q is trimmed and LIKE-escaped, page beyond end keeps meta', async () => {
  let listParams: unknown[] = [];
  const h = await startApp(ADMIN, (sql, params) => {
    if (sql.includes('count(*)')) return { rows: [{ total: '41' }] };
    listParams = params; return { rows: [] };
  });
  try {
    const res = await call(h, 'GET', '/accounts?page=9&pageSize=5&q=%20a%25_b%20&actorKind=STAFF&role=BQL&isLocked=false');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { data: [], meta: { page: 9, pageSize: 5, totalItems: 41, totalPages: 9 } });
    assert.deepEqual(listParams, ['STAFF', 'BQL', false, '%a\\%\\_b%', 5, '40']);
    const sql = businessCalls(h.db).find(s => s.includes('LIMIT'))!;
    assert.match(sql, /ORDER BY created_at DESC, id ASC, actor_kind ASC/);
    const empty = await call(h, 'GET', '/accounts?q=%20%20');
    assert.equal(empty.status, 200);
    assert.equal(listParams[3], null, 'blank q means no filter');
  } finally { await h.close(); }
  assert.equal(likePattern('50%_\\x'), '%50\\%\\_\\\\x%');
});

test('adminListAccounts: empty result uses totalPages 0', async () => {
  const h = await startApp(ADMIN, sql => sql.includes('count(*)') ? { rows: [{ total: '0' }] } : { rows: [] });
  try {
    const res = await call(h, 'GET', '/accounts');
    assert.deepEqual(res.json, { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
  } finally { await h.close(); }
});

test('adminListAccounts: query allowlist and scalar parsing reject with 422 before any SQL', async () => {
  const h = await startApp(ADMIN, () => { throw new Error('must not query'); });
  try {
    for (const query of ['page=0', 'page=01', 'page=1.5', 'page=-1', 'pageSize=101', 'pageSize=0', 'isLocked=1', 'isLocked=TRUE',
      'role=sv', 'actorKind=ADMIN', 'sort=createdAt', 'studentId=x', 'page=1&page=2', 'role[]=SV', `q=${'x'.repeat(101)}`]) {
      const res = await call(h, 'GET', `/accounts?${query}`);
      assert.equal(res.status, 422, query);
      assert.equal(res.json.error.code, 'VALIDATION_ERROR');
      assert.ok(Array.isArray(res.json.error.details));
    }
    // Boundary: 100 code points passes validation and reaches the (throwing) fake DB -> safe 500, not 422.
    const boundary = await call(h, 'GET', `/accounts?q=${encodeURIComponent('ộ'.repeat(100))}`);
    assert.equal(boundary.status, 500);
    assert.equal(boundary.json.error.code, 'INTERNAL_ERROR');
  } finally { await h.close(); }
});

test('adminListAccounts: unauthenticated, locked and non-ADMIN callers are rejected without reading accounts', async () => {
  await assertAuthMatrix('GET', '/accounts');
});
