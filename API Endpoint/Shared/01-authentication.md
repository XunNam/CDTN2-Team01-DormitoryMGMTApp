# API xác thực dùng chung

Revision **1.0.0**, trạng thái **SPECIFIED_NOT_IMPLEMENTED**. Đây là nguồn duy nhất cho cả ba role; không tạo endpoint đăng nhập riêng trong thư mục role. Code task Shared đặt tại `backend/src/shared/auth/{router,controller,service,repository,validation}.ts`, export đúng operationId. Test đặt tại `backend/tests/shared/{operationId}.test.ts`. Các helper nền ở `backend/src/shared/`; kiểm tra vị trí thực tế trong [backend README](../../backend/README.md) trước khi sửa.

Nguồn: FR-01, UC-01 đến UC-03, QT-01/QT-02, TC-01.1 đến TC-01.3, NFR-01/TC-N1, DEC-012 đến DEC-015, DEC-019 và DEC-021. Route, thuật toán và cookie là **DELEGATED_SELECTION** theo ủy quyền hiện tại. Owner/reviewer được ghi trong task, không tự gán theo tên người.

## Cơ chế phiên và CSRF

Dùng `express-session` cùng `connect-pg-simple`, lưu phiên trong bảng `sessions`; không dùng JWT hoặc refresh token.

| Thuộc tính | Quy định |
|---|---|
| Cookie | `dormflow.sid`, Path `/`, HttpOnly, SameSite `Lax` |
| Secure | Bật khi HTTPS; cấu hình local HTTP riêng |
| MaxAge | `1800000` mili giây |
| Khóa ký | `SESSION_SECRET` ngẫu nhiên, cấu hình ngoài Git |
| Actor phía server | `{actorKind, accountId, sessionVersion, lastSeenAt}` |
| Token CSRF | `csrfToken`: 32 byte ngẫu nhiên an toàn, biểu diễn bằng 64 ký tự hex |

Cookie không chứa role hoặc mật khẩu. Guard đọc account từ nguồn tương ứng ở mỗi request bảo vệ, kiểm tra role, khóa, sessionVersion và idle timeout. Idle timeout là **30 phút từ request bảo vệ hợp lệ gần nhất**, kiểm tra phía server; không dựa riêng vào thời hạn cookie. Không dùng polling để âm thầm kéo dài phiên. GET csrf không cập nhật `lastSeenAt` của actor.

Mọi POST/PATCH yêu cầu `Origin` trùng chính xác `APP_ORIGIN`, kể cả client không phải trình duyệt; `Content-Type: application/json`; `X-CSRF-Token` khớp token trong phiên bằng phép so sánh constant time. Ngoại lệ logout không còn phiên được nêu bên dưới.

GET csrf có thể tạo anonymous session. Login và đổi mật khẩu thành công đều regenerate session ID và token CSRF; frontend phải gọi lại GET csrf sau hai thao tác. Không hỗ trợ cross-origin CORS trong baseline; Next.js chuyển tiếp `/api/v1` sang backend qua cùng origin.

Che các giá trị `Cookie`, `Set-Cookie`, `password`, `currentPassword`, `newPassword`, `X-CSRF-Token` trong log. Tham số Argon2id lấy từ [data contracts](03-data-contracts.md). Account không tồn tại dùng dummy password verification để giảm khác biệt thời gian. Không tự thêm reset qua email hoặc hệ thống rate limit phức tạp ngoài task được giao.

## getCsrfToken

**HTTP:** `GET /api/v1/auth/csrf`.

**Quyền và đầu vào:** không yêu cầu đăng nhập; không query/body. Query thừa trả 422.

**Xử lý:** tạo anonymous session/token ngẫu nhiên an toàn khi cần. Actor hết hạn phải bị loại bỏ, sau đó tạo anonymous session/token mới; không gia hạn đăng nhập cũ. Actor còn hiệu lực giữ nguyên `lastSeenAt`.

