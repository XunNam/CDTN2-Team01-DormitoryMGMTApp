> Các mục bên dưới là biên bản scaffold lịch sử. Kết quả code/DB hiện hành ngày 02/11/2026 nằm trong [báo cáo review backend](../Coordination/reports/2026-11-02-backend-readiness.md).

# Kiểm chứng scaffold

Ngày 30/10/2026, revision đặc tả1.0.0. Node24.22.1, npm11.16.0. Dependency được cài local và pin exact trong package-lock.json, không cài global, không sửa DB hoặc khởi động dịch vụ PostgreSQL/Docker.

## Đã chạy

- `npm run check`: TypeScript build thành công; **12/12 test pass** sau rà soát độc lập.
- Health chỉ liveness scaffold, không tạo session cookie; protected namespace thiếu phiên trả401 AUTH_REQUIRED; GETcsrf chưa có handler trả404.
- POST sai/thiếu Origin trả403 ORIGIN_FORBIDDEN; Origin đúng nhưng thiếu token trả403 CSRF_INVALID.
- Fresh account lookup từ chối account khóa, version cũ, account mất, role sai namespace và phiên idle30 phút.
- Transport theo contract: JSON lỗi400, body không object422, media sai415, body quá32KiB413; transport được kiểm trước Origin/auth.
- ADMIN gọi chức năng chỉ BQL trả403.
- Unexpected error không lộ SQL/stack/hash.
- Transaction fake xác nhận BEGIN → advisory lock → fresh account read → work → ROLLBACK → release khi lỗi; lỗi gốc được giữ.
- Expire của hàng session được store touch không hồi sinh actor đã quá idle; hai request lặp vẫn401 và lastSeenAt không đổi.
- Lỗi lấy connection/BEGIN không chạy work; connection có BEGIN lỗi hoặc rollback lỗi bị loại khỏi pool, giữ nguyên lỗi gốc.
- PostgreSQL55P03 lock timeout map503 SERVICE_UNAVAILABLE; response không lộ query hoặc bảng.
- GET có body JSON hoặc Content-Length dương bị422 trước auth; GET thông thường vẫn giữ luồng xác thực.
- Smoke dependency Argon2id: hash và verify dữ liệu demo giả thành công. Đây không phải test login hoặc password-change API.

Các test HTTP chạy server cổng loopback tạm thời và đóng sau test. Ở môi trường hạn chế kết nối loopback, lần chạy đầu gặp EACCES; chạy lại với quyền thực thi phù hợp đã pass. Không có server nền được để lại.

## Chưa kiểm chứng

Chưa chạy schema trên PostgreSQL thật, chưa kiểm thử session-store với DB thật, chưa có API auth/role nghiệp vụ, chưa có dữ liệu NFR hoặc Compose/frontend. **Không đánh dấu TC nghiệp vụ, TC-N1, TC-N2, TC-N3 đã đạt.** Cạnh tranh thật, bảo toàn sức chứa/phiếu thu, migration và kiểm thử liên role thuộc task triển khai tiếp theo. Chỉ schema/docs tồn tại không chứng minh database đã được áp dụng.

## Cập nhật phân công kiểm thử ngày 01/11/2026

Theo yêu cầu chủ dự án, máy thành viên có Node.js 24/npm 11 và không có PostgreSQL. Bùi Thế Anh chạy kiểm thử DB/tích hợp sau bàn giao; xem [phân công](../Coordination/testing-responsibilities.md).

- Đã chạy npm run check sau khi tách nhóm test: TypeScript build PASS, **15/15 test độc lập PASS**, 0 skipped/todo.
- Ba test mới kiểm tra discovery không chọn file integration, unit không nhận biến kết nối DB và integration bắt buộc TEST_DATABASE_URL riêng, không dùng DATABASE_URL development.
- Không kết nối PostgreSQL hoặc chạy test database trong lần kiểm tra này. Chưa có test tích hợp nghiệp vụ để chạy; nhóm đó ghi NOT_RUN_PENDING_OWNER khi thành viên bàn giao.
- Lệnh mặc định npm test/check chỉ chạy nhóm độc lập. Lệnh npm run test:integration dành cho máy Anh với DB test đã chuẩn bị; không tự dựng/xóa database.
