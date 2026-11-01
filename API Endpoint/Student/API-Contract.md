# API Contract Sinh viên

**Revision 1.0.0 — SPECIFIED_NOT_IMPLEMENTED.** Đây là hợp đồng HTTP để triển khai, không phải kết quả kiểm thử runtime. Nguồn nghiệp vụ: SRS cùng quyết định Q-25–Q-27; thiết kế route/DTO/error/code là DELEGATED_SELECTION theo ủy quyền tạo bộ đặc tả hiện tại.

Đọc [AGENTS của role](AGENTS.md), [danh mục API](../README.md), [quy ước](../Shared/00-conventions.md), [xác thực](../Shared/01-authentication.md), [quyền](../Shared/02-authorization.md), [DTO](../Shared/03-data-contracts.md), [lỗi](../Shared/04-errors.md), [đồng thời và retry](../Shared/05-concurrency-and-retry.md). Schema máy tại [schemas.json](../Shared/schemas.json) là nguồn định nghĩa kiểu dùng chung; các bảng input dưới đây diễn giải schema cùng revision, không tạo chuẩn riêng.

Role gọi các operation dưới đây phải là **SV**. Shared login/logout/change-password/me/csrf được định nghĩa một lần ở Shared, không tạo bản auth theo role. Role khác gọi route này trả403. Mọi protected request kiểm tra lại nguồn account, role, isLocked và ownership. Khi chưa biết role/task, Agent phải hỏi người giao việc theo AGENTS trước khi code.

## Danh mục

