# Hoàn thiện Shared cho SV — 02/11/2026

Owner/reviewer: Bùi Thế Anh; thực hiện: Codex. Nguồn: chủ dự án yêu cầu hoàn thiện helper đọc/timestamp được nêu sau review, commit ký và push riêng api-students. Không merge hoặc approve PR.

Phạm vi: Shared DB/HTTP helper, consumer SV, test Shared/SV và tài liệu định dạng. Không sửa implementation hoặc test riêng ADMIN/BQL, không đổi DB schema/endpoint/quyền. Source ban đầu f4b6e2a; worktree đã kiểm sạch, remote khớp.

Kế hoạch đủ thực hiện trọn: (1) tách withReadSnapshot giữ nguyên transaction/rollback/release; (2) dùng formatter timestamp UTC có 3 chữ số mili giây, khớp ADMIN/BQL hiện tại; (3) kiểm build/unit, snapshot PostgreSQL/HTTP thật và bản ghép tạm ba role; (4) ghi kết quả, commit đúng file trên api-students và push.

Lựa chọn timestamp là DELEGATED_SELECTION trong yêu cầu hoàn thiện của chủ dự án: giữ độ chính xác mili giây, không cắt thời gian để khớp ví dụ minh họa không có lẻ giây; contract date-time/UTC vẫn giữ nguyên. Ngày nghiệp vụ YYYY-MM-DD và giá trị DB không đổi. Ví dụ JSON cũ vẫn là ISO8601 hợp lệ; frontend dùng chuỗi date-time, không so định dạng bằng độ dài.

Checkpoint: bắt đầu sửa helper và consumer. Kiểm chứng dự kiến: commit/rollback/acquire/BEGIN/COMMIT lỗi, lỗi rollback không che lỗi gốc, snapshot ổn định khi writer khác commit và không lấy write lock; timestamp HTTP giữ đúng mili giây từ DB, cùng dạng với ADMIN/BQL trong bản ghép tạm. Chưa ghi PASS trước khi chạy.

## Checkpoint hoàn tất triển khai và kiểm thử

Đã tách helper, SV không còn bản private, mapper dùng formatter UTC có mili giây. Build/unit SV 62/62 PASS; integration SV/Shared 11/11 PASS trên PostgreSQL thật. Bản ghép tạm với ADMIN/BQL: build PASS, unit 100/100, integration 27/27, system 2/2; tổng 129/129 PASS, không skip. Snapshot với writer độc lập và timestamp HTTP/DB đã kiểm trực tiếp. Không đổi schema/quyền/nhánh khác, không để lại source sửa dở.

[Báo cáo bổ sung](../../reports/2026-11-02-api-students-shared-followup.md) ghi quyết định timestamp, file và kết quả. Bước tiếp theo đã được chủ dự án cho phép: kiểm phạm vi file, commit ký bằng khóa hiện có và push đúng api-students; không merge/approve PR. Các câu checkpoint bắt đầu phía trên được giữ làm lịch sử của task.
