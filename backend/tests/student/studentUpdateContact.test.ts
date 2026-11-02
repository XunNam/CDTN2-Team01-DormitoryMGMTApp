import assert from 'node:assert/strict';
import test from 'node:test';
import { STUDENT_A, assertNoLeak, patch, profileRow, withApp } from './helpers.js';

const URL_PATH = '/api/v1/student/profile';
const isSelect = (sql: string) => /^SELECT/.test(sql.trim()) && /FROM student_profiles/.test(sql);
const isUpdate = (sql: string) => /^UPDATE student_profiles/.test(sql.trim());

function handlerFor(current = profileRow()) {
  return (sql: string, params: unknown[]) => {
    if (isSelect(sql)) return [current];
    if (isUpdate(sql)) {
      const next = { ...current };
      const sets = /SET (.*) WHERE/.exec(sql)![1].split(', ');
      for (const set of sets) {
        const [col, ph] = set.split(' = ');
        next[col] = params[Number(ph.slice(1)) - 1];
      }
      return [next];
    }
    return undefined;
  };
}

test('studentUpdateContact updates phone+email inside the business transaction, ownership from session', async () => {
  await withApp({ handler: handlerFor() }, async h => {
    const res = await patch(h, URL_PATH, { phone: '+84900000000', email: 'sv.demo@example.test' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.phone, '+84900000000');
    assert.equal(res.body.data.email, 'sv.demo@example.test');
    assert.equal(res.body.data.fullName, 'Sinh viên mẫu', 'other fields untouched');
    const clientSqls = h.pool.calls.filter(c => c.via === 'client').map(c => c.sql);
    assert.equal(clientSqls[0], 'BEGIN ISOLATION LEVEL READ COMMITTED');
    assert.equal(clientSqls[1], 'SELECT pg_advisory_xact_lock(724006, 1)', 'lock is the first statement after BEGIN');
    assert.equal(clientSqls.at(-1), 'COMMIT');
    const update = h.pool.calls.find(c => isUpdate(c.sql))!;
    assert.deepEqual(update.params, [STUDENT_A, '+84900000000', 'sv.demo@example.test']);
    assert.match(update.sql, /SET phone = \$2, email = \$3 WHERE id = \$1/);
    assert.ok(!/role|gender|student_code/.test(update.sql.replace(/RETURNING[\s\S]*/, '')), 'only contact columns are written');
  });
});

test('studentUpdateContact: omitted field keeps value, null clears, input is trimmed', async () => {
  await withApp({ handler: handlerFor(profileRow({ phone: '0900000000', email: 'old@example.test' })) }, async h => {
    const onlyEmail = await patch(h, URL_PATH, { email: '  new@example.test ' });
    assert.equal(onlyEmail.body.data.email, 'new@example.test');
    assert.equal(onlyEmail.body.data.phone, '0900000000');
    const update = h.pool.calls.find(c => isUpdate(c.sql))!;
    assert.match(update.sql, /SET email = \$2 WHERE/);
    assert.ok(!/phone = /.test(update.sql.replace(/RETURNING[\s\S]*/, '')));
  });
  await withApp({ handler: handlerFor(profileRow({ phone: '0900000000', email: 'old@example.test' })) }, async h => {
    const cleared = await patch(h, URL_PATH, { phone: null });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.body.data.phone, null);
    assert.equal(cleared.body.data.email, 'old@example.test');
    assert.deepEqual(h.pool.calls.find(c => isUpdate(c.sql))!.params, [STUDENT_A, null]);
  });
});

test('studentUpdateContact: identical values return 200 and do not write (updatedAt must not move)', async () => {
  await withApp({ handler: handlerFor(profileRow({ phone: '0900000000', email: 'a@b.co' })) }, async h => {
    const res = await patch(h, URL_PATH, { phone: '0900000000', email: 'a@b.co' });
    assert.equal(res.status, 200);
    assert.equal(h.pool.calls.some(c => isUpdate(c.sql)), false);
    assert.ok(h.pool.sqls.includes('COMMIT'));
  });
});

test('studentUpdateContact rejects forbidden/unknown fields, wrong types and bad values with 422 and no transaction', async () => {
  const bad: Array<[string, unknown]> = [
    ['gender extra', { phone: '0900000000', gender: 'FEMALE' }],
    ['role extra', { phone: '0900000000', role: 'ADMIN' }],
    ['studentId extra', { phone: '0900000000', studentId: '44444444-4444-4444-8444-444444444444' }],
    ['fullName extra', { fullName: 'X' }],
    ['empty object', {}],
    ['phone number type', { phone: 900000000 }],
    ['email number type', { email: 5 }],
    ['phone too short', { phone: '123456' }],
    ['phone too long', { phone: '1'.repeat(21) }],
    ['phone letters', { phone: '09abc00000' }],
    ['phone blank', { phone: '   ' }],
    ['email blank', { email: '' }],
    ['email no at', { email: 'abc.example.test' }],
    ['email no dot', { email: 'a@b' }],
    ['email spaces', { email: 'a b@c.co' }],
    ['email too long', { email: `${'a'.repeat(250)}@b.co` }],
    ['array body field', { phone: ['0900000000'] }],
  ];
  await withApp({ handler: handlerFor() }, async h => {
    for (const [label, body] of bad) {
      const res = await patch(h, URL_PATH, body);
      assert.equal(res.status, 422, label);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR', label);
      assert.ok(Array.isArray(res.body.error.details) && res.body.error.details.length > 0, `${label}: details`);
    }
    const q = await patch(h, `${URL_PATH}?studentId=x`, { phone: '0900000000' });
    assert.equal(q.status, 422);
    assert.equal(h.pool.connects, 0, 'validation failures never open a transaction');
    assert.equal(h.pool.domainCalls.length, 0);
  });
});

