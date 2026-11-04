# Frontend Management

04/11/2026 — OWNER_CONFIRMED: người dùng duyệt prototype và giao hiện thực toàn bộ frontend Management, commit và push nhánh có sẵn frontend/management-pages. Ủy quyền Git này thay giới hạn không tự commit/push cho riêng task; không merge/deploy. Owner/reviewer: Bùi Thế Anh; thực hiện: Codex. Contract 1.0.0; FR-02/03/05/06/07/08, QT-02..05/09..17.

Phạm vi: frontend/src/app/management, components/management, lib/management; nối điều hướng đăng nhập BQL; tests/e2e và tài liệu bàn giao. Không thay backend/SQL/API/auth protocol. Thiết kế đã duyệt tại designs/dormflow-management. Artifact không được đưa vào commit frontend vì đang là dữ liệu untracked có sẵn và không phải source ứng dụng.

Kế hoạch: (1) consumer/validation theo schema và shell BQL, hồ sơ/tòa/phòng/kỳ; (2) đơn/xếp phòng/lưu trú; (3) phiếu thu/thống kê/security; (4) lint/typecheck/unit/build, browser tests, review diff; (5) commit/push đúng nhánh. Bảo vệ mutation lặp, stale response, 401/403, 409/422 và outcome không rõ phải đọc lại. Kiểm thử frontend qua HTTP giả lập không thay kiểm chứng transaction PostgreSQL của backend.

Baseline 595d8185; nhánh remote đã có, worktree không có sửa tracked; designs/ untracked được giữ. Checkpoint: đang triển khai, chưa ghi PASS.

## Hoàn tất frontend và kiểm thử

Đã hiện thực frontend cho 28 operation BQL, bảo vệ layout STAFF/BQL, nối điều hướng login; shell Campus Modern, hồ sơ/tòa/phòng/kỳ, duyệt/từ chối, nhận/hủy/trả, lập/thu phiếu và thống kê đúng bốn chỉ số. Đổi mật khẩu/logout dùng Shared transport hiện có. Đầu ra gồm source frontend, schema/types sinh từ đặc tả, unit/e2e và frontend/MANAGEMENT.md. Không đổi backend, SQL, API hoặc role khác.

Kiểm chứng: production build và typecheck PASS; lint PASS; 74/74 test độc lập PASS; 26/26 trình duyệt PASS (12 Management và 14 hồi quy Admin), không skip. Đã xem ảnh desktop/mobile; không tràn ngang viewport, bảng cuộn vùng riêng. Ca chuỗi duyệt → nhận → lập phiếu → thu đủ → trả PASS. Đã sửa trả focus sau đóng dialog, liên kết label bộ lọc, kiểm chứng payload và mất phản hồi ghi. Source test dùng API giả, không đưa mock vào ứng dụng. Chưa chạy frontend với API/PostgreSQL thật: NOT_RUN_PENDING_OWNER; các kiểm tra transaction/concurrency DB phải review khi tích hợp.

Trạng thái: READY_FOR_OWNER_REVIEW cho frontend. Bước được người dùng ủy quyền tiếp theo: commit đúng source/test/docs của task và push origin/frontend/management-pages; không merge/deploy. designs/ không stage. Chi tiết thao tác và giới hạn tại frontend/MANAGEMENT.md.