**Thành công:** 200, schema data `CsrfToken`; header `Cache-Control: no-store`. Gửi Set-Cookie khi tạo phiên ẩn danh. Token dưới đây chỉ minh họa định dạng; không dùng giá trị hằng trong code.

```json
{"data":{"csrfToken":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}}
```

**Lỗi:** 422 `VALIDATION_ERROR`; 503 `SERVICE_UNAVAILABLE` nếu store không sẵn sàng; 500 `INTERNAL_ERROR` nếu có lỗi ngoài dự kiến.

**Kiểm chứng:** token đủ 64 ký tự hex, không lộ qua cross-origin CORS, không kéo dài idle; actor hết hạn không giữ quyền. Phụ thuộc session store trước khi tích hợp business API.

## login

**HTTP:** `POST /api/v1/auth/login`.

**Quyền:** anonymous; vẫn cần Origin và CSRF hợp lệ. Phiên đã đăng nhập trên cùng trình duyệt chỉ được thay sau khi login mới thành công.

**Request:** schema `LoginRequest`, không query, không thuộc tính ngoài schema.

| Trường | Bắt buộc | Giới hạn |
|---|---|---|
| accountType | Có | STUDENT hoặc STAFF; chỉ chọn nguồn account, không cấp role |
| identifier | Có | Chuỗi 1–50 ký tự; MSSV trim/uppercase, username nhân sự trim/lowercase |
| password | Có | Chuỗi 8–128 Unicode code point; không trim hoặc biến đổi |

```json
{"accountType":"STUDENT","identifier":"SV001","password":"DemoOnly#2026"}
```

**Thứ tự xử lý:** Origin/CSRF → validate → tìm đúng nguồn → kiểm hash → kiểm khóa → regenerate session ID → lưu actor với version hiện hành và lastSeenAt → cấp token CSRF mới → response. Dùng transaction với khóa chung và đọc lại account trước cấp phiên để không login bằng mật khẩu vừa bị đổi. Không tự tạo profile/account. Login thất bại không cấp actor mới.

**Thành công:** 200, schema data `Identity`. Role đọc từ DB, không đến từ client. STAFF trả `studentId: null`.

```json
{"data":{"actorKind":"STUDENT","accountId":"00000000-0000-4000-8000-000000000001","role":"SV","identifier":"SV001","displayName":"Sinh viên mẫu","studentId":"00000000-0000-4000-8000-000000000001"}}
```

**Lỗi:** 401 `INVALID_CREDENTIALS` khi sai password, nguồn hoặc danh tính; 401 `ACCOUNT_LOCKED` khi password đúng nhưng account khóa; 403 `CSRF_INVALID`/`ORIGIN_FORBIDDEN`; 422 `VALIDATION_ERROR`; 503 `SERVICE_UNAVAILABLE` nếu DB/store không sẵn sàng. Không password/hash trong response.

**Kiểm chứng:** ba role; identifier cùng chuỗi ở hai namespace không nhầm nguồn; tài khoản khóa; role không lấy từ client; chống session fixation; token CSRF cũ không còn hiệu lực; input thừa; Origin/CSRF; fresh sessionVersion. Transaction không ghi entity nghiệp vụ.

## logout

**HTTP:** `POST /api/v1/auth/logout`.

**Request:** body `{}` theo schema `Empty`, không query. Origin luôn bắt buộc và hợp lệ, kể cả logout lặp.

**Xử lý:** có phiên hiệu lực thì kiểm CSRF, hủy session server và clear cookie với đúng thuộc tính khi cấp. Thiếu/hết phiên hoặc version cũ thì clear cookie và trả 204, không cần token đã mất, không tạo phiên mới. Account khóa vẫn được logout; không yêu cầu role hợp lệ để rời phiên. Store hủy lỗi trả 503, không báo thành công giả.

**Thành công:** 204, không body. Không thu hồi mọi thiết bị khi chỉ logout phiên hiện tại.

