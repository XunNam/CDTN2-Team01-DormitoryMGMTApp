# Hướng dẫn Agent phụ trách dữ liệu

Tuân thủ [AGENTS gốc](../AGENTS.md). Revision đặc tả 1.0.0; đã được giao tạo schema theo prompt hiện tại. Không commit/push/merge và không kết nối DB thật của người dùng khi chưa có task riêng.

1. Nếu chưa biết task/role của người giao việc, hỏi lại họ trước khi sửa code. `SV`, `BQL`, `ADMIN` là phạm vi API; **không role nào được tự sửa schema chung** chỉ vì đang làm API của role đó. Điều phối viên giao task SQL riêng.
2. Đọc [schema.sql](schema.sql), [dictionary](01-data-dictionary.md), [transaction](04-transactions-and-locking.md), [chuẩn dữ liệu API](<../API Endpoint/Shared/schemas.json>) và [quy tắc](<../Business Rules/README.md>).
3. `schema.sql` là snapshot dựng mới chuẩn. DDL có dữ liệu cần migration được điều phối theo [chính sách](05-migration-policy.md); không tạo Prisma/ORM schema tự động hay một DB khác theo người làm.
4. Chỉ người được giao SQL sửa `SQL/`. Agent role đặt SQL tham số hóa trong repository của role theo hướng dẫn backend; không đặt truy vấn trong router/controller, không nối chuỗi input vào SQL.
5. Mọi business write bắt đầu `BEGIN ISOLATION LEVEL READ COMMITTED` rồi `SELECT pg_advisory_xact_lock(724006,1)` trước mọi read/check. Cùng connection xuyên transaction. Đọc lại actor sau khóa; không dùng role/ownership từ client.
6. Hai kho account và profile độc lập; UUID, tiền BIGINT/chuỗi JSON, trạng thái và ngày giờ phải giữ đúng chuẩn. Không lưu số chỗ còn lại làm counter.
7. Giữ partial unique, FK RESTRICT, triggers trạng thái/metadata/snapshot và deferred approval/residence pair. Không tắt constraint/trigger để seed dễ hơn. Không hard-delete lịch sử.
8. Trước bàn giao chạy kiểm tra static, rồi chạy SQL tests trên DB mới tách biệt nếu có runtime. Chưa chạy phải ghi `NOT_RUN`; không báo runtime đạt từ việc đọc SQL.
9. Thay đổi ảnh hưởng DTO/enum/lock/giá/quyền phải được điều phối cùng API, Business Rules và test, có người khác rà soát trước tích hợp.

## Kiểm thử khi máy thành viên không có PostgreSQL

Theo [phân công kiểm thử](../Coordination/testing-responsibilities.md), thành viên chỉ cần Node.js 24/npm 11 để triển khai, viết test và chạy build/unit. Không yêu cầu cài PostgreSQL hoặc dừng role vì thiếu database. Vẫn viết test DB/tích hợp tại backend/tests/integration/<role>/ và bàn giao fixture, lệnh, expected result; ghi NOT_RUN_PENDING_OWNER để Bùi Thế Anh chạy trên máy Anh. READY_FOR_OWNER không đồng nghĩa DONE; test cạnh tranh/database thật vẫn bắt buộc trước nghiệm thu tương ứng.
