# Bàn giao ADMIN-01 cho Bùi Thế Anh

```text
Task / role / người thực hiện / revision: ADMIN-01 / ADMIN / Trần Quốc Vương (AI hỗ trợ) / contract 1.0.0
Trạng thái đề nghị: READY_FOR_OWNER (chưa DONE — chờ Anh review, chạy lại test DB và thêm wiring Pool)
Giai đoạn / phạm vi phiên: toàn bộ 5 operation ADMIN (P1 tra cứu + P2 cấp/khóa)
Các giai đoạn và operation còn lại: không
File checkpoint: Coordination/tasks/ADMIN-01/progress.md

Operation đã triển khai:
- GET   /api/v1/admin/accounts                              adminListAccounts
- GET   /api/v1/admin/accounts/{actorKind}/{accountId}      adminGetAccount
- POST  /api/v1/admin/accounts                              adminCreateAccount
- PATCH /api/v1/admin/accounts/{actorKind}/{accountId}/lock adminSetAccountLock
- GET   /api/v1/admin/student-profiles/candidates           adminListProfileCandidates

Tóm tắt hành vi:
- List/Get gộp student_accounts⨝student_profiles và staff_accounts thành Account DTO; không trả hash/session_version.
  List + count chạy trong một snapshot REPEATABLE READ READ ONLY, không lấy global lock. Sort createdAt DESC, id ASC, actorKind ASC.
  q trim, rỗng = không lọc, ILIKE với `%`/`_`/`\` được escape.
- Get đọc đúng kho theo actorKind, không fallback; studentId không thay được accountId.
- Create: băm Argon2id (m=65536,t=3,p=1,len=32) ngoài vùng khóa, rồi trong withBusinessTransaction: đọc lại actor, assert ADMIN,
  STUDENT → hồ sơ phải tồn tại (404) và chưa có account (409 ACCOUNT_ALREADY_EXISTS); STAFF → username trim+lowercase, trùng 409 DUPLICATE_USERNAME.
  Unique violation (đua) cũng map về đúng 409 theo tên constraint. Mật khẩu không trim, giới hạn 8..128 code point.
- Lock: chỉ đổi is_locked (updated_at do trigger), giá trị trùng hiện tại → 409 INVALID_STATE, không đụng session_version,
  cho Admin tự khóa (Q-17/Q-27), không guard Admin cuối.
- Candidates: chỉ hồ sơ chưa có account, trả {id, studentCode, fullName, hasAccount:false}.

File được tạo/sửa:
- backend/src/roles/admin/{router,validation,controller,service,repository}.ts
- backend/tests/admin/{helpers.ts, <5 operationId>.test.ts}
- backend/tests/integration/admin/{fixtures.ts, README.md, <5 operationId>.test.ts}
- Coordination/tasks/ADMIN-01/{progress.md, handoff.md}; Coordination/task-board.md (dòng ADMIN-01)
Router đã nối: backend/src/roles/admin/router.ts (app.ts đã mount /api/v1/admin + CSRF + requireActor + requireRole('ADMIN')).

DTO/error/auth/schema dùng: Account, ProfileCandidate, AccountQuery, CandidateQuery, AccountCreate, AccountLock (Shared/schemas.json);
VALIDATION_ERROR, NOT_FOUND, ACCOUNT_ALREADY_EXISTS, DUPLICATE_USERNAME, INVALID_STATE, FORBIDDEN, 401 từ guard; schema.sql không đổi.
Transaction/khóa: mutation dùng shared withBusinessTransaction (READ COMMITTED + pg_advisory_xact_lock(724006,1) + đọc lại actor).

Dependency:
- CHƯA CÓ (Shared, chặn chạy thật): app.ts phải thêm `app.locals.pool = options.pool;` sau `const app = express();`.
  Thiếu dòng này mọi API ADMIN trả 503. Không sửa app.ts vì ngoài phạm vi role.
- CHƯA CÓ: AUTH-01 (login/csrf). Frontend chưa gọi được cho tới khi có.
- Đề xuất chuyển withReadSnapshot và hàm hash Argon2id sang shared để SV/BQL/AUTH dùng chung.

Lệnh kiểm tra đã chạy và kết quả thực tế (môi trường AI, Node 22.22, PostgreSQL 16 tạm):
- npm ci; npm run check → build OK, 37/37 unit pass
- TEST_DATABASE_URL=<DB tạm> npm run test:integration → 15/15 pass; dữ liệu fixture được dọn sạch
Ca đã kiểm: input đúng/sai (allowlist query, key lặp, boundary page/pageSize/q/password/username/displayName, UUID, enum, null, body thừa),
chưa login 401, khóa 401, BQL/SV 403, CSRF/Origin 403, namespace, lock lặp 409, tự khóa, request kế tiếp sau khóa 401.
Ca đua/rollback: 2 Admin cấp cùng hồ sơ (201+409, 1 account), cùng username (201+409), 2 lần khóa đồng thời (200+409),
actor bị khóa trong lúc chờ khóa → 401 và không ghi; lỗi nghiệp vụ → ROLLBACK.

Kiểm thử Anh cần chạy lại (NOT_RUN_PENDING_OWNER trên máy Anh): backend/tests/integration/admin/*.test.ts — setup, lệnh, expected result
trong backend/tests/integration/admin/README.md. Kỳ vọng 15/15 pass và không còn dòng tag `it…` trong DB.

Giới hạn còn lại:
- Integration test ghi session thẳng vào bảng sessions (chưa có login). Không phải kiểm chứng luồng đăng nhập.
- Sandbox AI dùng Node 22, chưa chạy trên Node 24; cần `npm run check` lại trên máy thành viên.
Ảnh hưởng UI/role khác/schema/seed: không đổi schema, Shared, SV, BQL. Frontend Admin dùng đúng contract 1.0.0.
Contract/migration thay đổi: không.
Hướng dẫn tái hiện: xem README integration; mọi dữ liệu là dữ liệu giả có tag ngẫu nhiên.
Điều kiện trước merge: thêm dòng app.locals.pool; chạy npm run check + npm run test:integration trên máy Anh; review diff.
Thao tác Git người dùng tự làm: commit lên nhánh api-admins, push, mở PR vào main cho Anh review.
Xác nhận AI chưa tự commit/push/merge/tag/phát hành/triển khai.
```
