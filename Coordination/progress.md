Task / role / người phụ trách: SV-01 / SV / (người được giao role SV)
Cập nhật lúc: 02/11/2026 (giờ VN)
Contract revision / file plan: 1.0.0 / Coordination/tasks/SV-01/plan.md
Phạm vi được giao / file được phép sửa: P1 (6 operation). Chỉ backend/src/roles/student/, backend/tests/student/, backend/tests/integration/student/, Coordination/tasks/SV-01/. KHÔNG sửa app.ts, shared/**, SQL/**, package*.json.
Giai đoạn hiện tại: P1 — đã xong phần code của tôi
Trạng thái: READY_FOR_REVIEW (đề nghị READY_FOR_OWNER). Chưa DONE.

Operation đã triển khai và trạng thái kiểm chứng từng operation:
  - studentGetProfile  GET /profile              : build+unit PASS; DB NOT_RUN_PENDING_OWNER
  - studentUpdateContact PATCH /profile          : build+unit PASS; DB NOT_RUN_PENDING_OWNER
  - studentListBuildings GET /buildings          : build+unit PASS; DB NOT_RUN_PENDING_OWNER
  - studentListRooms   GET /rooms                : build+unit PASS; DB NOT_RUN_PENDING_OWNER
  - studentGetRoom     GET /rooms/{roomId}       : build+unit PASS; DB NOT_RUN_PENDING_OWNER
  - studentGetPeriod   GET /registration-period  : build+unit PASS; DB NOT_RUN_PENDING_OWNER
File/hàm đã sửa; route đã nối: backend/src/roles/student/{validation,repository,service,controller,router}.ts — 6 route nối trong router.ts.
Test/command đã chạy, kết quả và môi trường thực tế:
  - `npm run check` trong sandbox của AI: Node v22.22.2 / npm 10.9.7 (KHÔNG phải Node 24/npm 11 của dự án): build PASS, 52/52 test độc lập PASS (15 có sẵn + 37 mới), 0 skipped/todo.
  - Kiểm tra đột biến (phá code có chủ đích) trên test độc lập: lỗi bị bắt ở các phép đổi ownership/ACTIVE, bỏ strict allowlist, GET dùng khóa ghi, luôn UPDATE, bỏ check role.
  - Thông tin tham khảo (KHÔNG thay nghiệm thu của Anh): AI dựng PostgreSQL 16 tạm trong sandbox, nạp SQL/schema.sql + SQL/tests/invariants.sql (PASS), chạy 22 test tích hợp student: 22/22 PASS; phá code có chủ đích làm test fail như mong đợi. Máy/DB đó đã bỏ, không phải DB của Anh.
Test chưa chạy và lý do:
  - Test tích hợp trên máy/DB của Anh (NOT_RUN_PENDING_OWNER).
  - Test đi qua login thật: AUTH-01 chưa có (test tích hợp dùng phiên được tạo thẳng trong store, không phải bằng chứng login).
  - NFR-02 (hiệu năng) chưa đo.
Test DB/tích hợp giao Anh (NOT_RUN_PENDING_OWNER): backend/tests/integration/student/{studentGetProfile,studentUpdateContact,studentListBuildings,studentListRooms,studentGetRoom,studentGetPeriod}.test.ts (+ db-helpers.ts). Cách chạy: xem handoff-P1.md.
Phần đang làm dở, lỗi còn lại, code chưa nối: không có dang dở. Lưu ý: route P1 trả 500 INTERNAL_ERROR cho tới khi createApp đặt `app.locals.pool = options.pool` (phụ thuộc Shared).
Phụ thuộc thiếu / quyết định cần người giao việc: (1) Anh/Shared owner thêm 1 dòng vào app.ts; (2) AUTH-01; (3) quyết định có chuyển withReadSnapshot sang shared/db không.
Các giai đoạn/operation còn lại: P2 (5 op), P3 (2 op) — chưa được giao.
Bước tiếp tục chính xác: sau khi Anh review P1 → "Tiếp tục SV-01 giai đoạn P2: studentCreateApplication, studentListApplications, studentGetApplication, studentListResidences, studentGetResidence".
Những điều cần giữ nguyên khi tiếp tục: layer router→controller→service→repository; export theo operationId; GET dùng withReadSnapshot (REPEATABLE READ READ ONLY, không khóa ghi); mutation chỉ qua withBusinessTransaction; studentId lấy từ actor; DTO/timestamp mapper trong repository.ts; không sửa Shared/schema.
Đề xuất prompt tiếp: Tiếp tục task SV-01 giai đoạn P2; đọc checkpoint Coordination/tasks/SV-01/progress.md và đối chiếu diff trước khi sửa.
