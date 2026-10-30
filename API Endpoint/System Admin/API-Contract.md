# API Contract Quản trị viên hệ thống

**Revision 1.0.0 — SPECIFIED_NOT_IMPLEMENTED.** Đây là hợp đồng HTTP để triển khai, không phải kết quả kiểm thử runtime. Nguồn nghiệp vụ: SRS cùng quyết định Q-25–Q-27; thiết kế route/DTO/error/code là DELEGATED_SELECTION theo ủy quyền tạo bộ đặc tả hiện tại.

Đọc [AGENTS của role](AGENTS.md), [danh mục API](../README.md), [quy ước](../Shared/00-conventions.md), [xác thực](../Shared/01-authentication.md), [quyền](../Shared/02-authorization.md), [DTO](../Shared/03-data-contracts.md), [lỗi](../Shared/04-errors.md), [đồng thời và retry](../Shared/05-concurrency-and-retry.md). Schema máy tại [schemas.json](../Shared/schemas.json) là nguồn định nghĩa kiểu dùng chung; các bảng input dưới đây diễn giải schema cùng revision, không tạo chuẩn riêng.

Role gọi các operation dưới đây phải là **ADMIN**. Shared login/logout/change-password/me/csrf được định nghĩa một lần ở Shared, không tạo bản auth theo role. Role khác gọi route này trả403. Mọi protected request kiểm tra lại nguồn account, role, isLocked và ownership. Khi chưa biết role/task, Agent phải hỏi người giao việc theo AGENTS trước khi code.

## Danh mục

