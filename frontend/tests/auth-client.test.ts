import assert from "node:assert/strict";
import { test } from "node:test";
import { AuthError, createAuthClient } from "../src/lib/auth/client.ts";
import type { Identity } from "../src/lib/auth/types.ts";

const identity: Identity = {
  actorKind: "STUDENT",
  accountId: "00000000-0000-4000-8000-000000000001",
  role: "SV",
  identifier: "SV001",
  displayName: "Sinh viên mẫu",
  studentId: "00000000-0000-4000-8000-000000000002",
};
const input = { accountType: "STUDENT" as const, identifier: " sv001 ", password: " FakeOnly#2026 " };
const csrf = "a".repeat(64);
const rotated = "b".repeat(64);
const data = (value: unknown) => Response.json({ data: value });
const fail = (status: number, code: string) => Response.json({ error: { code, message: "test" } }, { status });
type Step = (url: string, init: RequestInit) => Response | Promise<Response>;

function script(steps: Step[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher: typeof fetch = async (url, init = {}) => {
    assert.equal(typeof url, "string");
    calls.push({ url: String(url), init });
    const step = steps[calls.length - 1];
    assert.ok(step, "Unexpected extra request");
    assert.equal(init.credentials, "same-origin");
    assert.equal(init.cache, "no-store");
    return step(String(url), init);
  };
  return { fetcher, calls };
}

test("login sends only contract fields, preserves password, then rotates CSRF before logout", async () => {
  const mock = script([
    (url, init) => { assert.equal(url, "/api/v1/auth/csrf"); assert.equal(init.method, "GET"); assert.equal(init.body, undefined); return data({ csrfToken: csrf }); },
    (url, init) => {
      assert.equal(url, "/api/v1/auth/login");
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(String(init.body)), { accountType: "STUDENT", identifier: "sv001", password: input.password });
      assert.equal((init.headers as Record<string, string>)["X-CSRF-Token"], csrf);
      assert.equal((init.headers as Record<string, string>)["Content-Type"], "application/json");
      assert.equal((init.headers as Record<string, string>).Origin, undefined);
      return data(identity);
    },
    (url) => { assert.equal(url, "/api/v1/auth/csrf"); return data({ csrfToken: rotated }); },
    (url, init) => {
      assert.equal(url, "/api/v1/auth/logout");
      assert.equal((init.headers as Record<string, string>)["X-CSRF-Token"], rotated);
      assert.equal(init.body, "{}");
      return new Response(null, { status: 204 });
    },
  ]);
  const client = createAuthClient(mock.fetcher);
  assert.deepEqual(await client.login({ ...input, ...{ role: "ADMIN", rememberMe: true } }), { identity, csrfReady: true });
  await client.logout();
  assert.equal(mock.calls.length, 4);
});

test("staff roles come only from the returned Identity", async () => {
  const staff: Identity = { ...identity, actorKind: "STAFF", role: "BQL", identifier: "staff.demo", studentId: null };
  const mock = script([
    () => data({ csrfToken: csrf }),
    (_url, init) => { assert.deepEqual(JSON.parse(String(init.body)), { accountType: "STAFF", identifier: "staff.demo", password: input.password }); return data(staff); },
    () => data({ csrfToken: rotated }),
  ]);
  const result = await createAuthClient(mock.fetcher).login({ ...input, accountType: "STAFF", identifier: "staff.demo" });
  assert.equal(result.identity.role, "BQL");
});

test("invalid credentials are surfaced with no automatic POST retry or identity probe", async () => {
  const mock = script([() => data({ csrfToken: csrf }), () => fail(401, "INVALID_CREDENTIALS")]);
  await assert.rejects(createAuthClient(mock.fetcher).login(input), { code: "INVALID_CREDENTIALS", status: 401 });
  assert.equal(mock.calls.length, 2);
});

test("a failed CSRF refresh does not turn a successful login into a failed login", async () => {
  const mock = script([
    () => data({ csrfToken: csrf }),
    () => data(identity),
    () => fail(503, "SERVICE_UNAVAILABLE"),
    () => data({ csrfToken: rotated }),
    (_url, init) => { assert.equal((init.headers as Record<string, string>)["X-CSRF-Token"], rotated); return new Response(null, { status: 204 }); },
  ]);
  const client = createAuthClient(mock.fetcher);
  assert.deepEqual(await client.login(input), { identity, csrfReady: false });
  await client.logout();
  assert.equal(mock.calls.length, 5);
});

test("recovers a lost login response using me without replaying the password", async () => {
  const mock = script([
    () => data({ csrfToken: csrf }),
    () => { throw new TypeError("network"); },
    (url) => { assert.equal(url, "/api/v1/auth/me"); return data(identity); },
    () => data({ csrfToken: rotated }),
  ]);
  const result = await createAuthClient(mock.fetcher).login(input);
  assert.equal(result.identity.identifier, "SV001");
  assert.equal(mock.calls.filter((call) => call.init.method === "POST").length, 1);
});

