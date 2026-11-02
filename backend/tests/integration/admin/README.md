# Test tích hợp role ADMIN (ADMIN-01)

Năm file `<operationId>.test.ts` dùng PostgreSQL thật, chạy bằng `npm run test:integration` trên máy Anh. Không chạy trong `npm run check`.

## Chuẩn bị

1. Một database test **rỗng, dùng riêng**, đã chạy `SQL/schema.sql` đúng một lần (xem `SQL/README.md`).
2. Trong `backend/`, sao chép `.env.test.example` thành `.env.test`, điền `TEST_DATABASE_URL`. `SESSION_SECRET` và `APP_ORIGIN` là tùy chọn (fixture tự sinh secret ngẫu nhiên nếu thiếu).
3. `npm ci` rồi chạy:

```powershell
npm run check
npm run test:integration
```

## Fixture và dọn dữ liệu

- `fixtures.ts` tạo app thật (`createApp`) với Pool thật và session store PostgreSQL thật (bảng `sessions`).
- Mỗi file test có một tag ngẫu nhiên (`it` + 8 hex). Hồ sơ, tài khoản staff và session tạo ra đều mang tag này và bị xóa trong `after()`; ghi dữ liệu luôn đi qua `pg_advisory_xact_lock(724006, 1)` như trigger yêu cầu.
- Không DROP/TRUNCATE/áp schema. Dữ liệu khác trong DB test không bị đụng tới, vì các truy vấn kiểm tra đều lọc theo tag.
- Hash fixture là Argon2id chi phí thấp, chỉ để chạy test nhanh. Hash do API tạo vẫn dùng tham số chuẩn (m=65536, t=3, p=1); test kiểm tra điều này.

## Giới hạn: chưa có login (AUTH-01)

Shared login chưa được triển khai, nên `seedSession()` ghi session trực tiếp vào bảng `sessions` cho một tài khoản có thật trong DB. Guard thật vẫn đọc lại account, role, khóa và `session_version` ở mỗi request. Các test này kiểm chứng **API ADMIN**, không kiểm chứng luồng đăng nhập. Khi AUTH-01 xong, thay `seedSession()` bằng `GET /auth/csrf` + `POST /auth/login`.

## Kết quả mong đợi

15 test pass, sau khi chạy không còn dòng nào mang tag trong `staff_accounts`, `student_accounts`, `student_profiles`, `sessions`.

| File | Ca chính |
|---|---|
| adminCreateAccount | SV từ hồ sơ có trước (201), hồ sơ đã có account (409 ACCOUNT_ALREADY_EXISTS), hồ sơ không tồn tại (404), STAFF BQL/ADMIN, username trùng (409 DUPLICATE_USERNAME), username trùng chuỗi MSSV vẫn được, hash Argon2id chuẩn và không trim mật khẩu, 2 Admin cấp cùng hồ sơ đồng thời → 201 + 409 và chỉ 1 account, BQL 403 / Admin bị khóa 401 / sai CSRF 403 không ghi gì |
| adminSetAccountLock | Khóa BQL đang đăng nhập → request kế tiếp 401 ACCOUNT_LOCKED, mở khóa → truy cập lại được, khóa lặp 409 INVALID_STATE, `session_version` giữ nguyên, khóa SV không đổi hồ sơ, sai namespace 404, Admin tự khóa 200 rồi 401, 2 request khóa đồng thời → 200 + 409 |
| adminListAccounts | Gộp 2 nguồn đúng DTO, filter AND, q không phân biệt hoa thường, `%` là ký tự thường, phân trang ổn định không trùng/mất, trang vượt cuối, BQL/SV 403, chưa đăng nhập 401 |
| adminGetAccount | Đọc đúng namespace, sai namespace / studentId thay accountId → 404, UUID sai 422 |
| adminListProfileCandidates | Chỉ hồ sơ chưa có account, DTO tối thiểu, sort createdAt DESC, tìm theo tên tiếng Việt, hồ sơ biến mất sau khi cấp, BQL 403 |
