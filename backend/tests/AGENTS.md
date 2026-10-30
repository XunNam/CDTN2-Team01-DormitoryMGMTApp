# Hướng dẫn viết kiểm thử

Đọc [AGENTS gốc](../../AGENTS.md), [backend AGENTS](../AGENTS.md) và contract operation. Chỉ sửa trong repo; AI không tự commit/push/merge.

Test role tại `student|management|admin/<operationId>.test.ts`, Shared tại `shared/`. Không xóa/bỏ qua test lỗi để báo đạt. DB test riêng, dữ liệu giả; không đọc credentials DB thật từ file cá nhân. Test cạnh tranh phải tạo hai request/giao dịch chồng lấp trên PostgreSQL thật, không chỉ mock hai lần gọi tuần tự.

Scaffold test dùng MemoryStore và fake DB chỉ dành kiểm tra wiring/middleware. Chúng không chứng minh SRS nghiệp vụ/NFR đạt. Ghi command, kết quả và giới hạn môi trường thực tế vào handoff.