test("does not accept an unrelated existing session after a lost login response", async () => {
  const mock = script([
    () => data({ csrfToken: csrf }),
    () => { throw new TypeError("network"); },
    () => data({ ...identity, identifier: "OTHER_STUDENT" }),
  ]);
  await assert.rejects(createAuthClient(mock.fetcher).login(input), { code: "LOGIN_OUTCOME_UNKNOWN" });
  assert.equal(mock.calls.length, 3);
});

test("unknown login outcomes require checking the session rather than replaying login", async () => {
  const mock = script([
    () => data({ csrfToken: csrf }),
    () => { throw new TypeError("network"); },
    () => fail(401, "AUTH_REQUIRED"),
  ]);
  await assert.rejects(createAuthClient(mock.fetcher).login(input), { code: "LOGIN_OUTCOME_UNKNOWN" });
  assert.equal(mock.calls.length, 3);
});

test("CSRF errors invalidate the cached token for the next deliberate submission", async () => {
  const mock = script([
    () => data({ csrfToken: csrf }),
    () => fail(403, "CSRF_INVALID"),
    (url) => { assert.equal(url, "/api/v1/auth/csrf"); return data({ csrfToken: rotated }); },
    (_url, init) => { assert.equal((init.headers as Record<string, string>)["X-CSRF-Token"], rotated); return data(identity); },
    () => data({ csrfToken: "c".repeat(64) }),
  ]);
  const client = createAuthClient(mock.fetcher);
  await assert.rejects(client.login(input), { code: "CSRF_INVALID" });
  await client.login(input);
  assert.equal(mock.calls.length, 5);
});

test("does not post credentials when the CSRF response is invalid", async () => {
  const mock = script([() => data({ csrfToken: "invalid" })]);
  await assert.rejects(createAuthClient(mock.fetcher).login(input), { code: "UNEXPECTED_RESPONSE" });
  assert.equal(mock.calls.length, 1);
});

test("reads current identity and rejects unknown role/namespace combinations", async () => {
  const mock = script([
    () => data(identity),
    () => data({ ...identity, role: "ADMIN" }),
    () => fail(401, "SESSION_EXPIRED"),
  ]);
  const client = createAuthClient(mock.fetcher);
  assert.deepEqual(await client.getCurrentIdentity(), identity);
  await assert.rejects(client.getCurrentIdentity(), { code: "UNEXPECTED_RESPONSE" });
  await assert.rejects(client.getCurrentIdentity(), { code: "SESSION_EXPIRED" });
});

test("proxy/server errors without JSON use generic messages", async () => {
  const mock = script([() => new Response("private proxy error", { status: 502 })]);
  await assert.rejects(createAuthClient(mock.fetcher).getCurrentIdentity(), (error: unknown) => {
    assert.ok(error instanceof AuthError);
    assert.equal(error.code, "SERVICE_UNAVAILABLE");
    assert.equal(error.message.includes("private"), false);
    return true;
  });
});

test("logout lost response is reconciled via me and 204 needs no JSON", async () => {
  const mock = script([
    () => data({ csrfToken: csrf }),
    () => { throw new TypeError("network"); },
    () => fail(401, "AUTH_REQUIRED"),
  ]);
  await createAuthClient(mock.fetcher).logout();
  assert.equal(mock.calls.length, 3);
});

test("times out requests without retrying", async () => {
  const mock = script([(_url, init) => new Promise<Response>((_resolve, reject) => {
    init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  })]);
  await assert.rejects(createAuthClient(mock.fetcher, 5).getCsrfToken(), { code: "REQUEST_TIMEOUT" });
  assert.equal(mock.calls.length, 1);
});

test("a non-JSON forbidden response is not treated as a lost successful login", async () => {
  const mock = script([() => data({ csrfToken: csrf }), () => new Response("forbidden", { status: 403 })]);
  await assert.rejects(createAuthClient(mock.fetcher).login(input), { code: "UNEXPECTED_RESPONSE", status: 403 });
  assert.equal(mock.calls.length, 2);
});

test("a locked account cannot prove that a lost logout actually destroyed the session", async () => {
  const mock = script([
    () => data({ csrfToken: csrf }),
    () => { throw new TypeError("network"); },
    () => fail(401, "ACCOUNT_LOCKED"),
  ]);
  await assert.rejects(createAuthClient(mock.fetcher).logout(), { code: "LOGOUT_OUTCOME_UNKNOWN" });
  assert.equal(mock.calls.length, 3);
});

test("cancels when the mounted page is disposed without treating it as a login failure", async () => {
  const controller = new AbortController();
  const mock = script([(_url, init) => new Promise<Response>((_resolve, reject) => {
    init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  })]);
  const result = createAuthClient(mock.fetcher).getCurrentIdentity(controller.signal);
  controller.abort();
  await assert.rejects(result, { code: "REQUEST_ABORTED" });
  assert.equal(mock.calls.length, 1);
});

