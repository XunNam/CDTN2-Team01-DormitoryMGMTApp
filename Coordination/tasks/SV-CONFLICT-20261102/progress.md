# SV — xử lý conflict PR #3 ngày 02/11/2026

Owner/reviewer: Bùi Thế Anh; thực hiện: Codex. Nguồn: yêu cầu chủ dự án kiểm tra hai conflict, giải quyết, commit ký và push api-students. Quyền này bao gồm đồng bộ main vào nhánh SV để giải quyết conflict; không merge hoặc approve PR vào main.

Baseline: api-students `4d8204843cceb4466787dd880324ab451f5d9ee5`; origin/main `c8317fcaa6f1973f24bc389c097b475839d2e26a` đã nhận PR #1 ADMIN và PR #2 BQL. Worktree SV sạch trước khi bắt đầu. Contract revision 1.0.0, DEC-029 giữ nguyên; không đổi operation, schema, quyền hoặc nghiệp vụ.

Phạm vi đủ hoàn thành trong một phiên: đối chiếu hai phía, merge main vào SV, giữ cập nhật Shared mới hơn, chạy build/unit/tích hợp PostgreSQL/system, ghi báo cáo, commit ký và push đúng api-students. Code ADMIN/BQL nhận nguyên từ main.

Checkpoint: đã giải quyết `backend/README.md` bằng cách giữ đoạn helper snapshot/formatter của SV; `backend/tests/integration/shared/harness.ts` giữ kiểm tra timestamp UTC có đúng ba chữ số mili giây. Router BQL factory được Git kết hợp tự động. Đang kiểm chứng toàn bộ ba role trên nhánh SV đã đồng bộ; chưa ghi PASS trước khi chạy. Tiếp theo: cập nhật kết quả, kiểm chữ ký, push và đối chiếu remote.

## Checkpoint sau kiểm thử

Build PASS; unit 100/100, integration PostgreSQL 27/27, system 2/2 PASS, không skip. Kiểm tra đặc tả PASS; không còn file unmerged. Implementation và test riêng ADMIN/BQL, cùng app.ts, khớp origin/main. Không stage cấu hình môi trường hoặc log. [Báo cáo xử lý conflict](../../reports/2026-11-02-api-students-conflict-resolution.md) ghi chi tiết và giới hạn kiểm chứng. Bước tiếp theo đã được cho phép: commit merge có chữ ký, push riêng api-students và kiểm tra remote; không tích hợp PR vào main.
