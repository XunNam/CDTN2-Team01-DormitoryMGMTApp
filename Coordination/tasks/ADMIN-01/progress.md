# Checkpoint ADMIN-01

```text
Task / role / người phụ trách: ADMIN-01 / ADMIN / Trần Quốc Vương (AI hỗ trợ); reviewer: Bùi Thế Anh
Cập nhật lúc: 01/11/2026 13:20 (Asia/Ho_Chi_Minh)
Contract revision / file plan: API Endpoint/System Admin/API-Contract.md revision 1.0.0; Coordination/phased-execution.md (ADMIN/P1 + P2)
Phạm vi được giao / file được phép sửa: backend/src/roles/admin/**, backend/tests/admin/**, backend/tests/integration/admin/**, Coordination/tasks/ADMIN-01/**
Giai đoạn hiện tại: P1 (tra cứu) + P2 (cấp và khóa) làm trong cùng một phiên — 5 operation, khối lượng vừa một phiên
Trạng thái: READY_FOR_REVIEW (đề nghị READY_FOR_OWNER); còn 1 phụ thuộc Shared (xem dưới)

Operation đã triển khai và trạng thái kiểm chứng:
- adminListAccounts            GET   /api/v1/admin/accounts                                 unit pass, integration pass (môi trường AI)
- adminGetAccount              GET   /api/v1/admin/accounts/{actorKind}/{accountId}         unit pass, integration pass (môi trường AI)
- adminCreateAccount           POST  /api/v1/admin/accounts                                 unit pass, integration pass (môi trường AI)
- adminSetAccountLock          PATCH /api/v1/admin/accounts/{actorKind}/{accountId}/lock    unit pass, integration pass (môi trường AI)
- adminListProfileCandidates   GET   /api/v1/admin/student-profiles/candidates              unit pass, integration pass (môi trường AI)

File/hàm đã sửa; route đã nối:
- router.ts: 5 route nối controller.<operationId>
- validation.ts / controller.ts / service.ts: export đúng 5 operationId
- repository.ts: export adminListAccounts/adminGetAccount/adminSetAccountLock/adminListProfileCandidates + helper
  (adminCount*, adminFindProfileForAccount, adminStaffUsernameExists, adminInsertStudentAccount, adminInsertStaffAccount, likePattern)

Test/command đã chạy, kết quả và môi trường thực tế:
- `npm ci` + `npm run check` (Node 22.22 trong sandbox AI; repo yêu cầu Node 24 — cần chạy lại trên máy thành viên): 37/37 pass
  (15 test scaffold có sẵn + 22 test ADMIN mới).
- `npm run test:integration` trên PostgreSQL 16 tạm trong sandbox AI, schema.sql + SQL/tests/invariants.sql áp trên DB trống: 15/15 pass,
  sau khi chạy không còn dòng fixture nào. Đây KHÔNG phải máy Anh; Anh vẫn cần chạy lại.

Test chưa chạy và lý do: không có.
Test DB/tích hợp giao Anh (NOT_RUN_PENDING_OWNER trên máy Anh): backend/tests/integration/admin/*.test.ts — xem README.md cùng thư mục.

Phần đang làm dở, lỗi còn lại, code chưa nối: không.

Phụ thuộc thiếu / quyết định cần người giao việc:
1. [Shared — chặn chạy thật] app.ts chưa đưa Pool cho router role. Code ADMIN đọc `req.app.locals.pool`;
   thiếu thì trả 503 SERVICE_UNAVAILABLE. Đề xuất 1 dòng trong createApp, ngay sau `const app = express();`:
       app.locals.pool = options.pool;
   SV và BQL cũng sẽ cần cùng cơ chế. Unit/integration test hiện tự gán `app.locals.pool` để mô phỏng dòng này.
2. [Shared — AUTH-01] Chưa có login/csrf, nên chưa gọi API thật từ frontend được. Integration test ghi session thẳng vào bảng `sessions`.
3. [Đề xuất, không chặn] Snapshot đọc `withReadSnapshot` (REPEATABLE READ READ ONLY) đang để trong admin/service.ts vì Shared chưa có helper.
   Nên chuyển vào shared/db để SV/BQL dùng chung.
4. [Đề xuất, không chặn] Tham số Argon2id đang khai báo trong admin/service.ts; AUTH-01 nên đưa hàm hash chung vào shared/auth để login/đổi mật khẩu dùng cùng cấu hình.

Các giai đoạn/operation còn lại: không (5/5 operation của role ADMIN).
Bước tiếp tục chính xác: Anh review diff; thêm dòng app.locals.pool (mục 1); chạy `npm run check` và `npm run test:integration`;
khi AUTH-01 xong, thay seedSession() trong tests/integration/admin/fixtures.ts bằng login thật.
Những điều cần giữ nguyên: thứ tự Origin/CSRF → auth → role → validate; mutation qua withBusinessTransaction; khóa lặp trả 409; cho tự khóa.
Đề xuất prompt tiếp: "Tiếp tục ADMIN-01 sau review; đọc Coordination/tasks/ADMIN-01/progress.md và handoff.md, đối chiếu diff trước khi sửa."
```
