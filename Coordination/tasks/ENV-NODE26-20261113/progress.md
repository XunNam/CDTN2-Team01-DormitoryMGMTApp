# ENV-NODE26-20261113

Người thực hiện: Codex theo yêu cầu chủ dự án. Người rà soát: Bùi Thế Anh.

Phạm vi: môi trường Shared, dependency root/backend/frontend và hướng dẫn chạy. Không thay API nghiệp vụ. Nguồn: yêu cầu ngày 13/11/2026, DEC-023 và NFR-03.

## Kết quả

- Đã chuyển engines của ba package và metadata lockfile sang >=26 <27, ghim .node-version root/backend là 26.13.1, packageManager backend là npm@11.20.0. Ghi quyết định OWNER_CONFIRMED trong Planning/10, 11, 13 và AGENTS gốc. Hướng dẫn hiện hành được cập nhật.
- Đã cài npm ci cho root (20 package), backend (119), frontend (346). Giữ nguyên phiên bản dependency vì chưa phát hiện lỗi tương thích. npm cảnh báo ESLint 9.39.5 hết hỗ trợ và allowScripts cho argon2/esbuild. Build, test hashing và runtime thực tế đều đạt. Không nâng cấp ESLint hoặc dependency không liên quan khi chưa có lỗi.
- Backend npm run check: build PASS, 100/100 unit PASS, 0 skipped.
- Frontend npm run check: lint, typecheck, 92/92 unit và production build PASS trên Node 26.13.1/npm 11.20.0.
- PostgreSQL hiện có là 18.7. Theo thông tin do chủ dự án cung cấp, dùng database dormitory-vlu ở localhost:5432. DB public ban đầu không có bảng. Đã áp SQL/schema.sql, db:check PASS (11 đối tượng), db:verify PASS (schemaIntegrity PASS, snapshot khớp, không ghi public trong bước verify).
- backend/.env chứa kết nối và session secret ngẫu nhiên, bị Git ignore. Không lưu thông tin xác thực vào file được theo dõi.
- Đã bootstrap Admin ứng dụng đầu tiên khi staff_accounts rỗng bằng công cụ hiện có. Thông tin đăng nhập ngẫu nhiên nằm trong .qa/local-admin.txt bị Git ignore. Không dùng tài khoản PostgreSQL làm tài khoản đăng nhập ứng dụng.
- npm run dev đã khởi chạy frontend cổng 3000 và backend cổng 3001. Smoke thật qua Next.js proxy PASS: trang login, health, CSRF, đăng nhập Admin, identity, danh sách tài khoản bảo vệ và logout. Phiên test đã logout.
- git diff --check PASS. Không commit/push/merge.

## Ghi chú môi trường và tiếp tục

Các test HTTP và kết nối PostgreSQL trong sandbox bị EACCES. Kết quả PASS ở trên được chạy ngoài sandbox sau phê duyệt. npm ci ban đầu trong sandbox lỗi ENOTFOUND, chạy lại ngoài sandbox thành công.

Trước khi chủ dự án cung cấp DB, đã khởi tạo cluster thử riêng trong .qa/postgres-data ở cổng 5433. Task này đã ngắt khi chuyển sang DB do chủ dự án cung cấp. PostgreSQL cổng 5433 không còn chạy khi kiểm tra dừng (PID không còn tồn tại). Dữ liệu thử được giữ trong .qa và ứng dụng không sử dụng. Không xóa hoặc sửa dịch vụ PostgreSQL có sẵn.

Để chạy lại trên máy này: powershell -NoProfile -ExecutionPolicy Bypass -File .qa/start-local.ps1, hoặc kích hoạt fnm theo README rồi npm.cmd run dev. PostgreSQL ở localhost:5432 cần đang chạy. Ctrl+C dừng frontend/backend. Không tự khởi động dịch vụ PostgreSQL hệ thống bằng script này.

Log kiểm tra nằm trong .qa/backend-node26-check.log và .qa/frontend-node26-check.log. Chưa chạy lại toàn bộ integration/system/browser suite hoặc benchmark NFR trên máy mới. Smoke không thay kiểm chứng toàn hệ thống và chưa chứng nhận NFR-03/Docker. Môi trường local đã khởi chạy, chờ chủ dự án review thay đổi cấu hình.
