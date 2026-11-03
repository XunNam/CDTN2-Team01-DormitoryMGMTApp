import assert from "node:assert/strict";
import { test } from "node:test";
import { validateCreate, validatePasswordChange } from "../src/lib/admin/validation.ts";
import { ApiError } from "../src/lib/api/client.ts";
import { adminNotice, serverFields } from "../src/lib/admin/notices.ts";
import { accountKey } from "../src/lib/admin/types.ts";

const student = { accountType: "STUDENT" as const, studentId: "00000000-0000-4000-8000-000000000001", role: "SV" as const, password: "FakeOnly#2026" };
test("requires an existing profile selection and preserves Unicode password semantics", () => {
  assert.ok(validateCreate({ ...student, studentId: "" }).studentId);
  assert.deepEqual(validateCreate({ ...student, password: "🏠".repeat(8) }), {});
  assert.deepEqual(validateCreate({ ...student, password: " ".repeat(8) }), {});
  assert.ok(validateCreate({ ...student, password: "🏠".repeat(129) }).password);
});
test("staff username normalization and role/name boundaries match the API", () => {
  const staff = { accountType: "STAFF" as const, username: "  ADMIN.DEMO  ", displayName: " Người mẫu ", role: "ADMIN" as const, password: student.password };
  assert.deepEqual(validateCreate(staff), {});
  assert.ok(validateCreate({ ...staff, username: "_invalid" }).username);
  assert.ok(validateCreate({ ...staff, username: "a".repeat(51) }).username);
  assert.deepEqual(validateCreate({ ...staff, displayName: "🏠".repeat(150) }), {});
  assert.ok(validateCreate({ ...staff, displayName: "🏠".repeat(151) }).displayName);
});
test("own-password change requires a different new password and matching UI-only confirmation", () => {
  assert.ok(validatePasswordChange("FakeOnly#2026", "FakeOnly#2026", "FakeOnly#2026").newPassword);
  assert.ok(validatePasswordChange("OldFake#2026", "NewFake#2026", "different").repeatPassword);
  assert.deepEqual(validatePasswordChange("OldFake#2026", "NewFake#2026", "NewFake#2026"), {});
});
test("namespace is part of a reference, including identical UUIDs", () => {
  assert.notEqual(accountKey({ actorKind: "STAFF", accountId: student.studentId }), accountKey({ actorKind: "STUDENT", accountId: student.studentId }));
});
test("only allowlisted field copy is displayed and unknown server text stays hidden", () => {
  assert.deepEqual(serverFields(new ApiError("VALIDATION_ERROR", 422, [{ field: "password_hash", message: "private" }, { field: "username", message: "untrusted" }])), { username: "Tên đăng nhập cần 3–50 ký tự hợp lệ." });
  assert.equal(adminNotice(new Error("private")).message.includes("private"), false);
});
