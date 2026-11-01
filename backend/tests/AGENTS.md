# Hướng dẫn viết kiểm thử

Đọc [AGENTS gốc](../../AGENTS.md), [backend AGENTS](../AGENTS.md) và contract operation. Chỉ sửa trong repo; AI không tự commit/push/merge.

Test role tại `student|management|admin/<operationId>.test.ts`, Shared tại `shared/`. Không xóa/bỏ qua test lỗi để báo đạt. DB test riêng, dữ liệu giả; không đọc credentials DB thật từ file cá nhân. Test cạnh tranh phải tạo hai request/giao dịch chồng lấp trên PostgreSQL thật, không chỉ mock hai lần gọi tuần tự.

Scaffold test dùng MemoryStore và fake DB chỉ dành kiểm tra wiring/middleware. Chúng không chứng minh SRS nghiệp vụ/NFR đạt. Ghi command, kết quả và giới hạn môi trường thực tế vào handoff.

## Kiểm thử khi máy thành viên không có PostgreSQL

Theo [phân công kiểm thử](../../Coordination/testing-responsibilities.md), thành viên chỉ cần Node.js 24/npm 11 để triển khai, viết test và chạy build/unit. Không yêu cầu cài PostgreSQL hoặc dừng role vì thiếu database. Vẫn viết test DB/tích hợp tại backend/tests/integration/<role>/ và bàn giao fixture, lệnh, expected result; ghi NOT_RUN_PENDING_OWNER để Bùi Thế Anh chạy trên máy Anh. READY_FOR_OWNER không đồng nghĩa DONE; test cạnh tranh/database thật vẫn bắt buộc trước nghiệm thu tương ứng.
