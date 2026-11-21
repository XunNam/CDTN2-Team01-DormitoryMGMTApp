# Hướng dẫn chạy unit test và integration test – DormFlow (Buổi 8)

Tài liệu này ghi lại đúng các bước đã dùng ngày 20/11/2026 để chạy test. Các file test đã có sẵn trong repo; bên dưới chỉ nói chúng nằm ở đâu và cần chuẩn bị gì để chạy.

## 1. Các file test nằm ở đâu

| Loại | Thư mục | Cần PostgreSQL |
|---|---|---|
| Backend unit | `backend/tests/student/`, `management/`, `admin/`, `shared/` | Không |
| Backend integration | `backend/tests/integration/admin/`, `management/`, `shared/`, `student/` | Có |
| Backend system (xuyên 3 vai trò + hiệu năng NFR-02) | `backend/tests/system/` | Có |
| Frontend unit | `frontend/tests/` | Không |
| Frontend E2E (API giả) | `frontend/e2e/` | Không |

File điều phối chạy test của backend: `backend/tools/run-tests.mjs`.

## 2. Chuẩn bị chung

- Node.js 26 (file `.node-version` ghim 26.13.1) và npm 11.
- Cài thư viện một lần từ thư mục gốc repo:

```powershell
npm ci
npm --prefix backend ci
npm --prefix frontend ci
```

## 3. Unit test (không cần database)

```powershell
cd backend
npm run check        # build + unit test backend (kết quả ngày 20/11: 101/101 đạt)

cd ../frontend
npm run lint
npm run typecheck
npm test             # unit test frontend (93/93 đạt)
```

## 4. Integration và system test (cần PostgreSQL)

Dùng một database test riêng, **không** dùng database có dữ liệu thật.

1. Tạo database rỗng và một tài khoản có quyền tạo schema.
2. Tạo `backend/.env` (file này không được commit):

```text
NODE_ENV=development
PORT=3001
APP_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<ten_db_test>
SESSION_SECRET=<chuoi-ngau-nhien-it-nhat-32-ky-tu>
COOKIE_SECURE=false
TRUST_PROXY=false
```

3. Tạo schema test mới (mỗi lần chạy sạch nên đặt hậu tố mới; công cụ không drop/reset gì):

```powershell
cd backend
npm run db:prepare-test -- codex_review_<hau_to_moi>
```

Lệnh này tạo file `backend/.env.test` chứa `TEST_DATABASE_URL` và `MANAGEMENT_TEST_ACCOUNT_ID`. Mở file đó và **thêm** các dòng sau (công cụ không tự thêm):

```text
NODE_ENV=test
APP_ORIGIN=http://localhost:3000
SESSION_SECRET=<chuoi-ngau-nhien-it-nhat-32-ky-tu>
COOKIE_SECURE=false
TRUST_PROXY=false
```

Nếu đã có `.env.test` cũ, đổi tên file cũ trước khi chạy lại `db:prepare-test`.

4. Chạy lần lượt, không chạy song song cùng một schema:

```powershell
npm run test:integration   # 28/28 đạt ngày 20/11
npm run test:system        # 2/2 đạt; gồm NFR-02: 100/100 lượt < 2 giây
npm run test:frontend      # 51 API qua Next.js thật + đăng nhập Chrome 3 vai trò; để trống cổng 3200
```

Kết quả ngày 20/11 chạy trên PostgreSQL **16.15**; dự án nhắm tới 18.6 nên nên chạy lại trên bản 18.6.

## 5. E2E Playwright (API giả)

```powershell
cd frontend
npm run build
npm run test:e2e           # 41/41 đạt; dùng mock-api.ts, không chứng minh DB thật
```

Nếu máy báo thiếu trình duyệt, đặt `PLAYWRIGHT_CHANNEL=chrome` để dùng Chrome có sẵn.

## 6. Lưu ý khi chạy offline hoặc mạng bị chặn

`frontend/src/app/layout.tsx` dùng `next/font/google` (Be Vietnam Pro, Manrope). Khi không truy cập được Google Fonts, `npm run build` bị lỗi. Cách xử lý tạm trong lần chạy 20/11 là chạy trên một bản sao đã bỏ hai font đó; cách sửa đúng là chuyển sang `next/font/local` (ghi ở bug B3 trong báo cáo kiểm thử).

## 7. Không commit

`backend/.env`, `backend/.env.test` và mọi mật khẩu/khóa thật.
