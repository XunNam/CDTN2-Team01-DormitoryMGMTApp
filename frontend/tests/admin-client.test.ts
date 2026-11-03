import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionClient } from "../src/lib/api/client.ts";
import { createAdminClient } from "../src/lib/admin/client.ts";
import { createAuthClient } from "../src/lib/auth/client.ts";
import type { Account, AccountQuery, CandidateQuery } from "../src/lib/admin/types.ts";
const id = "00000000-0000-4000-8000-000000000001";
const profile = "00000000-0000-4000-8000-000000000002";
const token = "a".repeat(64), rotated = "b".repeat(64);
const account: Account = { id, actorKind: "STUDENT", role: "SV", identifier: "SV001", displayName: "Sinh viên mẫu", studentId: profile, isLocked: false, createdAt: "2026-11-03T02:00:00.000Z", updatedAt: "2026-11-03T02:00:00.000Z" };
const data = (value: unknown) => Response.json({ data: value });
const fail = (status: number, code: string) => Response.json({ error: { code, message: "test" } }, { status });
const paged = (values: unknown[], page = 1, pageSize = 20, totalItems = values.length) => Response.json({ data: values, meta: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) } });
type Step = (url: string, init: RequestInit) => Response | Promise<Response>;
function mock(steps: Step[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher: typeof fetch = async (url, init = {}) => {
    assert.equal(init.credentials, "same-origin"); assert.equal(init.cache, "no-store");
    calls.push({ url: String(url), init });
    const step = steps[calls.length - 1]; assert.ok(step, "Unexpected extra request");
    return step(String(url), init);
  };
  const api = createSessionClient(fetcher);
  return { client: createAdminClient(api), auth: createAuthClient(fetcher, 15_000, api), api, calls };
}

test("list filters combine AND, preserve false, encode literal search and drop unknown query fields", async () => {
  const m = mock([(url, init) => {
    assert.equal(init.method, "GET"); assert.equal(init.body, undefined);
    const q = new URL(url, "http://example.test").searchParams;
    assert.equal(q.get("actorKind"), "STAFF"); assert.equal(q.get("role"), "ADMIN"); assert.equal(q.get("isLocked"), "false");
    assert.equal(q.get("q"), "%_ Name"); assert.equal(q.has("sort"), false);
    return paged([], 1, 5);
  }]);
  await m.client.listAccounts({ page: 1, pageSize: 5, actorKind: "STAFF", role: "ADMIN", isLocked: false, q: "%_ Name", ...{ sort: "name" } });
});
test("contradictory valid filters remain valid and yield the server's empty result", async () => {
  const m = mock([() => paged([], 1, 5)]);
  const page = await m.client.listAccounts({ page: 1, pageSize: 5, actorKind: "STUDENT", role: "ADMIN" });
  assert.equal(page.meta.totalItems, 0);
});
test("candidate requests send only candidate allowlist and return minimal DTO", async () => {
  const m = mock([(url) => { assert.equal(new URL(url, "http://example.test").searchParams.has("role"), false); return paged([{ id: profile, studentCode: "SV001", fullName: "Sinh viên mẫu", hasAccount: false, phone: "not copied" }]); }]);
  const page = await m.client.listCandidates({ page: 1, pageSize: 20, ...{ role: "ADMIN" } } as CandidateQuery);
  assert.deepEqual(Object.keys(page.data[0]).sort(), ["fullName", "hasAccount", "id", "studentCode"]);
});
test("namespace stays in paths and a wrong-source response is rejected", async () => {
  const m = mock([(url) => { assert.equal(url, "/api/v1/admin/accounts/STAFF/" + id); return data(account); }]);
  await assert.rejects(m.client.getAccount({ actorKind: "STAFF", accountId: id }), { code: "UNEXPECTED_RESPONSE" });
});
test("invalid references and oversized search do not make requests", async () => {
  const m = mock([]);
  await assert.rejects(m.client.getAccount({ actorKind: "STUDENT", accountId: "../" }), { code: "NOT_FOUND" });
  await assert.rejects(m.client.listAccounts({ page: 1, pageSize: 5, q: "a".repeat(101) }), { code: "VALIDATION_ERROR" });
  await assert.rejects(m.client.listAccounts({ page: 1, pageSize: 5, isLocked: "false" } as unknown as AccountQuery), { code: "VALIDATION_ERROR" });
  assert.equal(m.calls.length, 0);
});
test("student creation is strict, keeps password untrimmed and never copies secret response fields", async () => {
  const password = " FakeOnly#2026 ";
  const input = { accountType: "STUDENT" as const, studentId: profile, role: "SV" as const, password, ...{ isLocked: true, username: "forbidden" } };
  const m = mock([() => data({ csrfToken: token }), (_url, init) => {
    assert.deepEqual(JSON.parse(String(init.body)), { accountType: "STUDENT", studentId: profile, role: "SV", password });
    assert.equal((init.headers as Record<string, string>)["X-CSRF-Token"], token);
    return data({ ...account, password_hash: "must not reach UI" });
  }]);
  const result = await m.client.createAccount(input);
  assert.equal("password_hash" in result, false); assert.equal(result.isLocked, false);
});
for (const role of ["BQL", "ADMIN"] as const) test("staff creation supports " + role + " without mixing student fields", async () => {
  const staff: Account = { ...account, actorKind: "STAFF", identifier: "staff.demo", displayName: "Nhân sự mẫu", role, studentId: null };
  const m = mock([() => data({ csrfToken: token }), (_url, init) => {
    assert.deepEqual(JSON.parse(String(init.body)), { accountType: "STAFF", username: "staff.demo", displayName: "Nhân sự mẫu", role, password: "FakeOnly#2026" });
    return data(staff);
  }]);
  await m.client.createAccount({ accountType: "STAFF", username: " STAFF.DEMO ", displayName: " Nhân sự mẫu ", role, password: "FakeOnly#2026", ...{ studentId: profile } });
});
test("duplicate profile and username errors are surfaced without any retry", async () => {
  for (const code of ["ACCOUNT_ALREADY_EXISTS", "DUPLICATE_USERNAME"]) {
    const m = mock([() => data({ csrfToken: token }), () => fail(409, code)]);
    await assert.rejects(m.client.createAccount({ accountType: "STUDENT", studentId: profile, role: "SV", password: "FakeOnly#2026" }), { code });
    assert.equal(m.calls.length, 2);
  }
});
test("lost creation response remains unknown and never replays its password", async () => {
  const m = mock([() => data({ csrfToken: token }), () => { throw new TypeError("lost response"); }]);
  await assert.rejects(m.client.createAccount({ accountType: "STUDENT", studentId: profile, role: "SV", password: "FakeOnly#2026" }), { code: "CREATE_OUTCOME_UNKNOWN", ambiguous: true });
  assert.equal(m.calls.length, 2);
});
test("failure before sending a mutation is not treated as a possibly committed write", async () => {
  const m = mock([() => fail(503, "SERVICE_UNAVAILABLE")]);
  await assert.rejects(m.client.createAccount({ accountType: "STUDENT", studentId: profile, role: "SV", password: "FakeOnly#2026" }), { code: "SERVICE_UNAVAILABLE", ambiguous: false });
  assert.equal(m.calls.length, 1);
});
test("proxy failures after POST and malformed success responses remain unknown", async () => {
  for (const reply of [new Response("proxy", { status: 502 }), data({ ...account, role: "ADMIN" })]) {
    const m = mock([() => data({ csrfToken: token }), () => reply]);
    await assert.rejects(m.client.createAccount({ accountType: "STUDENT", studentId: profile, role: "SV", password: "FakeOnly#2026" }), { code: "CREATE_OUTCOME_UNKNOWN" });
  }
});
test("read-back creation searches exact identifier and profile across pages, not another namespace", async () => {
  const other = { ...account, id: "00000000-0000-4000-8000-000000000003", actorKind: "STAFF", role: "ADMIN", studentId: null };
  const m = mock([() => paged([other], 1, 100, 101), () => paged([account], 2, 100, 101), () => data(account)]);
  assert.equal((await m.client.findCreatedAccount({ accountType: "STUDENT", identifier: "SV001", studentId: profile }))?.actorKind, "STUDENT");
  assert.equal(m.calls.length, 3);
});
test("lock and unlock use PATCH boolean only, including false", async () => {
  for (const target of [true, false]) {
    const m = mock([() => data({ csrfToken: token }), (url, init) => {
      assert.equal(url, "/api/v1/admin/accounts/STUDENT/" + id + "/lock");
      assert.equal(init.method, "PATCH"); assert.deepEqual(JSON.parse(String(init.body)), { isLocked: target });
      return data({ ...account, isLocked: target });
    }]);
    assert.equal((await m.client.setAccountLock({ actorKind: "STUDENT", accountId: id }, target)).isLocked, target);
  }
});
test("lock conflicts and lost lock responses are not optimistic successes or automatic retries", async () => {
  const conflict = mock([() => data({ csrfToken: token }), () => fail(409, "INVALID_STATE")]);
  await assert.rejects(conflict.client.setAccountLock({ actorKind: "STUDENT", accountId: id }, true), { code: "INVALID_STATE" });
  const lost = mock([() => data({ csrfToken: token }), () => { throw new TypeError("lost response"); }]);
  await assert.rejects(lost.client.setAccountLock({ actorKind: "STUDENT", accountId: id }, true), { code: "LOCK_OUTCOME_UNKNOWN" });
  assert.equal(lost.calls.length, 2);
});
test("shared auth/admin client uses rotated CSRF after change password and sends no repeat field", async () => {
  const m = mock([() => data({ csrfToken: token }), (_url, init) => {
    assert.deepEqual(JSON.parse(String(init.body)), { currentPassword: "OldFake#2026", newPassword: "NewFake#2026" });
    return new Response(null, { status: 204 });
  }, () => data({ csrfToken: rotated }), (_url, init) => {
    assert.equal((init.headers as Record<string, string>)["X-CSRF-Token"], rotated);
    return data({ ...account, isLocked: true });
  }]);
  assert.deepEqual(await m.auth.changePassword({ currentPassword: "OldFake#2026", newPassword: "NewFake#2026", ...{ repeatPassword: "must not send" } }), { csrfReady: true });
  await m.client.setAccountLock({ actorKind: "STUDENT", accountId: id }, true);
  assert.equal(m.calls.length, 4);
});
test("password 503 may have committed and cannot be reported as rollback", async () => {
  const m = mock([() => data({ csrfToken: token }), () => fail(503, "SERVICE_UNAVAILABLE")]);
  await assert.rejects(m.auth.changePassword({ currentPassword: "OldFake#2026", newPassword: "NewFake#2026" }), { code: "PASSWORD_OUTCOME_UNKNOWN" });
  assert.equal(m.calls.length, 2);
});
test("successful password change stays successful when the following token refresh fails", async () => {
  const m = mock([() => data({ csrfToken: token }), () => new Response(null, { status: 204 }), () => fail(503, "SERVICE_UNAVAILABLE")]);
  assert.deepEqual(await m.auth.changePassword({ currentPassword: "OldFake#2026", newPassword: "NewFake#2026" }), { csrfReady: false });
});
test("forced reauthentication cannot prove a password worked from a pre-existing session", async () => {
  const m = mock([() => data({ csrfToken: token }), () => { throw new TypeError("lost response"); }]);
  await assert.rejects(m.auth.login({ accountType: "STUDENT", identifier: "SV001", password: "FakeOnly#2026" }, undefined, false), { code: "LOGIN_OUTCOME_UNKNOWN" });
  assert.equal(m.calls.length, 2);
});
test("malformed page metadata fails closed", async () => {
  const m = mock([() => Response.json({ data: [account], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 0 } })]);
  await assert.rejects(m.client.listAccounts({ page: 1, pageSize: 20 }), { code: "UNEXPECTED_RESPONSE" });
});
