# FE-ADMIN-20261103 · Bàn giao frontend ADMIN

Trang ADMIN đã được code theo prototype chủ dự án duyệt, nối API hiện có bằng cookie phiên và CSRF. Khi ADMIN đăng nhập sẽ vào /admin/accounts; role khác không tải dữ liệu ADMIN. Nhánh đích frontend/admin-pages trước task chưa có frontend nên đầu ra bao gồm nền đăng nhập từ commit 85602024 và phần ADMIN mới.

## Thay đổi chính

| Vùng | Nội dung |
|---|---|
| src/app/admin | Protected layout và các route accounts/new/detail/lock/unlock/result/security |
| src/components/admin | Shell responsive, tìm/lọc/phân trang, profile picker, form cấp, chi tiết/xác nhận/kết quả, password và access gate |
| src/lib/admin | 5 consumer API, decoder chỉ lấy DTO allowlist, validation và lời hướng dẫn lỗi |
| src/lib/api | Cookie/no-store, token CSRF chung, abort/timeout, đánh dấu write có thể đã commit |
| src/lib/auth, components/auth | Kế thừa login; ADMIN redirect, password change, logout, reauth không suy từ phiên cũ |
| tests, e2e | 46 unit tests và 14 browser tests với API giả |

Không có sửa backend/SQL/contract hoặc nghiệp vụ ngoài ADMIN. Không có đổi role sau cấp, reset password người khác, DELETE, gửi mail, bulk actions hoặc quyền BQL cho ADMIN.

## Kiểm chứng

- npm run check: PASS (lint, typecheck, 46 unit, build).
- PLAYWRIGHT_CHANNEL=chrome npm run test:e2e: PASS 14/14, chặn mọi /api/v1 để trả response giả; không gọi API/database thật.
- Desktop 1440 và điện thoại 390px đã xem screenshot; kiểm tra overflow và điều hướng đạt.
- Tình huống quan trọng: tạo đủ ba role, filter AND, không lộ password/field hồ sơ ngoài DTO, duplicate/conflict không báo thành công, GET hòa giải request mất response không replay, CSRF rotation chia sẻ auth/admin, self-lock response hiện tại/401 kế tiếp, 503 password có thể đã commit, deny role và hết phiên.
- API/DB thật: NOT_RUN_PENDING_OWNER. Chủ dự án kiểm chứng tích hợp sau bàn giao; test giả không chứng minh backend/NFR đã đạt.

Chạy ứng dụng: xem frontend/README.md. Git chỉ gồm frontend và task FE-ADMIN-20261103; thiết kế và output test/tệp local nằm ngoài commit. Commit/push được ủy quyền trực tiếp trong chat, không merge hoặc triển khai.
