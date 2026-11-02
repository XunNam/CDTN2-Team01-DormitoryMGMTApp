# SV-01 — Kế hoạch theo giai đoạn

Task / role / owner / reviewer: SV-01 / SV / người được giao role SV (sinh viên của nhóm) / Bùi Thế Anh
Contract revision và nguồn yêu cầu: API Endpoint revision 1.0.0 (`Student/API-Contract.md`); FR-02/03/04, QT-03/05/06
Phạm vi operationId đã được giao: người dùng giao **giai đoạn 1 (P1)** ngày 02/11/2026. P2/P3 chưa được giao trong phiên này.
Đánh giá: chia giai đoạn theo ví dụ SV tại `Coordination/phased-execution.md`
Căn cứ: 13 operation; P1 gồm 5 đọc + 1 ghi đơn giản (không cạnh tranh sức chứa); P2 có `studentCreateApplication` (transaction + cạnh tranh) nặng hơn nhiều
Phụ thuộc đã có / chưa có: schema.sql, helper Shared (guard, transaction, response, errors) đã có. AUTH-01 chưa có. Chưa có cách role router lấy Pool (xem handoff-P1).

Giai đoạn P1 — Hồ sơ và danh mục
  OperationId: studentGetProfile, studentUpdateContact, studentListBuildings, studentListRooms, studentGetRoom, studentGetPeriod
  File: backend/src/roles/student/{validation,repository,service,controller,router}.ts; backend/tests/student/*.test.ts; backend/tests/integration/student/*
  Phụ thuộc: AUTH-01 (login thật), `app.locals.pool` trong app.ts
  Test bắt buộc / điều kiện hoàn tất: 6 API đủ validation → repository → service → controller → router; allowlist, ownership, role, filter, response; test cạnh tranh/DB giao Anh
  Trạng thái: code + build + unit xong (READY_FOR_OWNER đề nghị); DB/tích hợp NOT_RUN_PENDING_OWNER

Giai đoạn P2 — Đăng ký và lưu trú (CHƯA LÀM)
  OperationId: studentCreateApplication, studentListApplications, studentGetApplication, studentListResidences, studentGetResidence
  Điều kiện: gửi đơn không giữ chỗ; một đơn PENDING / một residence mở; test cạnh tranh gửi đơn đồng thời
Giai đoạn P3 — Phiếu thu và tích hợp (CHƯA LÀM)
  OperationId: studentListReceipts, studentGetReceipt

Đối chiếu: 6 + 5 + 2 = 13 operation, không thiếu / không dư
Checkpoint: Coordination/tasks/SV-01/progress.md
Bước tiếp theo: Anh review P1; sau khi sửa app.ts (1 dòng) + có AUTH-01 thì chạy test tích hợp; rồi giao P2.
