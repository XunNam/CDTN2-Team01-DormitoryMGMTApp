# DormFlow · Frontend

Cập nhật tích hợp 05/11/2026: code hiện có cả ADMIN/BQL/SV. Đã kiểm 51/51 API qua Next.js thật tới backend/PostgreSQL và đăng nhập Chrome cho ba role; các đoạn kết quả task cũ bên dưới được giữ làm lịch sử. Xem [báo cáo hiện hành](../Coordination/reports/2026-11-05-backend-frontend-integration.md). Chạy lại kiểm thử thật từ backend bằng `npm run test:frontend`; suite `test:e2e` dưới đây vẫn dùng API giả.

Ứng dụng Next.js 16.4.4/React 19.3.0, TypeScript/App Router/CSS Modules. Đã hiện thực đăng nhập, luồng ADMIN và frontend Management (BQL) theo prototype Campus Modern được duyệt. Dependency chính xác giữ trong package-lock.json; dùng Node.js 24+ và npm 11+.

## Chạy ứng dụng

Từ thư mục gốc repository:

```powershell
cd frontend
npm ci
npm run dev
```

Mở [http://localhost:3000/login](http://localhost:3000/login). ADMIN đăng nhập thành công chuyển vào [http://localhost:3000/admin](http://localhost:3000/admin), BQL vào [http://localhost:3000/management](http://localhost:3000/management). SV vẫn dùng màn hình xác nhận tài khoản hiện có; frontend nghiệp vụ SV chưa thuộc task này.

Backend Express chạy riêng, mặc định cổng 3001; xem [hướng dẫn backend](../backend/README.md). Next.js chuyển tiếp /api/v1/* về http://127.0.0.1:3001/api/v1/*. Muốn đổi nơi API chạy, tạo .env.local từ .env.example, đặt BACKEND_ORIGIN rồi chạy lại frontend. Chỉ dùng origin HTTP(S) không kèm path/query/credentials; biến này chỉ dùng phía server.

Backend APP_ORIGIN phải trùng chính xác địa chỉ trên trình duyệt (ví dụ http://localhost:3000). localhost và 127.0.0.1, hoặc cổng khác, là origin khác nhau. Không bỏ kiểm tra Origin/CSRF hoặc bật CORS riêng để né lỗi cấu hình. Không commit .env thật, mật khẩu hay khóa truy cập.

## Các luồng ADMIN

| Đường dẫn | Chức năng |
|---|---|
| /admin, /admin/accounts | Danh sách; tìm mã/tên, lọc nhóm/role/trạng thái kết hợp AND, phân trang 5–100 dòng |
| /admin/accounts/new | Cấp SV từ hồ sơ chưa có tài khoản; cấp nhân sự BQL/ADMIN |
| /admin/accounts/{actorKind}/{accountId} | Chi tiết Account theo namespace và UUID; role chỉ đọc |
| /admin/accounts/{actorKind}/{accountId}/lock | Xác nhận khóa, kể cả tài khoản của chính mình |
| /admin/accounts/{actorKind}/{accountId}/unlock | Xác nhận mở khóa |
| /admin/accounts/{actorKind}/{accountId}/result | Kết quả từ response mutation; khi tải lại đọc trạng thái hiện tại, không giả lịch sử thao tác |
| /admin/security | Đổi mật khẩu của tài khoản đang đăng nhập |
| /login?reauth=1 | Nhập lại thông tin đăng nhập khi kết quả đổi mật khẩu chưa xác định |

Giao diện dùng sidebar xanh mực/active xanh lá nhạt, nền sáng, Manrope và Be Vietnam Pro; tên VLU · DormFlow bằng chữ thuần. Dưới 760px điều hướng chuyển thành hàng gọn, bảng cuộn trong vùng riêng. Font được next/font/google tải và tự phục vụ; build đầu tiên cần tải Google Fonts. Đã xem ảnh desktop/mobile bằng dữ liệu kiểm thử.

Năm consumer API ADMIN khớp contract hiện có:
- adminListAccounts: q,actorKind,role,isLocked,page,pageSize; không sort hoặc field thừa.
- adminGetAccount: dùng cả actorKind và accountId; không nhầm studentId hoặc fallback namespace.
- adminListProfileCandidates: chỉ metadata id/studentCode/fullName/hasAccount=false, có tìm và phân trang.
- adminCreateAccount: hai biến thể STUDENT/STAFF tách riêng, SV role=SV, nhân sự BQL/ADMIN; không gửi trạng thái/audit/field hồ sơ.
- adminSetAccountLock: PATCH chỉ {isLocked:boolean}; không DELETE hoặc sửa role.

Không thêm reset mật khẩu người khác, email, cấp hàng loạt, dashboard thống kê, phòng, lưu trú hay thu phí cho ADMIN. Tham chiếu [contract ADMIN](<../API Endpoint/System Admin/API-Contract.md>) và [schemas](<../API Endpoint/Shared/schemas.json>).

## Phiên, lỗi và thao tác ghi

SessionClient dùng chung cookie same-origin, Cache no-store, CSRF trong bộ nhớ, timeout/hủy request; không JWT/localStorage/sessionStorage. Origin do trình duyệt cung cấp. Token đổi sau login/đổi password được tải lại trước mutation tiếp theo. Không polling để kéo dài idle timeout.

ADMIN layout kiểm tra Identity trước khi tải dữ liệu; 401 hoặc FORBIDDEN từ request bảo vệ thay toàn bộ nội dung riêng bằng màn hình xác thực/không đủ quyền. Backend vẫn là nơi kiểm quyền thực tế ở mỗi request.

Mutation chống gửi lặp, không tự retry hoặc báo thành công lạc quan:
- Khóa/mở đã cùng trạng thái hoặc 409: tải lại trước xác nhận mới. Cho self-lock; hiển thị response 200 của request hiện tại, request bảo vệ kế tiếp mới bị từ chối. Không guard Admin cuối.
- Mất response cấp account: giữ thông tin tra cứu không chứa password, khóa gửi lại và cho kiểm tra bằng GET. Kết quả tìm thấy hiển thị trung lập, không khẳng định POST của chính mình tạo bản ghi. Không tìm thấy vẫn giữ trạng thái chưa rõ.
- Mất response khóa/mở: đọc đúng account để đối chiếu trạng thái trước thao tác chủ động tiếp theo.
- Đổi password trả 503/lỗi kết nối có thể đã commit; không khẳng định rollback. Yêu cầu nhập lại thông tin đăng nhập; khi reauth, không lấy phiên có trước làm bằng chứng mật khẩu mới đã xác thực.
- POST logout dùng {}, 204 không parse JSON. Mất response được kiểm tra qua me; ACCOUNT_LOCKED không là bằng chứng session đã bị hủy.

Mật khẩu 8–128 Unicode code point, không trim/normalize, được xóa khỏi trường khi gửi; không log hoặc hiện lại trong kết quả. Username nhân sự trim/lowercase theo regex contract; tên tối đa 150 code point. Lỗi theo field có lời hướng dẫn đã rà soát, không render SQL/stack/raw backend message.

## Kiểm tra

```powershell
npm run check
```

Gồm lint, typecheck, test độc lập và production build. Để chạy 14 ca trình duyệt bằng Chrome có sẵn:

```powershell
npm run build
$env:PLAYWRIGHT_CHANNEL = "chrome"
npm run test:e2e
```

Mặc định khi không đặt PLAYWRIGHT_CHANNEL, Playwright dùng Chromium của nó (cài bằng npx playwright install chromium). Máy chủ test dùng cổng 3100, tự dừng sau kiểm tra; không tái sử dụng máy chủ đang chạy. Tất cả /api/v1 được chặn và trả response giả, không forward tới backend thật. Report/trace/screenshot ở test-results/ và bị Git ignore.

Kết quả task FE-ADMIN-20261103: lint/typecheck/production build đạt; 46 test độc lập và 14 test trình duyệt đạt, gồm filter/phân trang, cấp đủ ba role, khóa/mở/self-lock, conflict, CSRF, request mất phản hồi, đổi mật khẩu/logout, sai quyền/hết phiên và mobile. Chưa chạy kiểm thử với API/database thật (NOT_RUN_PENDING_OWNER); test giả không chứng nhận tích hợp backend hoặc các NFR toàn hệ thống.

## Cấu trúc và bàn giao

- src/lib/api/: transport và CSRF dùng chung.
- src/lib/auth/: login/me/logout/changePassword, DTO và validation.
- src/lib/admin/: năm consumer API, decoder DTO, validation và lời hướng dẫn.
- src/components/admin/: layout bảo vệ, bảng, cấp tài khoản, hồ sơ, chi tiết/xác nhận/kết quả, bảo mật.
- src/components/auth/: trang đăng nhập giữ phong cách đã duyệt; ADMIN có điều hướng và reauth.
- tests/: test độc lập HTTP/contract/Unicode bằng fetch giả.
- e2e/: Playwright với API giả.
- next.config.ts: proxy cùng origin; không kết nối PostgreSQL từ frontend.

Nhánh frontend/admin-pages được tạo từ main chưa có frontend; nền đăng nhập được kế thừa từ source commit 85602024 trên frontend/login-page. Không merge/cherry-pick hoặc sửa nhánh đăng nhập. Task này bổ sung frontend đầy đủ trong nhánh ADMIN; Git chỉ gồm frontend và hồ sơ FE-ADMIN-20261103. Thiết kế designs/ được giữ riêng. Xem [checkpoint](../Coordination/tasks/FE-ADMIN-20261103/progress.md) để tiếp tục review và kiểm chứng với backend thật.
