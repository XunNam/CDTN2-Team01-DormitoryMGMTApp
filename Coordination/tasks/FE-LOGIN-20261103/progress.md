# FE-LOGIN-20261103 · Trang đăng nhập Next.js

## Ủy quyền và phạm vi

- OWNER_CONFIRMED, yêu cầu trong chat ngày 03/11/2026: tạo frontend/ bằng Next.js latest, commit và push bộ khung lên nhánh có sẵn frontend/login-page trước, sau đó hiện thực trang đăng nhập theo bản mẫu đã duyệt và nối API thật; chưa cần xác minh API chạy thực tế.
- Yêu cầu commit/push trực tiếp là ngoại lệ cho giới hạn không tự Git trong AGENTS, chỉ áp dụng task này. Không merge hoặc triển khai.
- Phần đăng nhập của FE-01, dùng chung SV/BQL/ADMIN. Codex thực hiện theo yêu cầu chủ dự án; chủ dự án review. Không tự nhận toàn bộ FE-01 hay role backend.
- FR-01, UC-01, QT-01/QT-02, TC-01.1/01.2, NFR-01; contract 1.0.0.
- Phạm vi: frontend/** và checkpoint này. Không sửa backend/auth/SQL/contract. designs/** đã có từ lượt trước, không stage/commit.

## Kế hoạch và kết quả

1. Hoàn tất: registry npm xác nhận Next.js/create-next-app latest 16.4.4. Tạo frontend bằng TypeScript, App Router, ESLint, src/, CSS Modules; React 19.3.0, package-lock. Node 24.18.0/npm 12.1.0 có sẵn, không đổi môi trường backend.
2. Hoàn tất: lint/typecheck bộ khung; ký commit dea968d, push origin frontend/login-page trước khi code trang đăng nhập. Base trước đó 94ded016dfadfd69d336e4e54bc5f8b0ffde1572. Git ban đầu gọi bản GPG khác kho khóa; dùng Gpg4win hiện có cho riêng lệnh commit, không sửa cấu hình Git đã lưu hoặc bỏ ký.
3. Hoàn tất: giao diện Campus Modern responsive cho / và /login; radio kho tài khoản, nhãn động, password manager/hiện-ẩn, validation Unicode, focus/lỗi truy cập, loading và chống gửi lặp.
4. Hoàn tất: nối getCurrentIdentity/getCsrfToken/login qua rewrite cùng origin; refresh CSRF sau login, giữ kết quả login nếu refresh lỗi, hòa giải request mất response qua me và không replay mật khẩu. Thêm logout hiện có trên xác nhận đăng nhập để đổi tài khoản. Không lưu token/password ở localStorage/sessionStorage, không JWT.
5. Hoàn tất: README + env example và lệnh check. Phần implementation ở working tree theo thứ tự yêu cầu; chưa commit/push lần hai.

## Điểm nối và file

- src/components/auth/login-page.tsx + CSS Module: màn hình và state.
- src/lib/auth/client.ts: getCurrentIdentity, getCsrfToken, login, logout; request cookie/CSRF/no-store/timeout/abort; chỉ gửi field allowlist.
- src/lib/auth/types.ts, validation.ts, notices.ts: DTO frontend dùng chung, Unicode validation và lời hướng dẫn lỗi.
- next.config.ts: BACKEND_ORIGIN server-only, mặc định http://127.0.0.1:3001. Backend APP_ORIGIN phải đúng origin trình duyệt.
- src/app/layout.tsx + globals.css: tiếng Việt, font tự phục vụ và token từ thiết kế.
- tests/auth-client.test.ts, tests/validation.test.ts: kiểm tra độc lập với response giả.
- Sau login hiển thị xác nhận và role từ server ngay tại trang; chưa có màn hình role để điều hướng.

## Kiểm chứng

- Bộ khung: lint/typecheck đạt trước commit.
- Implementation: npm run lint, npm run typecheck và npm run build đạt; build tạo /, /login, /_not-found.
- Bộ test hiện tại: npm test đạt 21/21 sau khi bỏ một test timeout trùng; không gọi backend thật.
- Kiểm tra whitespace Git đạt.
- npm audit --omit=dev: 0 lỗ hổng runtime tại thời điểm khởi tạo; tooling dev của scaffold báo 16 moderate, không tự audit fix --force.
- API/backend/DB/E2E thật: NOT_RUN_BY_OWNER_REQUEST; không tuyên bố hoạt động từ test giả/build. Không đọc .env backend, không dùng credentials thật.
- Chưa kiểm tra giao diện bằng trình duyệt.

## Trạng thái và bước tiếp

READY_FOR_OWNER_REVIEW cho trang đăng nhập, không phải toàn FE-01/tích hợp/NFR đã hoàn tất. Chủ dự án có thể chạy npm --prefix frontend run dev, mở http://localhost:3000/login; dùng backend hiện có với APP_ORIGIN chính xác. Review phần code mới; commit/push tiếp theo khi được giao. Khi các trang nghiệp vụ theo role được triển khai, nối điều hướng sau Identity thay cho màn hình xác nhận. Đổi mật khẩu và các phần FE còn lại ngoài phạm vi lượt này.