**Lỗi:** 403 `ORIGIN_FORBIDDEN`; 403 `CSRF_INVALID` khi còn phiên hiệu lực nhưng token sai; 422 `VALIDATION_ERROR` nếu body/query không đúng; 503 `SERVICE_UNAVAILABLE` nếu store không xử lý được.

**Kiểm chứng:** gọi hai lần đều 204; cookie cũ GET me trả 401; Origin sai trả 403 ngay cả logout lặp; token sai trong phiên đang hiệu lực trả 403. Nguồn UC-02/TC-01.3.

## changePassword

**HTTP:** `POST /api/v1/auth/change-password`.

**Quyền:** SV/BQL/ADMIN đổi password của chính account trong phiên; Origin, CSRF và fresh guard bắt buộc. Không query hoặc accountId để đổi người khác.

**Request:** schema `ChangePasswordRequest`; hai trường bắt buộc, chuỗi 8–128 Unicode code point, không trim. Trường thừa trả 422.

```json
{"currentPassword":"DemoOnly#2026","newPassword":"ChangedDemo#2026"}
```

**Xử lý:** có thể tính hash mới ngoài write critical section nhưng phải đọc lại actor/hash/version, kiểm password hiện tại dưới khóa trước ghi; mật khẩu mới phải khác mật khẩu hiện tại. Cập nhật password_hash và tăng session_version nguyên tử. Các phiên khác bị vô hiệu bằng version; có thể dọn session cũ ngoài transaction. Regenerate phiên hiện tại với version/token mới, lưu thành công trước 204.

**Thành công:** 204, không body. Không thay role/identifier/profile, không trả hash.

**Lỗi:** 422 `PASSWORD_INCORRECT`/`PASSWORD_UNCHANGED`/`VALIDATION_ERROR`; 401 do thiếu/hết phiên hoặc khóa; 403 do Origin/CSRF/role không hợp lệ; 503 khi store/DB lỗi. Nếu password đã commit nhưng lưu phiên mới thất bại, trả 503 và clear cookie; người dùng đăng nhập lại bằng password mới. Không mô tả DB đã rollback nếu commit thực tế thành công.

**Kiểm chứng:** password hiện tại sai không đổi dữ liệu; password cũ login thất bại sau đổi; password mới login được; request kế tiếp của thiết bị khác nhận 401 `SESSION_EXPIRED`; phiên hiện tại hoạt động với cookie mới; response không body; không log password rõ. Nguồn UC-03/TC-01.3/NFR-01.

## getCurrentIdentity

**HTTP:** `GET /api/v1/auth/me`.

**Quyền và đầu vào:** mọi role đã login; không query/body. Fresh guard đọc account và tên hiển thị hiện hành mỗi request; không dùng role/khóa/profile cũ để bỏ kiểm tra.

**Thành công:** 200, schema data `Identity` như login; `Cache-Control: no-store`. Không gom toàn bộ profile, phí hoặc residence vào Identity.

**Lỗi:** 401 `AUTH_REQUIRED`/`SESSION_EXPIRED`/`ACCOUNT_LOCKED`; 422 `VALIDATION_ERROR` nếu query thừa; 503 `SERVICE_UNAVAILABLE` nếu DB không sẵn sàng. Role lạ không nhận quyền mặc định.

**Kiểm chứng:** chưa login, idle quá 30 phút, version cũ, account khóa và role lạ bị từ chối; không trả dữ liệu một phần khi guard thất bại.

## Quy trình tích hợp auth trước role

Hoàn thành login/logout/password/identity/CSRF và guard tests trước khi tích hợp business role. Chỉ giao task role tích hợp khi kiểm chứng đăng nhập ba role, ownership và khóa đạt yêu cầu.

Scaffold ban đầu chỉ có health, router rỗng và helper nền; đặc tả không chứng minh auth đã chạy. Schema, status và envelope dùng chung tại conventions/data-contracts/errors. Không tự commit, push hoặc merge.
