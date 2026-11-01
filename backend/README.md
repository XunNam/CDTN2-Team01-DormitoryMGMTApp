# Khung backend dùng chung

Revision đặc tả **1.0.0**. Node.js **24 LTS**, npm **11**, TypeScript **5.9.3**, ESM, Express **5.3.0**, node-postgres **8.23.1**, express-session **1.19.0**, connect-pg-simple **10.0.0**, Zod **4.6.7**, Argon2 **0.44.0**. Phiên bản dependency chính xác nằm trong package.json và package-lock.json; dùng `npm ci`, không tự nâng từng máy hoặc dùng package global để chạy dự án.

## Trạng thái thực tế

Scaffold có app/server, health, pg Pool, PostgreSQL session-store wiring, helper fresh account/role guard, Origin/CSRF helper, response/error helper và transaction wrapper. **Chưa có login, logout, CSRF issuance hoặc API nghiệp vụ được triển khai.** Role router rỗng là vị trí nhận code, không phải endpoint trả thành công giả. `GET /health` chỉ chứng minh tiến trình HTTP hoạt động, không kiểm chứng kết nối DB hoặc tính năng.

## Cài và kiểm tra

Từ root repo, thành viên có Node 24 + npm 11 thực hiện:

```powershell
Set-Location backend
npm ci
npm run check
```

`check` chạy build và test độc lập, không cần PostgreSQL, psql, Docker hoặc file .env. `npm test` / `npm run test:unit` chỉ chọn test ngoài tests/integration/. Thành viên viết cả test tích hợp và fixture nhưng bàn giao Anh chạy; test DB chưa chạy ghi NOT_RUN_PENDING_OWNER. Xem [phân công kiểm thử](../Coordination/testing-responsibilities.md).

## Kiểm thử PostgreSQL trên máy Anh

Anh review code và test, chuẩn bị DB test riêng theo [SQL README](../SQL/README.md), rồi cấu hình TEST_DATABASE_URL trong .env.test từ .env.test.example. Chạy `npm run test:integration`; lệnh chỉ nạp test dưới tests/integration/, không tự tạo/reset database. Thiếu URL/file test thì báo lỗi hướng dẫn, không coi là pass. Repo hiện chưa có test tích hợp nghiệp vụ; thành viên phải bổ sung theo operation.

Test độc lập: `tests/<role>/<operationId>.test.ts`. Test PostgreSQL: `tests/integration/<role>/<operationId>.test.ts`. Mock/MemoryStore chỉ dùng nhóm độc lập, không thay kiểm chứng SQL/ownership với phiên thật hoặc concurrency. NFR và nghiệm thu liên phần do Anh chạy sau khi ghép.

## Chạy server khi có database

Chỉ cần cho người chạy ứng dụng/integration, không phải điều kiện viết backend ở máy thành viên. Sao chép .env.example thành .env và cấu hình DATABASE_URL, SESSION_SECRET, APP_ORIGIN trên DB riêng, rồi chạy `npm run dev` (hoặc build rồi start). Không commit credentials. Database phải được dựng trước theo SQL README.

APP_ORIGIN là origin frontend; Next.js proxy /api/v1 cùng origin. Baseline không bật CORS. Production cần HTTPS/COOKIE_SECURE=true và chỉ bật TRUST_PROXY khi đã xác định proxy. Frontend/Compose và NFR-03 vẫn là phần bàn giao sau, chưa được kiểm chứng từ scaffold.

## Cấu trúc và điểm gắn code

```text
src/
  app.ts                   # Một app factory, mount prefix/middleware
  server.ts                # Một listen, một Pool, shutdown
  shared/
    auth/                  # Session guard, Origin/CSRF và auth task
    db/pool.ts             # Pool duy nhất, DATE giữ chuỗi
    db/transaction.ts      # Global write lock + recheck actor
    http/                  # AppError, error handler, sendData/sendList
    domain/                # Logic liên role, task Shared quản lý
  roles/
    student/               # Chỉ task SV
    management/            # Chỉ task BQL
    admin/                 # Chỉ task ADMIN
tests/
  shared/scaffold.test.ts
  student/ management/ admin/  # <operationId>.test.ts của task tương ứng
```