| Operation | HTTP | Request | Response |
|---|---|---|---|
| [adminListAccounts](#adminlistaccounts) | `GET /api/v1/admin/accounts` | `AccountQuery` | `Account[]` |
| [adminGetAccount](#admingetaccount) | `GET /api/v1/admin/accounts/{actorKind}/{accountId}` | `None` | `Account` |
| [adminCreateAccount](#admincreateaccount) | `POST /api/v1/admin/accounts` | `AccountCreate` | `Account` |
| [adminSetAccountLock](#adminsetaccountlock) | `PATCH /api/v1/admin/accounts/{actorKind}/{accountId}/lock` | `AccountLock` | `Account` |
| [adminListProfileCandidates](#adminlistprofilecandidates) | `GET /api/v1/admin/student-profiles/candidates` | `CandidateQuery` | `ProfileCandidate[]` |

## Quy tắc triển khai cho toàn bộ role

Code nằm tại `backend/src/roles/admin/`. Tên export ở từng lớp giữ đúng operationId; ví dụ controller và service có thể cùng tên vì khác module. Router gọi controller, controller gọi service, service gọi repository; không gọi SQL từ router/controller. Mỗi lớp import bằng alias namespace để không nhầm hàm. Repository nhận DB client từ service khi đang trong transaction, không tự mở pool/commit lồng.

Không có PATCH toàn bộ entity, DELETE mặc định, đổi role, tự hủy đơn SV, thanh toán online/thu từng phần/hoàn tiền. Các phần không có trong schema request đều bị từ chối422. PATCH thiếu trường giữ nguyên, null chỉ cho trường nullable, object rỗng422; thay đổi nghiệp vụ lặp trả409, ngoại lệ PATCH hồ sơ/phòng/tên tòa cùng giá trị có thể trả200 và không làm phát sinh tác dụng phụ.

Path UUID không hợp lệ422; UUID hợp lệ không tìm thấy404. Query filter ID hợp lệ nhưng không khớp bản ghi trả200 danh sách rỗng. Trường ngày phải là lịch thực tế, format YYYY-MM-DD; ngày sinh/ngày nghiệp vụ không được tương lai theo Asia/Ho_Chi_Minh; ngày trả không trước ngày nhận. Timestamp audit do server lấy UTC, không nhận từ client. Thông tin giả trong ví dụ chỉ minh họa, không được dùng như khóa có sẵn trên mọi máy.

## adminListAccounts

**Tra cứu tài khoản hai nguồn** · `GET /api/v1/admin/accounts` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-01**; UC-04,UC-05 đọc hỗ trợ; QT-01,QT-02; FR-01; TC-01.1,TC-01.2. Role **ADMIN**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **AccountQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `q` | Không | string; maxLength=100 |
| `actorKind` | Không | string; enum=["STUDENT", "STAFF"] |
| `role` | Không | string; enum=["SV", "BQL", "ADMIN"] |
| `isLocked` | Không | boolean |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Hợp nhất DTO Account từ student_accounts JOIN profile và staff_accounts. q tìm chứa identifier/displayName không phân biệt hoa thường. Kết hợp actorKind,role,isLocked; tổ hợp filter hợp lệ nhưng không có dữ liệu trả200 danh sách rỗng. Không trả password_hash,session_version,session hoặc dữ liệu lưu trú.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_accounts`, `student_profiles`, `staff_accounts`; shared auth/password hashing/sessionVersion.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Account[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "actorKind": "STUDENT",
      "role": "SV",
      "identifier": "SV001",
      "displayName": "Sinh viên mẫu",
      "studentId": "00000000-0000-4000-8000-000000000001",
      "isLocked": false,
      "createdAt": "2026-10-30T03:00:00Z",
      "updatedAt": "2026-10-30T03:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

Không có dữ liệu: `{"data":[],"meta":{"page":1,"pageSize":20,"totalItems":0,"totalPages":0}}`; trang vượt cuối giữ page yêu cầu, totalItems/totalPages đúng dữ liệu thực.

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải ADMIN. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 422:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu yêu cầu không hợp lệ."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/admin/router.ts` → controller.`adminListAccounts` |
| Transport và serialize response | `backend/src/roles/admin/controller.ts` export `adminListAccounts` |
| Nghiệp vụ, transaction | `backend/src/roles/admin/service.ts` export `adminListAccounts` |
| SQL có tham số và mapping | `backend/src/roles/admin/repository.ts` export `adminListAccounts` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/admin/validation.ts` export `adminListAccounts` |
| Kiểm thử tích hợp | `backend/tests/admin/adminListAccounts.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `adminListAccounts` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## adminGetAccount

**Xem một tài khoản theo namespace** · `GET /api/v1/admin/accounts/{actorKind}/{accountId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-01**; UC-04,UC-05 đọc hỗ trợ; QT-01,QT-02; FR-01; TC-01.1,TC-01.2. Role **ADMIN**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `actorKind`: STUDENT hoặc STAFF, phân biệt nguồn; không phải role, `accountId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

actorKind STUDENT/STAFF xác định kho tài khoản; accountId là UUID của account, không phải studentId. Đọc đúng nguồn hoặc404, không fallback sang nguồn còn lại. Không trả password/hash/phiếu/hồ sơ chi tiết.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_accounts`, `student_profiles`, `staff_accounts`; shared auth/password hashing/sessionVersion.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Account** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "actorKind": "STUDENT",
    "role": "SV",
    "identifier": "SV001",
    "displayName": "Sinh viên mẫu",
    "studentId": "00000000-0000-4000-8000-000000000001",
    "isLocked": false,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải ADMIN. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 422:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu yêu cầu không hợp lệ."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/admin/router.ts` → controller.`adminGetAccount` |
| Transport và serialize response | `backend/src/roles/admin/controller.ts` export `adminGetAccount` |
| Nghiệp vụ, transaction | `backend/src/roles/admin/service.ts` export `adminGetAccount` |
| SQL có tham số và mapping | `backend/src/roles/admin/repository.ts` export `adminGetAccount` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/admin/validation.ts` export `adminGetAccount` |
| Kiểm thử tích hợp | `backend/tests/admin/adminGetAccount.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `adminGetAccount` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## adminCreateAccount

**Cấp tài khoản và gán role lúc tạo** · `POST /api/v1/admin/accounts` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-01**; UC-04 bao gồm UC-06; QT-01,QT-02; FR-01/AC01; TC-01.1; Q-25/Q-26. Role **ADMIN**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **AccountCreate**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

**Biến thể 1**

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `accountType` | Có | string; const="STUDENT" |
| `studentId` | Có | string; format="uuid" |
| `role` | Có | string; const="SV" |
| `password` | Có | string; minLength=8; maxLength=128; Không trim; tối đa128 Unicode code points; băm Argon2id, không trả/log. |

**Biến thể 2**

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `accountType` | Có | string; const="STAFF" |
| `username` | Có | string; pattern="^[a-z0-9][a-z0-9._-]{2,49}$" |
| `displayName` | Có | string; minLength=1; maxLength=150 |
| `role` | Có | string; enum=["BQL", "ADMIN"] |
| `password` | Có | string; minLength=8; maxLength=128; Không trim; tối đa128 Unicode code points; băm Argon2id, không trả/log. |

Ví dụ request:

```json
{
  "accountType": "STUDENT",
  "studentId": "00000000-0000-4000-8000-000000000001",
  "role": "SV",
  "password": "DemoOnly#2026"
}
```

Biến thể STAFF hợp lệ:

```json
{
  "accountType": "STAFF",
  "username": "bql.demo",
  "displayName": "Ban quản lý mẫu",
  "role": "BQL",
  "password": "DemoOnly#2026"
}
```

Không ghép thuộc tính của hai biến thể; `accountType` chỉ chọn kho tạo tài khoản, không thay kiểm quyền ADMIN của người gọi. Username trim/lowercase; studentCode trim/uppercase; password không trim.

### Điều kiện trước và xử lý

STUDENT: profile studentId phải có trước và chưa có account; role bắt buộc SV, identifier suy từ studentCode và displayName từ fullName. STAFF: username trim/lowercase duy nhất nguồn STAFF; displayName bắt buộc; role BQL/ADMIN. Băm password Argon2id theo Shared trước lưu; isLocked=false,sessionVersion server. Không dùng profile như account hoặc tạo account SV thứ hai; role bất biến sau tạo.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_accounts`, `student_profiles`, `staff_accounts`; shared auth/password hashing/sessionVersion.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **201**; `Content-Type: application/json`. Schema data **Account** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "actorKind": "STUDENT",
    "role": "SV",
    "identifier": "SV001",
    "displayName": "Sinh viên mẫu",
    "studentId": "00000000-0000-4000-8000-000000000001",
    "isLocked": false,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải ADMIN. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | ACCOUNT_ALREADY_EXISTS | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | DUPLICATE_USERNAME | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "ACCOUNT_ALREADY_EXISTS",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/admin/router.ts` → controller.`adminCreateAccount` |
| Transport và serialize response | `backend/src/roles/admin/controller.ts` export `adminCreateAccount` |
| Nghiệp vụ, transaction | `backend/src/roles/admin/service.ts` export `adminCreateAccount` |
| SQL có tham số và mapping | `backend/src/roles/admin/repository.ts` export `adminCreateAccount` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/admin/validation.ts` export `adminCreateAccount` |
| Kiểm thử tích hợp | `backend/tests/admin/adminCreateAccount.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `adminCreateAccount` với đúng role và dữ liệu hợp lệ: HTTP201, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo đủSV/BQL/ADMIN, đăng nhập đúng nguồn; SV thiếu profile404, profile đã gắn account409; hash không lộ trong response/log. Username STAFF có thể trùng chuỗi MSSV do namespace riêng.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## adminSetAccountLock

**Khóa hoặc mở khóa tài khoản** · `PATCH /api/v1/admin/accounts/{actorKind}/{accountId}/lock` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-01**; UC-05; QT-01,QT-02; FR-01/AC02; TC-01.2; Q-17/Q-27. Role **ADMIN**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `actorKind`: STUDENT hoặc STAFF, phân biệt nguồn; không phải role, `accountId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **AccountLock**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `isLocked` | Có | boolean |

Ví dụ request:

```json
{
  "isLocked": true
}
```

### Điều kiện trước và xử lý

actorKind/accountId chọn đúng kho; isLocked phải khác hiện tại, lặp cùng giá trị409 INVALID_STATE. Chỉ đổi is_locked và timestamp, không xóa dữ liệu hoặc tự hủy nghiệp vụ. Cho self-lock và không có guard Admin cuối; response của request khóa hiện tại vẫn200, request bảo vệ tiếp theo của account bị khóa401. Mở khóa cho đăng nhập bình thường; không push logout realtime.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_accounts`, `student_profiles`, `staff_accounts`; shared auth/password hashing/sessionVersion.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Account** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "actorKind": "STUDENT",
    "role": "SV",
    "identifier": "SV001",
    "displayName": "Sinh viên mẫu",
    "studentId": "00000000-0000-4000-8000-000000000001",
    "isLocked": true,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải ADMIN. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | INVALID_STATE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/admin/router.ts` → controller.`adminSetAccountLock` |
| Transport và serialize response | `backend/src/roles/admin/controller.ts` export `adminSetAccountLock` |
| Nghiệp vụ, transaction | `backend/src/roles/admin/service.ts` export `adminSetAccountLock` |
| SQL có tham số và mapping | `backend/src/roles/admin/repository.ts` export `adminSetAccountLock` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/admin/validation.ts` export `adminSetAccountLock` |
| Kiểm thử tích hợp | `backend/tests/admin/adminSetAccountLock.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `adminSetAccountLock` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Đang đăng nhập rồi bị khóa: protected request kế tiếp401 ACCOUNT_LOCKED; mở lại đăng nhập được; profile/residence/receipt giữ nguyên; self-lock thành công.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## adminListProfileCandidates

**Tra hồ sơ có thể cấp tài khoản SV** · `GET /api/v1/admin/student-profiles/candidates` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-01**; UC-04 đọc hỗ trợ; QT-01,QT-02; FR-01/AC01; TC-01.1; Q-26. Role **ADMIN**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **CandidateQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `q` | Không | string; maxLength=100 |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Chỉ student_profiles chưa có student_accounts; q tìm chứa studentCode/fullName, không phân biệt hoa thường. Trả đúng ProfileCandidate: id,studentCode,fullName,hasAccount=false. Không trả giới tính,ngày sinh,địa chỉ,liên hệ,lưu trú hoặc phiếu. Kiểm tra chưa có account lại khi tạo, không tin kết quả tra cứu trước đó.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_profiles` LEFT JOIN `student_accounts`, chỉ hồ sơ chưa có account.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **ProfileCandidate[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "studentCode": "SV001",
      "fullName": "Sinh viên mẫu",
      "hasAccount": false
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

Không có dữ liệu: `{"data":[],"meta":{"page":1,"pageSize":20,"totalItems":0,"totalPages":0}}`; trang vượt cuối giữ page yêu cầu, totalItems/totalPages đúng dữ liệu thực.

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải ADMIN. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 422:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu yêu cầu không hợp lệ."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/admin/router.ts` → controller.`adminListProfileCandidates` |
| Transport và serialize response | `backend/src/roles/admin/controller.ts` export `adminListProfileCandidates` |
| Nghiệp vụ, transaction | `backend/src/roles/admin/service.ts` export `adminListProfileCandidates` |
| SQL có tham số và mapping | `backend/src/roles/admin/repository.ts` export `adminListProfileCandidates` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/admin/validation.ts` export `adminListProfileCandidates` |
| Kiểm thử tích hợp | `backend/tests/admin/adminListProfileCandidates.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `adminListProfileCandidates` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.
- Hồ sơ đã có account không hiện; race hai Admin cấp cùng profile phải chỉ có một account; candidates không lộ thông tin liên hệ.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.