| Operation | HTTP | Request | Response |
|---|---|---|---|
| [studentGetProfile](#studentgetprofile) | `GET /api/v1/student/profile` | `None` | `StudentProfile` |
| [studentUpdateContact](#studentupdatecontact) | `PATCH /api/v1/student/profile` | `ContactPatch` | `StudentProfile` |
| [studentListBuildings](#studentlistbuildings) | `GET /api/v1/student/buildings` | `PageQuery` | `Building[]` |
| [studentListRooms](#studentlistrooms) | `GET /api/v1/student/rooms` | `RoomQuery` | `Room[]` |
| [studentGetRoom](#studentgetroom) | `GET /api/v1/student/rooms/{roomId}` | `None` | `Room` |
| [studentGetPeriod](#studentgetperiod) | `GET /api/v1/student/registration-period` | `None` | `RegistrationPeriod` |
| [studentCreateApplication](#studentcreateapplication) | `POST /api/v1/student/applications` | `ApplicationCreate` | `Application` |
| [studentListApplications](#studentlistapplications) | `GET /api/v1/student/applications` | `ApplicationQuery` | `Application[]` |
| [studentGetApplication](#studentgetapplication) | `GET /api/v1/student/applications/{applicationId}` | `None` | `Application` |
| [studentListResidences](#studentlistresidences) | `GET /api/v1/student/residences` | `ResidenceQuery` | `Residence[]` |
| [studentGetResidence](#studentgetresidence) | `GET /api/v1/student/residences/{residenceId}` | `None` | `Residence` |
| [studentListReceipts](#studentlistreceipts) | `GET /api/v1/student/receipts` | `ReceiptQuery` | `Receipt[]` |
| [studentGetReceipt](#studentgetreceipt) | `GET /api/v1/student/receipts/{receiptId}` | `None` | `Receipt` |

## Quy tắc triển khai cho toàn bộ role

Code nằm tại `backend/src/roles/student/`. Tên export ở từng lớp giữ đúng operationId; ví dụ controller và service có thể cùng tên vì khác module. Router gọi controller, controller gọi service, service gọi repository; không gọi SQL từ router/controller. Mỗi lớp import bằng alias namespace để không nhầm hàm. Repository nhận DB client từ service khi đang trong transaction, không tự mở pool/commit lồng.

Không có PATCH toàn bộ entity, DELETE mặc định, đổi role, tự hủy đơn SV, thanh toán online/thu từng phần/hoàn tiền. Các phần không có trong schema request đều bị từ chối422. PATCH thiếu trường giữ nguyên, null chỉ cho trường nullable, object rỗng422; thay đổi nghiệp vụ lặp trả409, ngoại lệ PATCH hồ sơ/phòng/tên tòa cùng giá trị có thể trả200 và không làm phát sinh tác dụng phụ.

Path UUID không hợp lệ422; UUID hợp lệ không tìm thấy404. Query filter ID hợp lệ nhưng không khớp bản ghi trả200 danh sách rỗng. Trường ngày phải là lịch thực tế, format YYYY-MM-DD; ngày sinh/ngày nghiệp vụ không được tương lai theo Asia/Ho_Chi_Minh; ngày trả không trước ngày nhận. Timestamp audit do server lấy UTC, không nhận từ client. Thông tin giả trong ví dụ chỉ minh họa, không được dùng như khóa có sẵn trên mọi máy.

## studentGetProfile

**Xem hồ sơ cá nhân** · `GET /api/v1/student/profile` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-02**; UC-09; QT-03; FR-02/AC02; TC-02.2. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Lấy studentId từ actor đã xác thực, đọc đúng một student_profiles.id. Trả toàn bộ StudentProfile của chính SV; thiếu liên kết hồ sơ trả 404, không cho truyền studentId để đổi chủ thể.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_profiles`; chỉ mapping các cột được DTO cho phép.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **StudentProfile** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "studentCode": "SV001",
    "fullName": "Sinh viên mẫu",
    "gender": "MALE",
    "className": "K29",
    "faculty": "CNTT",
    "phone": "0900000000",
    "email": null,
    "dateOfBirth": null,
    "permanentAddress": null,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentGetProfile` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentGetProfile` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentGetProfile` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentGetProfile` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentGetProfile` |
| Kiểm thử tích hợp | `backend/tests/student/studentGetProfile.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentGetProfile` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentUpdateContact

**Cập nhật liên hệ cá nhân** · `PATCH /api/v1/student/profile` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-02**; UC-10; QT-03; FR-02/AC02; TC-02.2. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ContactPatch**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `phone` | Không | string/null; pattern="^\\+?[0-9]{7,20}$" |
| `email` | Không | string/null; format="email"; maxLength=254 |

Object cần ít nhất 1 thuộc tính.

Ví dụ request:

```json
{
  "phone": "+84900000000",
  "email": "sv.demo@example.test"
}
```

### Điều kiện trước và xử lý

PATCH chỉ phone và email của hồ sơ gắn với phiên. Thiếu trường giữ giá trị cũ, null xóa giá trị liên hệ, object phải có ít nhất một thuộc tính; payload cùng giá trị hiện có vẫn 200. Không sửa tên, MSSV, giới tính, lớp, khoa, ngày sinh, địa chỉ hoặc dữ liệu account.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_profiles`; chỉ mapping các cột được DTO cho phép.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **StudentProfile** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "studentCode": "SV001",
    "fullName": "Sinh viên mẫu",
    "gender": "MALE",
    "className": "K29",
    "faculty": "CNTT",
    "phone": "+84900000000",
    "email": "sv.demo@example.test",
    "dateOfBirth": null,
    "permanentAddress": null,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại hoặc ngoài ownership SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentUpdateContact` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentUpdateContact` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentUpdateContact` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentUpdateContact` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentUpdateContact` |
| Kiểm thử tích hợp | `backend/tests/student/studentUpdateContact.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentUpdateContact` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.
- Gửi gender/role/studentId kèm phone phải 422 và không đổi bất cứ trường nào; hai SV không sửa được hồ sơ nhau.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentListBuildings

**Danh sách tòa để lọc phòng** · `GET /api/v1/student/buildings` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-13; QT-05; FR-03/AC03; TC-03.3; API đọc hỗ trợ. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `code ASC,id ASC`.

Schema **PageQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Chỉ trả tòa có ít nhất một phòng ACTIVE; không bắt buộc còn chỗ. Không trả danh sách người ở. Chỉ query PageQuery, không nhận q/status.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`buildings`; Student lọc EXISTS phòng ACTIVE.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Building[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "A",
      "name": "Tòa A",
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
| 403 | FORBIDDEN | Role không phải SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentListBuildings` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentListBuildings` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentListBuildings` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentListBuildings` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentListBuildings` |
| Kiểm thử tích hợp | `backend/tests/student/studentListBuildings.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentListBuildings` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.
- Tòa chỉ có phòng INACTIVE không xuất hiện; tòa có phòng ACTIVE nhưng hết chỗ vẫn xuất hiện.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentListRooms

**Tra cứu và lọc phòng** · `GET /api/v1/student/rooms` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-13; QT-05; FR-03/AC03; TC-03.3. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `buildingCode ASC,code ASC,id ASC`.

Schema **RoomQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `q` | Không | string; maxLength=100 |
| `buildingId` | Không | string; format="uuid" |
| `gender` | Không | string; enum=["MALE", "FEMALE"] |
| `hasAvailability` | Không | boolean |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Luôn ràng buộc room.status=ACTIVE trên server. Kết hợp AND buildingId,gender,hasAvailability,q nếu có. hasAvailability=true nghĩa availablePlaces>0; false nghĩa availablePlaces=0; bỏ lọc nghĩa cả hai. q tìm chứa mã phòng hoặc mã/tên tòa, không phân biệt hoa thường. Không tự ép giới tính theo hồ sơ khi người dùng chỉ xem; kiểm tra phù hợp khi gửi đơn.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`rooms`, `buildings`, view `room_availability`, `residence_records` để tính sức chứa.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Room[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "buildingId": "00000000-0000-4000-8000-000000000001",
      "buildingCode": "A",
      "buildingName": "Tòa A",
      "code": "A101",
      "capacity": 6,
      "gender": "MALE",
      "feeVnd": "1000000",
      "status": "ACTIVE",
      "allocatedPlaces": 0,
      "availablePlaces": 6,
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
| 403 | FORBIDDEN | Role không phải SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentListRooms` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentListRooms` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentListRooms` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentListRooms` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentListRooms` |
| Kiểm thử tích hợp | `backend/tests/student/studentListRooms.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentListRooms` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.
- Phòng sức chứa6 với2 ALLOCATED và3 CHECKED_IN phải trả allocatedPlaces5, availablePlaces1. Thử kết hợp cả ba bộ lọc và phòng INACTIVE.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentGetRoom

**Xem chi tiết phòng đang sử dụng** · `GET /api/v1/student/rooms/{roomId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-13; QT-05; FR-03/AC01,AC03; TC-03.1,TC-03.3. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `roomId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc phòng ACTIVE theo roomId, ghép buildingCode/buildingName và số chỗ tại cùng snapshot. Phòng không tồn tại hoặc INACTIVE trả404. Không trả người cùng phòng hoặc liên hệ sinh viên khác.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`rooms`, `buildings`, view `room_availability`, `residence_records` để tính sức chứa.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Room** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "buildingId": "00000000-0000-4000-8000-000000000001",
    "buildingCode": "A",
    "buildingName": "Tòa A",
    "code": "A101",
    "capacity": 6,
    "gender": "MALE",
    "feeVnd": "1000000",
    "status": "ACTIVE",
    "allocatedPlaces": 0,
    "availablePlaces": 6,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại hoặc ngoài ownership SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentGetRoom` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentGetRoom` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentGetRoom` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentGetRoom` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentGetRoom` |
| Kiểm thử tích hợp | `backend/tests/student/studentGetRoom.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentGetRoom` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentGetPeriod

**Xem trạng thái kỳ đăng ký** · `GET /api/v1/student/registration-period` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-04**; UC-15 đọc hỗ trợ; QT-06; FR-04/AC01,AC02; TC-04.1,TC-04.2. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc singleton registration_period.id=1. Trả OPEN/CLOSED ngay cả khi kỳ đóng; SV không thay đổi trạng thái kỳ.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

Singleton `registration_period.id=1`.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **RegistrationPeriod** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": 1,
    "status": "OPEN",
    "updatedBy": "00000000-0000-4000-8000-000000000001",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentGetPeriod` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentGetPeriod` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentGetPeriod` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentGetPeriod` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentGetPeriod` |
| Kiểm thử tích hợp | `backend/tests/student/studentGetPeriod.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentGetPeriod` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentCreateApplication

**Gửi đơn đăng ký lưu trú** · `POST /api/v1/student/applications` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-04**; UC-15; QT-05,QT-06,QT-07,QT-08,QT-10; FR-04/AC01,AC02; TC-04.1,TC-04.2. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ApplicationCreate**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `preferredRoomId` | Có | string; format="uuid" |

Ví dụ request:

```json
{
  "preferredRoomId": "00000000-0000-4000-8000-000000000001"
}
```

### Điều kiện trước và xử lý

Trong transaction chung: kiểm tra kỳ OPEN; không có PENDING của student; không có residence ALLOCATED/CHECKED_IN; phòng nguyện vọng tồn tại, ACTIVE, phù hợp gender và availablePlaces>0. Tạo applications PENDING với studentId suy từ phiên, periodId=1; reviewer/reason null. Không tạo residence, không giữ chỗ và không giảm số chỗ. Gửi lại sau đơn bị từ chối hoặc sau lưu trú kết thúc/hủy được phép khi đủ điều kiện.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`applications`, `student_profiles`, `rooms`, `registration_period`, `residence_records`; transaction duyệt/xếp dùng chung.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **201**; `Content-Type: application/json`. Schema data **Application** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "studentId": "00000000-0000-4000-8000-000000000001",
    "preferredRoomId": "00000000-0000-4000-8000-000000000001",
    "periodId": 1,
    "status": "PENDING",
    "rejectionReason": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại hoặc ngoài ownership SV. |
| 409 | PERIOD_CLOSED | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | PENDING_APPLICATION_EXISTS | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | ACTIVE_RESIDENCE_EXISTS | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | ROOM_INACTIVE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | GENDER_MISMATCH | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | ROOM_FULL | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "PERIOD_CLOSED",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentCreateApplication` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentCreateApplication` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentCreateApplication` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentCreateApplication` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentCreateApplication` |
| Kiểm thử tích hợp | `backend/tests/student/studentCreateApplication.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentCreateApplication` với đúng role và dữ liệu hợp lệ: HTTP201, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.
- Hai request đồng thời cùng student: đúng một201, một409; không có hai đơn PENDING. Room availability trước/sau gửi giữ nguyên.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentListApplications

**Theo dõi danh sách đơn cá nhân** · `GET /api/v1/student/applications` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-04**; UC-16; QT-07,QT-09; FR-04/AC01; TC-04.1. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **ApplicationQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `status` | Không | string; enum=["PENDING", "APPROVED", "REJECTED"] |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Lọc studentId từ phiên trước filter/status và phân trang. Bao gồm PENDING,APPROVED,REJECTED theo dữ liệu đã lưu; không tự đổi đơn chờ khi phòng đầy hoặc kỳ đóng. Response có lý do từ chối khi REJECTED.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`applications`, `student_profiles`, `rooms`, `registration_period`, `residence_records`; transaction duyệt/xếp dùng chung.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Application[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "studentId": "00000000-0000-4000-8000-000000000001",
      "preferredRoomId": "00000000-0000-4000-8000-000000000001",
      "periodId": 1,
      "status": "PENDING",
      "rejectionReason": null,
      "reviewedBy": null,
      "reviewedAt": null,
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
| 403 | FORBIDDEN | Role không phải SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentListApplications` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentListApplications` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentListApplications` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentListApplications` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentListApplications` |
| Kiểm thử tích hợp | `backend/tests/student/studentListApplications.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentListApplications` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentGetApplication

**Xem kết quả một đơn cá nhân** · `GET /api/v1/student/applications/{applicationId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-04**; UC-16; QT-07,QT-09; FR-04/AC01; TC-04.1. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `applicationId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Truy vấn applications.id=applicationId AND student_id=actor.studentId. Không tồn tại hoặc thuộc SV khác đều trả404 cùng mã/thông điệp; kết quả xét duyệt lấy từ bản ghi hiện hành.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`applications`, `student_profiles`, `rooms`, `registration_period`, `residence_records`; transaction duyệt/xếp dùng chung.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Application** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "studentId": "00000000-0000-4000-8000-000000000001",
    "preferredRoomId": "00000000-0000-4000-8000-000000000001",
    "periodId": 1,
    "status": "PENDING",
    "rejectionReason": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại hoặc ngoài ownership SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentGetApplication` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentGetApplication` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentGetApplication` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentGetApplication` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentGetApplication` |
| Kiểm thử tích hợp | `backend/tests/student/studentGetApplication.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentGetApplication` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentListResidences

**Xem lịch sử lưu trú cá nhân** · `GET /api/v1/student/residences` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-06**; Q-13; FR-06; QT-11,QT-12,QT-13,QT-16; đọc hỗ trợ phạm vi SRS. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **ResidenceQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `status` | Không | string; enum=["ALLOCATED", "CHECKED_IN", "ENDED", "CANCELLED"] |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Lọc residence_records.student_id theo phiên; bao gồm cả ALLOCATED,CHECKED_IN,ENDED,CANCELLED. Không trả danh sách người ở chung; thông tin phòng dùng roomId để gọi tra cứu phòng khi còn ACTIVE. Lịch sử không mất khi phòng ngừng sử dụng.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`residence_records`, `applications`, `student_profiles`, `rooms`; giữ quan hệ phiếu trong `room_fee_receipts`.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Residence[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "applicationId": "00000000-0000-4000-8000-000000000001",
      "studentId": "00000000-0000-4000-8000-000000000001",
      "roomId": "00000000-0000-4000-8000-000000000001",
      "status": "ALLOCATED",
      "allocatedBy": "00000000-0000-4000-8000-000000000001",
      "allocatedAt": "2026-10-30T03:00:00Z",
      "checkInDate": null,
      "checkedInBy": null,
      "checkedInAt": null,
      "checkOutDate": null,
      "checkedOutBy": null,
      "checkedOutAt": null,
      "cancellationReason": null,
      "cancelledBy": null,
      "cancelledAt": null
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
| 403 | FORBIDDEN | Role không phải SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentListResidences` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentListResidences` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentListResidences` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentListResidences` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentListResidences` |
| Kiểm thử tích hợp | `backend/tests/student/studentListResidences.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentListResidences` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentGetResidence

**Xem một hồ sơ lưu trú cá nhân** · `GET /api/v1/student/residences/{residenceId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-06**; Q-13; FR-06; QT-11,QT-12,QT-13,QT-16; đọc hỗ trợ phạm vi SRS. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `residenceId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc residenceId kèm student_id theo phiên; kể cả đã ENDED/CANCELLED. Giữ các ngày và lý do đã ghi; SV không có quyền nhận/trả/hủy qua endpoint đọc. Không tồn tại hoặc sai sở hữu trả404.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`residence_records`, `applications`, `student_profiles`, `rooms`; giữ quan hệ phiếu trong `room_fee_receipts`.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Residence** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "applicationId": "00000000-0000-4000-8000-000000000001",
    "studentId": "00000000-0000-4000-8000-000000000001",
    "roomId": "00000000-0000-4000-8000-000000000001",
    "status": "ALLOCATED",
    "allocatedBy": "00000000-0000-4000-8000-000000000001",
    "allocatedAt": "2026-10-30T03:00:00Z",
    "checkInDate": null,
    "checkedInBy": null,
    "checkedInAt": null,
    "checkOutDate": null,
    "checkedOutBy": null,
    "checkedOutAt": null,
    "cancellationReason": null,
    "cancelledBy": null,
    "cancelledAt": null
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại hoặc ngoài ownership SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentGetResidence` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentGetResidence` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentGetResidence` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentGetResidence` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentGetResidence` |
| Kiểm thử tích hợp | `backend/tests/student/studentGetResidence.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentGetResidence` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentListReceipts

**Xem phiếu thu cá nhân** · `GET /api/v1/student/receipts` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-07**; UC-26; QT-14,QT-15,QT-16; FR-07/AC01,AC02; TC-07.1,TC-07.2. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **ReceiptQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `status` | Không | string; enum=["UNPAID", "PAID"] |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

JOIN receipts→residence để lọc student_id từ phiên trước phân trang. Bao gồm phiếu của residence đã ENDED/CANCELLED, cả UNPAID/PAID. Trả amountVnd snapshot dạng chuỗi; không tính lại bằng feeVnd hiện tại.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`room_fee_receipts`, `residence_records`, `rooms`; amountVnd snapshot từ feeVnd.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Receipt[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "residenceId": "00000000-0000-4000-8000-000000000001",
      "amountVnd": "1000000",
      "status": "UNPAID",
      "createdBy": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-10-30T03:00:00Z",
      "paymentDate": null,
      "paidBy": null,
      "paidAt": null
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
| 403 | FORBIDDEN | Role không phải SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentListReceipts` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentListReceipts` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentListReceipts` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentListReceipts` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentListReceipts` |
| Kiểm thử tích hợp | `backend/tests/student/studentListReceipts.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentListReceipts` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## studentGetReceipt

**Xem chi tiết phiếu thu cá nhân** · `GET /api/v1/student/receipts/{receiptId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-07**; UC-26; QT-14,QT-15,QT-16; FR-07/AC01,AC02; TC-07.1,TC-07.2. Role **SV**; session cookie hợp lệ, account chưa khóa. Ownership lấy từ phiên; không cho client chọn sinh viên khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `receiptId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc receiptId bằng JOIN residence.student_id của phiên. Phiếu không tồn tại hoặc của SV khác cùng404. Dữ liệu paymentDate,paidBy,paidAt là null khi UNPAID và được lưu sau BQL xác nhận; SV không gửi request xác nhận tiền.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`room_fee_receipts`, `residence_records`, `rooms`; amountVnd snapshot từ feeVnd.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Receipt** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "residenceId": "00000000-0000-4000-8000-000000000001",
    "amountVnd": "1000000",
    "status": "UNPAID",
    "createdBy": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-10-30T03:00:00Z",
    "paymentDate": null,
    "paidBy": null,
    "paidAt": null
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải SV. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại hoặc ngoài ownership SV. |
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
| Mount method/path và middleware | `backend/src/roles/student/router.ts` → controller.`studentGetReceipt` |
| Transport và serialize response | `backend/src/roles/student/controller.ts` export `studentGetReceipt` |
| Nghiệp vụ, transaction | `backend/src/roles/student/service.ts` export `studentGetReceipt` |
| SQL có tham số và mapping | `backend/src/roles/student/repository.ts` export `studentGetReceipt` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/student/validation.ts` export `studentGetReceipt` |
| Kiểm thử tích hợp | `backend/tests/student/studentGetReceipt.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `studentGetReceipt` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Tạo hai SV và dữ liệu riêng; list/detail không lộ đối tượng SV còn lại, kể cả filter hoặc UUID đoán được.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## Nơi chạy kiểm thử sau bàn giao

Máy thành viên chỉ cần Node.js 24/npm 11; chạy build/unit theo backend README. Test PostgreSQL cần viết tại backend/tests/integration/<role>/<operationId>.test.ts và bàn giao cho Bùi Thế Anh cùng fixture, lệnh và expected result. Các đường dẫn test trong bảng từng operation là nhóm độc lập; thêm nhóm integration tương ứng cho các ca cần DB. Ghi NOT_RUN_PENDING_OWNER cho test DB chưa chạy, không xóa hoặc giảm ca bắt buộc của contract. Xem [phân công](../../Coordination/testing-responsibilities.md).
