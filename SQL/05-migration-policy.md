# Chính sách schema và migration

Revision 1.0.0. Chọn **SQL migration có thứ tự, chạy bằng psql với ON_ERROR_STOP**, không ORM auto-sync. `SQL/schema.sql` là snapshot chuẩn cho database mới; `SQL/migrations/NNNN_description.sql` chỉ xuất hiện khi có thay đổi tiếp theo được giao. Không tạo bản sao migration số 0001 chứa cùng DDL ở lượt này.

## Dựng mới và nâng cấp

- Database mới: chạy snapshot một lần theo README. Lưu revision 1.0.0 và SHA-256 của snapshot trong biên bản môi trường/bàn giao.
- Database đã dựng 1.0.0: không chạy lại snapshot và không xóa DB. Tạo migration mới có điều kiện trước, tác động dữ liệu, transaction, rollback/restore plan và checksum. Điều phối viên review rồi người vận hành chạy.
- Khi có migration đầu tiên: tạo bảng ledger `schema_migrations(version,checksum,applied_at)` bằng migration được review; baseline 1.0.0 phải được ghi nhận sau khi xác minh schema hiện có. Không tự đánh dấu baseline cho DB không rõ nguồn.
- Cùng lúc cập nhật snapshot, dictionary, API DTO, error mapping, Business Rules và tests. Kiểm tra dựng mới từ snapshot và nâng cấp từ baseline cho kết quả tương đương.
- Không đổi file migration đã được áp dụng; bổ sung migration sửa lỗi mới. Không dùng `IF NOT EXISTS` để biến schema drift thành “thành công”.

## Mẫu nội dung migration

1. Task, nguồn quyết định, revision trước/sau, người phụ trách/rà soát.
2. Backup/restore đã chuẩn bị, database mục tiêu đã xác minh, dữ liệu giả cho test.
3. DDL/DML và mapping field; null/default/backfill; khóa có thể ảnh hưởng thời gian chạy.
4. Điều kiện kiểm tra sau chạy và test nâng cấp/đồng thời.
5. Thay đổi consumer frontend/API/seed; hướng quay lại nếu thất bại.

Không tự chạy migration trên PostgreSQL đang cài của người dùng. Docker Compose/database credentials thật do task vận hành quyết định, không đưa password thật vào repo.
