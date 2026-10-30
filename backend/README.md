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

`check` chạy TypeScript build rồi Node test runner. Test scaffold sử dụng DB giả/MemoryStore riêng trong test để kiểm chứng middleware, envelope và thứ tự gọi transaction; không chứng minh constraint PostgreSQL, concurrency thật hoặc NFR đã đạt. Test PostgreSQL thật phải chạy trên DB test riêng theo [SQL README](../SQL/README.md), không dùng DB thật của đồ án.

Để chạy HTTP local, sao chép `.env.example` thành `.env`, điền DATABASE_URL của DB riêng và secret ngẫu nhiên tối thiểu32 ký tự; không commit `.env`. Chỉ áp schema theo SQL README khi được giao DB test sạch. Sau đó:

```powershell
npm run dev
```

Hoặc `npm run build` rồi `npm start`. Node đọc `.env` nếu tồn tại; production có thể cấp biến môi trường từ ngoài. Development `/health` ở port3001 theo cấu hình. APP_ORIGIN là origin frontend, ví dụ `http://localhost:3000`, không phải URL API có path. Frontend Next.js phải proxy `/api/v1` cùng origin; baseline không bật CORS. Không nới Origin để chữa cấu hình proxy sai.

Production phải HTTPS, COOKIE_SECURE=true. Chỉ bật TRUST_PROXY=true khi có đúng một reverse proxy được tin cậy; không tự bật trên môi trường chưa xác định. NFR-03 frontend+API+DB bằng tối đa2lệnh là tiêu chí giao hàng sau khi ứng dụng và Compose được hoàn thành; scaffold này chưa xác nhận đạt.

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