Mỗi folder role có `router.ts`, `validation.ts`, `controller.ts`, `service.ts`, `repository.ts`, vùng `IMPLEMENTATION SLOT`. Các hàm export theo operationId trong [contract manifest](../Coordination/contract-manifest.json). App đã mount `/api/v1/student`, `/api/v1/management`, `/api/v1/admin`; route con chỉ khai báo phần tương đối. Router dùng strict routing; không thêm trailing slash. Không khai báo thêm app, server, DB Pool, session store hoặc auth middleware theo người làm.

Controller dùng `res.locals.actor` đã fresh-check, không nhận role/studentId từ body để phân quyền. Response qua `sendData(res,status,data)` / `sendList(res,data,meta)`; 204 dùng `res.status(204).end()`. JSON BIGINT tiền giữ chuỗi. Auth helper đọc DB mỗi request theo `(actorKind,accountId)`, so version, khóa và idle30 phút. Role ADMIN không tự có quyền BQL.

Session store có thể tự `touch` thời hạn hàng lưu phiên khi một request đi qua middleware, kể cả request bị từ chối. Đây chỉ là vòng đời bản ghi lưu trữ: **không được dùng expire của hàng thay idle đăng nhập**. Guard luôn kiểm `identity.lastSeenAt`; request hết idle/khóa/version cũ không cập nhật giá trị này, nên lặp request hoặc GET csrf không hồi sinh quyền đăng nhập. Auth owner phải giữ quy tắc này khi thêm handler.

Mọi mutation đã xác thực gọi:

```ts
withBusinessTransaction(pool, req.session.identity!, async (client, actor) => {
  // actor is freshly checked after global lock; all repositories use this client.
  // Validate state/ownership/business rules and commit one atomic operation.
});
```

Việc route đã kiểm token/actor không thay việc recheck sau khi chờ khóa. Wrapper acquire advisory `(724006,1)` ngay sau BEGIN READ COMMITTED; rollback khi có lỗi, luôn release. Login là ngoại lệ chưa có actor trước xác thực: Shared auth task phải triển khai luồng khóa rồi re-read credential theo contract; không lách wrapper bằng actor giả. GET list/count phải cùng snapshot read-only REPEATABLE READ theo contract, không khóa global.

## Nhiệm vụ Shared auth trước khi tích hợp role

Auth owner triển khai [contract auth](../API%20Endpoint/Shared/01-authentication.md), gồm GETcsrf/login/logout/change-password/me. `auth/router.ts` đang rỗng; task phải gắn helper đúng từng operation. **Không có blanket CSRF middleware cho auth namespace** vì logout hết phiên có ngoại lệ204. Role namespaces có Origin/CSRF trước fresh auth và role guard.

GETcsrf phát synchronizer token32 random bytes dạng64hex, lưu phiên; login/đổi mật khẩu regenerate session và token; mọi mutation có Origin đúng và token, trừ logout thiếu/hết phiên theo contract. Session identity chỉ `{actorKind,accountId,sessionVersion,lastSeenAt}`; không lưu role để phân quyền. `requireActor` cập nhật idle sau fresh lookup và `touch`; GETcsrf không được làm mới lastSeenAt. Không dùng MemoryStore ngoài test; bảng `sessions` phải có từ schema và app không tự tạo bảng.

## Tiêu chí nhận code

Đọc [bản đồ code](../Coordination/code-ownership.md), [quy trình](../Coordination/implementation-workflow.md) và AGENTS tương ứng. Mỗi task có file, operationId, DTO/error, FR/QT/AC/TC và test; thay đổi Shared/schema phải được Anh điều phối. Người dùng tự thực hiện Git và mở PR; Anh tự review/merge. Không báo hoàn thành API khi chỉ sửa slot hoặc trả mock.