test('studentUpdateContact boundaries that must pass: 7 and 20 digits, leading +, 254-char email', async () => {
  const email254 = `${'a'.repeat(254 - '@b.co'.length)}@b.co`;
  assert.equal([...email254].length, 254);
  for (const body of [{ phone: '1234567' }, { phone: '1'.repeat(20) }, { phone: `+${'1'.repeat(20)}` }, { email: email254 }]) {
    await withApp({ handler: handlerFor() }, async h => {
      const res = await patch(h, URL_PATH, body);
      assert.equal(res.status, 200, JSON.stringify(body).slice(0, 40));
    });
  }
});

test('studentUpdateContact: transport and CSRF rules from Shared still apply before role/validation', async () => {
  await withApp({}, async h => {
    assert.equal((await patch(h, URL_PATH, { phone: '0900000000' }, { origin: 'http://evil.test' })).body.error.code, 'ORIGIN_FORBIDDEN');
    assert.equal((await patch(h, URL_PATH, { phone: '0900000000' }, { origin: null })).body.error.code, 'ORIGIN_FORBIDDEN');
    assert.equal((await patch(h, URL_PATH, { phone: '0900000000' }, { csrf: null })).body.error.code, 'CSRF_INVALID');
    assert.equal((await patch(h, URL_PATH, { phone: '0900000000' }, { csrf: 'x'.repeat(64) })).body.error.code, 'CSRF_INVALID');
    assert.equal((await patch(h, URL_PATH, '{broken', { raw: true })).body.error.code, 'INVALID_JSON');
    assert.equal((await patch(h, URL_PATH, [], {})).status, 422);
    assert.equal(h.pool.connects, 0);
  });
});

test('studentUpdateContact: no session 401, locked 401, BQL/ADMIN 403 — nothing read or written', async () => {
  await withApp({}, async h => {
    const res = await patch(h, URL_PATH, { phone: '0900000000' }, { cookie: false });
    assert.equal(res.status, 403, 'without a session there is no CSRF token to match (Shared order: CSRF before auth)');
  });
  await withApp({ lockedAt: [true] }, async h => {
    const res = await patch(h, URL_PATH, { phone: '0900000000' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'ACCOUNT_LOCKED');
    assert.equal(h.pool.connects, 0);
  });
  for (const role of ['BQL', 'ADMIN'] as const) {
    await withApp({ actorKind: 'STAFF', role }, async h => {
      const res = await patch(h, URL_PATH, { phone: '0900000000' });
      assert.equal(res.status, 403, role);
      assert.equal(res.body.error.code, 'FORBIDDEN');
      assert.equal(h.pool.connects, 0);
      assert.equal(h.pool.domainCalls.length, 0);
    });
  }
});

test('studentUpdateContact rechecks the account AFTER the lock: locked in the meantime => 401, no write', async () => {
  await withApp({ lockedAt: [false, true], handler: handlerFor() }, async h => {
    const res = await patch(h, URL_PATH, { phone: '0911111111' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'ACCOUNT_LOCKED');
    assert.equal(h.pool.calls.some(c => isUpdate(c.sql)), false);
    assert.ok(h.pool.sqls.includes('ROLLBACK'));
  });
});

test('studentUpdateContact: profile gone => 404 and rollback; DB CHECK violation maps to 422; unknown DB error is 500 without leak', async () => {
  await withApp({ handler: () => [] }, async h => {
    const res = await patch(h, URL_PATH, { phone: '0911111111' });
    assert.equal(res.status, 404);
    assert.ok(h.pool.sqls.includes('ROLLBACK'));
  });
  const failing = (error: object) => (sql: string) => {
    if (isSelect(sql)) return [profileRow()];
    if (isUpdate(sql)) throw Object.assign(new Error('violates check constraint "student_profiles_email_check" SELECT x'), error);
    return undefined;
  };
  await withApp({ handler: failing({ code: '23514', constraint: 'student_profiles_email_check' }) }, async h => {
    const res = await patch(h, URL_PATH, { email: 'ok@example.test' });
    assert.equal(res.status, 422);
    assert.equal(res.body.error.details[0].field, 'email');
    assertNoLeak(JSON.stringify(res.body));
    assert.ok(h.pool.sqls.includes('ROLLBACK'));
    assert.ok(!h.pool.sqls.includes('COMMIT'));
  });
  await withApp({ handler: failing({ code: 'XX000' }) }, async h => {
    const res = await patch(h, URL_PATH, { email: 'ok@example.test' });
    assert.equal(res.status, 500);
    assert.equal(res.body.error.code, 'INTERNAL_ERROR');
    assertNoLeak(JSON.stringify(res.body));
    assert.ok(h.pool.sqls.includes('ROLLBACK'));
  });
  await withApp({ handler: failing({ code: '40P01' }) }, async h => {
    const res = await patch(h, URL_PATH, { email: 'ok@example.test' });
    assert.equal(res.status, 503, 'deadlock => SERVICE_UNAVAILABLE, rollback, no replay');
    assert.equal(h.pool.calls.filter(c => isUpdate(c.sql)).length, 1, 'mutation is not retried');
  });
});
