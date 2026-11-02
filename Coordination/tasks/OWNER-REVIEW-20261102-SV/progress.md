# Checkpoint review SV — api-students

Ngày 02/11/2026; owner/reviewer Bùi Thế Anh, thực hiện Codex. Nguồn task: chủ dự án giao kiểm/sửa ba nhánh và kết nối PostgreSQL; bao gồm Shared cần thiết. Contract 1.0.0.

Trạng thái: hoàn tất sửa code, kiểm thử và báo cáo; READY_FOR_OWNER_REVIEW. 13/13 operation role; Shared 5/5 trong nhánh. Build PASS, unit 55/55, integration 10/10; bản ghép 121/121. DB public, schema và quyền đã kiểm; probe rollback không đổi dữ liệu nghiệp vụ. NFR-02 local PASS, NFR-03 chờ frontend/Compose.

Kế hoạch đã hoàn thành: rà contract/wiring → triển khai phần Shared/P2/P3 còn thiếu và sửa layering → vùng test PostgreSQL tách biệt → kiểm role và bản ghép/concurrency → báo cáo. Quyền bảng thiếu ban đầu đã được chủ dự án đồng ý cấp cụ thể qua pgAdmin; không đổi owner/superuser. Không giữ session/password trong tài liệu.

Chi tiết file/test/bằng chứng và bước tiếp: [báo cáo role](../../reports/2026-11-02-api-students-review.md), [đánh giá tích hợp](../../reports/2026-11-02-backend-readiness.md). Chủ dự án cần review/commit/push/merge rồi chạy lại bộ test trên main tích hợp. Các source thay đổi nằm đúng worktree; .qa/combined chỉ là bản ghép để kiểm tra.

Không có thao tác sửa dở, không có test bị bỏ qua để báo đạt, không commit/push/merge/tag. Các task/handoff cũ được giữ làm lịch sử, trạng thái hiện hành lấy báo cáo review ngày này.

## Ủy quyền Git tiếp theo — 02/11/2026

Chủ dự án đã yêu cầu commit ký theo từng nhánh, chỉ chọn file liên quan đến role và các phụ thuộc Shared đã được bổ sung cho nhánh; sau đó cho phép push origin. Không merge, không approve PR, không sửa cấu hình ký. Tiêu đề/mô tả commit ghi rõ phần role, phần Shared và kết quả kiểm chứng. Các câu mô tả chưa commit ở checkpoint/báo cáo phía trên là trạng thái tại thời điểm review trước ủy quyền này.
