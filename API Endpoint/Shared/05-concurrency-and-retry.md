# Giao dịch và retry

Mọi mutation nghiệp vụ, bao gồm cấp/khóa account, sửa profile/room/period, gửi đơn, duyệt/từ chối, nhận/hủy/trả và thu phí, dùng `withBusinessTransaction(pool, identity, callback(client, actor))` từ backend Shared. Một PoolClient duy nhất BEGIN READ COMMITTED -> `SELECT pg_advisory_xact_lock(724006,1)` là câu lệnh nghiệp vụ đầu tiên -> recheck account/khóa/version -> đọc trạng thái -> validate -> ghi -> COMMIT. Rollback toàn bộ khi lỗi, luôn release client. Không gọi pool.query cho từng bước trong transaction.

Khóa coarse-grained được chọn cho prototype để các module không dùng thứ tự khóa khác nhau. GET không khóa; 20 người tra cứu vẫn đọc đồng thời. Chưa tuyên bố đạt NFR hiệu năng; đo sau triển khai. Xem protocol chi tiết và trigger bảo vệ ở [SQL](../../SQL/04-transactions-and-locking.md).

| Tình huống | Kết quả HTTP/dữ liệu |
|---|---|
| Hai đơn chiếm chỗ cuối | Một approve200, một409 ROOM_FULL; không duyệt dở |
| Duyệt và từ chối cùng đơn | Một200, một409 INVALID_STATE |
| Hai đơn mới cùng SV | Một201, một409 PENDING_APPLICATION_EXISTS |
| Lập phiếu trùng residence | Một201, một409 RECEIPT_ALREADY_EXISTS |
| Nhận/trả/hủy/pay lặp |409 INVALID_STATE; không đổi audit/chỗ/tiền lần2 |
| Lock/period cùng trạng thái hiện tại |409 INVALID_STATE |
| Mất response saucommit | Tải lại GET tương ứng; retry ghi không tạo bản sao |
| Logout đã hết phiên |204 với Origin hợp lệ; ngoại lệ auth đã ghi |

Không Idempotency-Key. PATCH dữ liệu mô tả không đổi giá trị được trả200; các action chuyển trạng thái không dùng chính sách này. Deadlock/serialization/unavailable DB: rollback, trả503 SERVICE_UNAVAILABLE, không tự replay mutation ở middleware. Lỗi unique/FK/check/trigger phải map sang error công khai theo tên constraint do SQL dictionary quy định; không trả raw PostgreSQL. Account khóa không làm hồi tác mutation đã commit. Đổi mật khẩu tăng session_version, các phiên cũ bị từ chối; phiên hiện tại được regenerate với version mới.

Callback service phải kiểm tra actor.role vừa đọc lại đúng role operation trước mọi đọc/ghi nghiệp vụ; resolveActor chỉ xác nhận account có role hợp lệ, không biết operation đang cần SV/BQL/ADMIN. Ví dụ task BQL phải từ chối403 FORBIDDEN nếu actor.role không phải BQL. Không dùng actor cũ từ trước khi chờ khóa để ghi audit hoặc quyết định quyền.
