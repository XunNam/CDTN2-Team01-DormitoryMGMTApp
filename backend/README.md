# Backend DormFlow

Contract revision 1.0.0; Express/TypeScript ESM, Node 24, PostgreSQL 18.6, một Pool và PostgreSQL session store. Dependency chính xác theo package.json/package-lock.json; môi trường chuẩn npm 11. Backend sau khi tích hợp cả ba nhánh gồm 51 operation (5 Shared, 5 ADMIN, 28 BQL, 13 SV). Mỗi nhánh PR chỉ mang module của role tương ứng và các sửa Shared; xem [kết quả review](../Coordination/reports/2026-11-02-backend-readiness.md).

## Cài và kiểm tra độc lập

```powershell
cd backend
npm ci
npm run check
```

check chạy build và unit, không kết nối DB. Test integration/system được tách khỏi unit. /health chỉ là liveness, không thay kiểm tra database.

## Chạy local

Sao chép .env.example thành .env rồi điền DATABASE_URL, SESSION_SECRET ít nhất 32 ký tự ngẫu nhiên, APP_ORIGIN. Cấu hình local ở máy chủ dự án đã có trong .env và không được commit. Schema phải có trước; không chạy schema.sql lần nữa trên DB đã có bảng. Nếu account kết nối thiếu quyền, chủ sở hữu bảng xem [script cấp quyền local](../SQL/grant-local-app-access.sql).

```powershell
npm run db:check
npm run dev
```

Server kiểm tra kết nối trước listen. db:check kiểm các bảng/view/singleton nhưng không chứng nhận toàn bộ schema; db:verify dựng một schema test mới, chạy SQL invariants rollback rồi đối chiếu cấu trúc public, không sửa public.

Nếu DB chưa có staff account, tự đặt DORMFLOW_ADMIN_USERNAME, DORMFLOW_ADMIN_NAME và DORMFLOW_ADMIN_PASSWORD trong .env local, chạy npm run db:bootstrap-admin rồi xóa ba biến bootstrap. Công cụ chỉ cho tạo Admin đầu tiên khi staff_accounts rỗng, băm Argon2id và không reset tài khoản cũ. Sau đó dùng API ADMIN để cấp BQL/SV; BQL phải tạo hồ sơ SV trước.

## Kiểm tra PostgreSQL

Dùng DB test riêng theo SQL/README hoặc schema tách biệt khi tài khoản local không có CREATEDB. Công cụ dưới đây chỉ tạo schema tên codex_review_*, không drop/reset, không sửa public và không ghi đè .env.test đã có:

```powershell
npm run db:prepare-test -- codex_review_ten_nhanh_lan_moi
npm run test:integration
```

.env.test do công cụ tạo chứa TEST_DATABASE_URL với search_path chỉ schema test và pg_catalog; không fallback public. Có sẵn BQL fixture và MANAGEMENT_TEST_ACCOUNT_ID cho test service BQL. Test giữ lịch sử theo schema; chọn namespace mới cho lần test sạch, giữ/đổi tên .env.test cũ trước khi chuẩn bị. Không dùng DB có dữ liệu thật. Test DB/fixtures không chạy trong unit.

Sau khi có đủ ba module trong cùng source:

```powershell
npm run test:system
```

System test kiểm HTTP xuyên role, ownership, các cuộc đua có khóa DB thật và benchmark NFR-02. Không chạy system trên một nhánh chưa có các module còn lại. Integration files chạy nối tiếp vì cùng singleton kỳ đăng ký; các ca concurrency tạo các request đồng thời bên trong test.

## Luồng frontend

Next.js proxy /api/v1 qua cùng origin (APP_ORIGIN mặc định http://localhost:3000); backend mặc định cổng 3001, không bật CORS riêng.

1. GET /api/v1/auth/csrf với cookie, giữ data.csrfToken.
2. POST /api/v1/auth/login với accountType STUDENT/STAFF, identifier, password; gửi Origin và X-CSRF-Token.
3. Login/đổi mật khẩu regenerate cookie và CSRF: gọi lại GET csrf trước mutation tiếp theo. GET csrf không kéo dài idle.
4. GET auth/me trả role hiện tại; API bảo vệ luôn kiểm khóa/role/ownership. 401 đưa về đăng nhập, 403 báo thiếu quyền, 409 tải lại dữ liệu.
5. Mutation gửi JSON object và đúng field allowlist. Không tự gửi studentId/actor để chọn chủ thể, không tự đổi role/status ngoài action contract. 204 không parse JSON. Tiền VND giữ chuỗi; chỉ format ở UI. Ngày nghiệp vụ YYYY-MM-DD theo Việt Nam.

Router khai báo HTTP, controller parse/serialize, validation strict allowlist, service chứa nghiệp vụ và transaction, repository truy vấn tham số hóa/map DTO. Mọi ghi dùng withBusinessTransaction: BEGIN READ COMMITTED → advisory lock (724006,1) → actor fresh → kiểm tra/ghi → COMMIT. GET list/count cùng snapshot REPEATABLE READ READ ONLY. Không tạo app/auth/Pool riêng cho role.

Production cần HTTPS/COOKIE_SECURE=true, SESSION_SECRET riêng và cấu hình proxy phù hợp. Frontend/Compose và NFR-03 vẫn là bước tiếp theo. Chủ dự án tự review/commit/push/merge.
