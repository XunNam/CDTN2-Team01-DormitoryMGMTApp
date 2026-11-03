import assert from "node:assert/strict";
import { test } from "node:test";
import { validateLogin } from "../src/lib/auth/validation.ts";
import { AuthError } from "../src/lib/auth/client.ts";
import { getAuthNotice, getServerFieldErrors } from "../src/lib/auth/notices.ts";

const valid = { accountType: "STUDENT" as const, identifier: "SV001", password: "FakeOnly#2026" };

test("requires both fields and counts identifier after trim", () => {
  assert.deepEqual(validateLogin({ ...valid, identifier: "   ", password: "" }), {
    identifier: "Vui lòng nhập mã đăng nhập.",
    password: "Vui lòng nhập mật khẩu.",
  });
  assert.deepEqual(validateLogin({ ...valid, identifier: " " + "A".repeat(50) + " " }), {});
  assert.ok(validateLogin({ ...valid, identifier: "A".repeat(51) }).identifier);
});

test("uses Unicode code points rather than UTF-16 units", () => {
  assert.deepEqual(validateLogin({ ...valid, password: "🏠".repeat(8), identifier: "🏠".repeat(50) }), {});
  assert.ok(validateLogin({ ...valid, password: "🏠".repeat(7) }).password);
  assert.deepEqual(validateLogin({ ...valid, password: "🏠".repeat(128) }), {});
  assert.ok(validateLogin({ ...valid, password: "🏠".repeat(129) }).password);
});

test("does not trim passwords or require numeric/email identifiers", () => {
  assert.deepEqual(validateLogin({ ...valid, password: "        ", identifier: "SV-001_A" }), {});
  assert.deepEqual(validateLogin({ ...valid, accountType: "STAFF", identifier: "staff.name" }), {});
});

test("maps only known validation fields and uses reviewed messages", () => {
  const error = new AuthError("VALIDATION_ERROR", 422, [
    { field: "identifier", message: "untrusted server text" },
    { field: "role", message: "do not render" },
  ]);
  assert.deepEqual(getServerFieldErrors(error), { identifier: "Vui lòng kiểm tra mã đăng nhập (1–50 ký tự)." });
  assert.deepEqual(getServerFieldErrors(new AuthError("INVALID_CREDENTIALS", 401)), {});
});

test("uses generic credential copy and hides unknown backend details", () => {
  assert.match(getAuthNotice(new AuthError("INVALID_CREDENTIALS", 401)).message, /nhóm tài khoản/);
  assert.deepEqual(getAuthNotice(new Error("private internal data")), {
    title: "Chưa thể xử lý yêu cầu",
    message: "Vui lòng thử lại sau.",
    tone: "error",
  });
  assert.equal(getAuthNotice(new AuthError("SESSION_EXPIRED", 401)).tone, "info");
});

