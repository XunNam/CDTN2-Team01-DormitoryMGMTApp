# API Contract Ban quản lý ký túc xá

**Revision 1.0.0 — SPECIFIED_NOT_IMPLEMENTED.** Đây là hợp đồng HTTP để triển khai, không phải kết quả kiểm thử runtime. Nguồn nghiệp vụ: SRS cùng quyết định Q-25–Q-27; thiết kế route/DTO/error/code là DELEGATED_SELECTION theo ủy quyền tạo bộ đặc tả hiện tại.

Đọc [AGENTS của role](AGENTS.md), [danh mục API](../README.md), [quy ước](../Shared/00-conventions.md), [xác thực](../Shared/01-authentication.md), [quyền](../Shared/02-authorization.md), [DTO](../Shared/03-data-contracts.md), [lỗi](../Shared/04-errors.md), [đồng thời và retry](../Shared/05-concurrency-and-retry.md). Schema máy tại [schemas.json](../Shared/schemas.json) là nguồn định nghĩa kiểu dùng chung; các bảng input dưới đây diễn giải schema cùng revision, không tạo chuẩn riêng.

Role gọi các operation dưới đây phải là **BQL**. Shared login/logout/change-password/me/csrf được định nghĩa một lần ở Shared, không tạo bản auth theo role. Role khác gọi route này trả403. Mọi protected request kiểm tra lại nguồn account, role, isLocked và ownership. Khi chưa biết role/task, Agent phải hỏi người giao việc theo AGENTS trước khi code.

## Danh mục

| Operation | HTTP | Request | Response |
|---|---|---|---|
| [managementListProfiles](#managementlistprofiles) | `GET /api/v1/management/student-profiles` | `StudentProfileQuery` | `StudentProfile[]` |
| [managementCreateProfile](#managementcreateprofile) | `POST /api/v1/management/student-profiles` | `ProfileCreate` | `StudentProfile` |
| [managementGetProfile](#managementgetprofile) | `GET /api/v1/management/student-profiles/{studentId}` | `None` | `StudentProfile` |
| [managementUpdateProfile](#managementupdateprofile) | `PATCH /api/v1/management/student-profiles/{studentId}` | `ProfilePatch` | `StudentProfile` |
| [managementListBuildings](#managementlistbuildings) | `GET /api/v1/management/buildings` | `BuildingQuery` | `Building[]` |
| [managementCreateBuilding](#managementcreatebuilding) | `POST /api/v1/management/buildings` | `BuildingCreate` | `Building` |
| [managementGetBuilding](#managementgetbuilding) | `GET /api/v1/management/buildings/{buildingId}` | `None` | `Building` |
| [managementUpdateBuilding](#managementupdatebuilding) | `PATCH /api/v1/management/buildings/{buildingId}` | `BuildingPatch` | `Building` |
| [managementListRooms](#managementlistrooms) | `GET /api/v1/management/rooms` | `RoomQuery` | `Room[]` |
| [managementCreateRoom](#managementcreateroom) | `POST /api/v1/management/rooms` | `RoomCreate` | `Room` |
| [managementGetRoom](#managementgetroom) | `GET /api/v1/management/rooms/{roomId}` | `None` | `Room` |
| [managementUpdateRoom](#managementupdateroom) | `PATCH /api/v1/management/rooms/{roomId}` | `RoomPatch` | `Room` |
| [managementGetPeriod](#managementgetperiod) | `GET /api/v1/management/registration-period` | `None` | `RegistrationPeriod` |
| [managementUpdatePeriod](#managementupdateperiod) | `PATCH /api/v1/management/registration-period` | `PeriodPatch` | `RegistrationPeriod` |
| [managementListApplications](#managementlistapplications) | `GET /api/v1/management/applications` | `ApplicationQuery` | `Application[]` |
| [managementGetApplication](#managementgetapplication) | `GET /api/v1/management/applications/{applicationId}` | `None` | `Application` |
| [managementApproveApplication](#managementapproveapplication) | `POST /api/v1/management/applications/{applicationId}/approve` | `ApplicationApprove` | `ApprovalResult` |
| [managementRejectApplication](#managementrejectapplication) | `POST /api/v1/management/applications/{applicationId}/reject` | `ApplicationReject` | `Application` |
| [managementListResidences](#managementlistresidences) | `GET /api/v1/management/residences` | `ResidenceQuery` | `Residence[]` |
| [managementGetResidence](#managementgetresidence) | `GET /api/v1/management/residences/{residenceId}` | `None` | `Residence` |
| [managementCheckIn](#managementcheckin) | `POST /api/v1/management/residences/{residenceId}/check-in` | `CheckIn` | `Residence` |
| [managementCancelAllocation](#managementcancelallocation) | `POST /api/v1/management/residences/{residenceId}/cancel` | `CancelAllocation` | `Residence` |
| [managementCheckOut](#managementcheckout) | `POST /api/v1/management/residences/{residenceId}/check-out` | `CheckOut` | `Residence` |
| [managementListReceipts](#managementlistreceipts) | `GET /api/v1/management/receipts` | `ReceiptQuery` | `Receipt[]` |
| [managementCreateReceipt](#managementcreatereceipt) | `POST /api/v1/management/receipts` | `ReceiptCreate` | `Receipt` |
| [managementGetReceipt](#managementgetreceipt) | `GET /api/v1/management/receipts/{receiptId}` | `None` | `Receipt` |
| [managementPayReceipt](#managementpayreceipt) | `POST /api/v1/management/receipts/{receiptId}/pay` | `ReceiptPay` | `Receipt` |
| [managementGetStatistics](#managementgetstatistics) | `GET /api/v1/management/statistics` | `None` | `Statistics` |

## Quy tắc triển khai cho toàn bộ role

Code nằm tại `backend/src/roles/management/`. Tên export ở từng lớp giữ đúng operationId; ví dụ controller và service có thể cùng tên vì khác module. Router gọi controller, controller gọi service, service gọi repository; không gọi SQL từ router/controller. Mỗi lớp import bằng alias namespace để không nhầm hàm. Repository nhận DB client từ service khi đang trong transaction, không tự mở pool/commit lồng.

Không có PATCH toàn bộ entity, DELETE mặc định, đổi role, tự hủy đơn SV, thanh toán online/thu từng phần/hoàn tiền. Các phần không có trong schema request đều bị từ chối422. PATCH thiếu trường giữ nguyên, null chỉ cho trường nullable, object rỗng422; thay đổi nghiệp vụ lặp trả409, ngoại lệ PATCH hồ sơ/phòng/tên tòa cùng giá trị có thể trả200 và không làm phát sinh tác dụng phụ.

Path UUID không hợp lệ422; UUID hợp lệ không tìm thấy404. Query filter ID hợp lệ nhưng không khớp bản ghi trả200 danh sách rỗng. Trường ngày phải là lịch thực tế, format YYYY-MM-DD; ngày sinh/ngày nghiệp vụ không được tương lai theo Asia/Ho_Chi_Minh; ngày trả không trước ngày nhận. Timestamp audit do server lấy UTC, không nhận từ client. Thông tin giả trong ví dụ chỉ minh họa, không được dùng như khóa có sẵn trên mọi máy.

## managementListProfiles

**Tìm kiếm hồ sơ sinh viên** · `GET /api/v1/management/student-profiles` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-02**; UC-08; QT-02,QT-03; FR-02/AC01; TC-02.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **StudentProfileQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `q` | Không | string; maxLength=100 |
| `gender` | Không | string; enum=["MALE", "FEMALE"] |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Đọc toàn bộ hồ sơ theo quyền BQL, lọc gender nếu có; q tìm chứa studentCode hoặc fullName không phân biệt hoa thường. Liên hệ/dateOfBirth/address thuộc DTO hồ sơ; không JOIN password/hash hoặc session.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_profiles`; chỉ mapping các cột được DTO cho phép.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **StudentProfile[]** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": [
    {
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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementListProfiles` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementListProfiles` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementListProfiles` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementListProfiles` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementListProfiles` |
| Kiểm thử tích hợp | `backend/tests/management/managementListProfiles.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementListProfiles` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementCreateProfile

**Tạo hồ sơ sinh viên** · `POST /api/v1/management/student-profiles` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-02**; UC-07; QT-02,QT-03; FR-02/AC01; TC-02.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ProfileCreate**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `studentCode` | Có | string; pattern="^[A-Z0-9][A-Z0-9_-]{0,31}$" |
| `fullName` | Có | string; minLength=1; maxLength=150 |
| `gender` | Có | string; enum=["MALE", "FEMALE"] |
| `className` | Có | string; minLength=1; maxLength=100 |
| `faculty` | Có | string; minLength=1; maxLength=100 |
| `phone` | Không | string/null; pattern="^\\+?[0-9]{7,20}$" |
| `email` | Không | string/null; format="email"; maxLength=254 |
| `dateOfBirth` | Không | string/null; format="date" |
| `permanentAddress` | Không | string/null; minLength=1; maxLength=500 |

Ví dụ request:

```json
{
  "studentCode": "SV001",
  "fullName": "Sinh viên mẫu",
  "gender": "MALE",
  "className": "K29",
  "faculty": "CNTT",
  "phone": "0900000000",
  "email": null,
  "dateOfBirth": null,
  "permanentAddress": null
}
```

### Điều kiện trước và xử lý

Chuẩn hóa studentCode trim/uppercase; kiểm tra duy nhất. Tạo student_profiles với các trường bắt buộc; trường optional bỏ qua được lưu null. Không tạo student_accounts hoặc sinh mật khẩu. dateOfBirth nếu có phải là ngày hợp lệ không tương lai.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`student_profiles`; chỉ mapping các cột được DTO cho phép.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **201**; `Content-Type: application/json`. Schema data **StudentProfile** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

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
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | DUPLICATE_STUDENT_CODE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "DUPLICATE_STUDENT_CODE",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementCreateProfile` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementCreateProfile` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementCreateProfile` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementCreateProfile` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementCreateProfile` |
| Kiểm thử tích hợp | `backend/tests/management/managementCreateProfile.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementCreateProfile` với đúng role và dữ liệu hợp lệ: HTTP201, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Hai request cùng mã khác hoa/thường phải có đúng một201, một409; không có account được tự tạo.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetProfile

**Xem chi tiết hồ sơ sinh viên** · `GET /api/v1/management/student-profiles/{studentId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-02**; UC-08; QT-03; FR-02/AC01; TC-02.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `studentId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc student_profiles theo studentId; trả404 nếu không có. Không ghép account/password vào StudentProfile.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetProfile` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetProfile` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetProfile` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetProfile` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetProfile` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetProfile.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetProfile` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementUpdateProfile

**Cập nhật hồ sơ sinh viên** · `PATCH /api/v1/management/student-profiles/{studentId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-02**; UC-07; QT-03,QT-10; FR-02/AC01; TC-02.1; Q-09/Q-10. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `studentId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ProfilePatch**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `fullName` | Không | string; minLength=1; maxLength=150 |
| `gender` | Không | string; enum=["MALE", "FEMALE"] |
| `className` | Không | string; minLength=1; maxLength=100 |
| `faculty` | Không | string; minLength=1; maxLength=100 |
| `phone` | Không | string/null; pattern="^\\+?[0-9]{7,20}$" |
| `email` | Không | string/null; format="email"; maxLength=254 |
| `dateOfBirth` | Không | string/null; format="date" |
| `permanentAddress` | Không | string/null; minLength=1; maxLength=500 |

Object cần ít nhất 1 thuộc tính.

Ví dụ request:

```json
{
  "fullName": "Sinh viên mẫu",
  "phone": null
}
```

### Điều kiện trước và xử lý

Chỉ sửa fullName,gender,className,faculty,phone,email,dateOfBirth,permanentAddress; studentCode bất biến. Nếu đổi gender, kiểm tra mọi residence ALLOCATED/CHECKED_IN tương thích room.gender; xung đột409. Đơn PENDING không tự kết thúc, sẽ kiểm tra lại lúc duyệt. PATCH cùng giá trị trả200.

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
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | GENDER_MISMATCH | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "GENDER_MISMATCH",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementUpdateProfile` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementUpdateProfile` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementUpdateProfile` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementUpdateProfile` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementUpdateProfile` |
| Kiểm thử tích hợp | `backend/tests/management/managementUpdateProfile.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementUpdateProfile` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Sửa gender đồng thời duyệt/xếp phải không tạo residence lệch giới tính; MSSV trong payload422, DOB tương lai422.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementListBuildings

**Danh sách tòa nhà** · `GET /api/v1/management/buildings` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-11; FR-03; QT-04. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `code ASC,id ASC`.

Schema **BuildingQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `q` | Không | string; maxLength=100 |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Trả các tòa kể cả chưa có phòng; q tìm chứa code/name không phân biệt hoa thường. Không thêm trạng thái tòa hoặc dữ liệu người ở ngoài schema.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementListBuildings` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementListBuildings` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementListBuildings` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementListBuildings` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementListBuildings` |
| Kiểm thử tích hợp | `backend/tests/management/managementListBuildings.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementListBuildings` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementCreateBuilding

**Tạo tòa nhà** · `POST /api/v1/management/buildings` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-11; FR-03; QT-04. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **BuildingCreate**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `code` | Có | string; pattern="^[A-Z0-9][A-Z0-9_-]{0,31}$" |
| `name` | Có | string; minLength=1; maxLength=150 |

Ví dụ request:

```json
{
  "code": "A",
  "name": "Tòa A"
}
```

### Điều kiện trước và xử lý

Chuẩn hóa code trim/uppercase rồi kiểm tra duy nhất; tạo buildings code/name. Không tự tạo phòng hoặc kỳ đăng ký.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`buildings`; Student lọc EXISTS phòng ACTIVE.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **201**; `Content-Type: application/json`. Schema data **Building** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "A",
    "name": "Tòa A",
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | DUPLICATE_BUILDING_CODE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "DUPLICATE_BUILDING_CODE",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementCreateBuilding` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementCreateBuilding` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementCreateBuilding` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementCreateBuilding` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementCreateBuilding` |
| Kiểm thử tích hợp | `backend/tests/management/managementCreateBuilding.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementCreateBuilding` với đúng role và dữ liệu hợp lệ: HTTP201, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Hai mã tương đương sau chuẩn hóa không tạo hai tòa; tên trắng422.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetBuilding

**Xem chi tiết tòa nhà** · `GET /api/v1/management/buildings/{buildingId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-11; FR-03; QT-04. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `buildingId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc buildings theo buildingId, không có trả404. Response Building không nhúng danh sách phòng; dùng managementListRooms với buildingId để tra phòng.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`buildings`; Student lọc EXISTS phòng ACTIVE.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Building** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "A",
    "name": "Tòa A",
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetBuilding` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetBuilding` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetBuilding` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetBuilding` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetBuilding` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetBuilding.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetBuilding` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementUpdateBuilding

**Cập nhật tên tòa nhà** · `PATCH /api/v1/management/buildings/{buildingId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-11; FR-03; Q-10. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `buildingId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **BuildingPatch**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `name` | Có | string; minLength=1; maxLength=150 |

Ví dụ request:

```json
{
  "name": "Tòa A mới"
}
```

### Điều kiện trước và xử lý

Chỉ sửa name; code bất biến. Không di chuyển hoặc xóa phòng khi đổi tên tòa; lịch sử giữ quan hệ theo UUID. PATCH cùng tên vẫn200.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`buildings`; Student lọc EXISTS phòng ACTIVE.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Building** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "A",
    "name": "Tòa A mới",
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementUpdateBuilding` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementUpdateBuilding` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementUpdateBuilding` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementUpdateBuilding` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementUpdateBuilding` |
| Kiểm thử tích hợp | `backend/tests/management/managementUpdateBuilding.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementUpdateBuilding` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementListRooms

**Danh sách phòng phục vụ quản lý** · `GET /api/v1/management/rooms` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-12; QT-04,QT-05; FR-03/AC01; TC-03.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

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
| `status` | Không | string; enum=["ACTIVE", "INACTIVE"] |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

BQL được đọc ACTIVE và INACTIVE; nếu không có status thì lấy cả hai. Kết hợp AND q,buildingId,gender,hasAvailability,status. q tìm chứa mã phòng hoặc mã/tên tòa. Tính số chỗ theo room_availability, không đếm đơn PENDING.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementListRooms` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementListRooms` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementListRooms` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementListRooms` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementListRooms` |
| Kiểm thử tích hợp | `backend/tests/management/managementListRooms.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementListRooms` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementCreateRoom

**Tạo phòng** · `POST /api/v1/management/rooms` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-12; QT-04,QT-05; FR-03/AC01; TC-03.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **RoomCreate**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `buildingId` | Có | string; format="uuid" |
| `code` | Có | string; pattern="^[A-Z0-9][A-Z0-9_.-]{0,31}$" |
| `capacity` | Có | integer; minimum=1; maximum=10000 |
| `gender` | Có | string; enum=["MALE", "FEMALE"] |
| `feeVnd` | Có | string; pattern="^(0\|[1-9][0-9]{0,18})$"; VND nguyên đồng, giá trị <=9223372036854775807; không ép sang Number. |
| `status` | Có | string; enum=["ACTIVE", "INACTIVE"] |

Ví dụ request:

```json
{
  "buildingId": "00000000-0000-4000-8000-000000000001",
  "code": "A101",
  "capacity": 6,
  "gender": "MALE",
  "feeVnd": "1000000",
  "status": "ACTIVE"
}
```

### Điều kiện trước và xử lý

buildingId phải tồn tại; code trim/uppercase duy nhất trong tòa. Tạo phòng với capacity,gender,feeVnd,status; allocatedPlaces=0,availablePlaces=capacity. Không cho client gửi hai trường số chỗ. feeVnd là chuỗi VND nguyên không âm, không quá bigint.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`rooms`, `buildings`, view `room_availability`, `residence_records` để tính sức chứa.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **201**; `Content-Type: application/json`. Schema data **Room** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

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
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | DUPLICATE_ROOM_CODE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "DUPLICATE_ROOM_CODE",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementCreateRoom` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementCreateRoom` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementCreateRoom` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementCreateRoom` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementCreateRoom` |
| Kiểm thử tích hợp | `backend/tests/management/managementCreateRoom.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementCreateRoom` với đúng role và dữ liệu hợp lệ: HTTP201, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Cùng code trong hai tòa khác nhau được phép; trong cùng tòa409; feeVnd kiểu number hoặc số âm422.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetRoom

**Xem thông tin và số chỗ phòng** · `GET /api/v1/management/rooms/{roomId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-12; QT-04,QT-05; FR-03/AC01; TC-03.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `roomId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

BQL được đọc phòng bất kể ACTIVE/INACTIVE. Tính allocatedPlaces bằng residence ALLOCATED+CHECKED_IN, availablePlaces=capacity-allocatedPlaces; không clamp về0 để che lỗi dữ liệu. Ví dụ6−2−3=1.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetRoom` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetRoom` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetRoom` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetRoom` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetRoom` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetRoom.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetRoom` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementUpdateRoom

**Cập nhật phòng và trạng thái sử dụng** · `PATCH /api/v1/management/rooms/{roomId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-03**; UC-12; QT-04,QT-05,QT-10,QT-14; FR-03/AC02; TC-03.2. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `roomId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **RoomPatch**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `capacity` | Không | integer; minimum=1; maximum=10000 |
| `gender` | Không | string; enum=["MALE", "FEMALE"] |
| `feeVnd` | Không | string; pattern="^(0\|[1-9][0-9]{0,18})$"; VND nguyên đồng, giá trị <=9223372036854775807; không ép sang Number. |
| `status` | Không | string; enum=["ACTIVE", "INACTIVE"] |

Object cần ít nhất 1 thuộc tính.

Ví dụ request:

```json
{
  "capacity": 6,
  "feeVnd": "1200000"
}
```

### Điều kiện trước và xử lý

Chỉ sửa capacity,gender,feeVnd,status. buildingId/code bất biến. Không giảm capacity dưới số residence mở; không đặt INACTIVE khi còn residence mở; không đổi gender làm lệch gender của người đã phân bổ. Chốt các kiểm tra trong transaction chung. Đổi feeVnd chỉ ảnh hưởng phiếu tạo sau đó, không sửa phiếu cũ; đơn PENDING giữ nguyên.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`rooms`, `buildings`, view `room_availability`, `residence_records` để tính sức chứa.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

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
    "feeVnd": "1200000",
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
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | CAPACITY_BELOW_OCCUPANCY | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | ROOM_OCCUPIED | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | GENDER_MISMATCH | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 500 | INTERNAL_ERROR | Lỗi ngoài dự kiến; không lộ SQL, constraint, stack trace hoặc thông tin xác thực. |
| 503 | SERVICE_UNAVAILABLE | Không lấy được tài nguyên/khóa trong giới hạn hoặc storage tạm không sẵn sàng; không báo thành công. |

Ví dụ lỗi 409:

```json
{
  "error": {
    "code": "CAPACITY_BELOW_OCCUPANCY",
    "message": "Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu."
  }
}
```

Mã lỗi và HTTP phải khớp [Shared errors](../Shared/04-errors.md); không trả HTTP200 cho lỗi. Không phản hồi mật khẩu/hash hoặc phân biệt tài nguyên của SV khác bằng thông điệp.

### Vị trí code và kiểm chứng

| Trách nhiệm | File và export |
|---|---|
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementUpdateRoom` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementUpdateRoom` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementUpdateRoom` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementUpdateRoom` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementUpdateRoom` |
| Kiểm thử tích hợp | `backend/tests/management/managementUpdateRoom.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementUpdateRoom` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Có5 chỗ phân bổ: capacity4 hoặc INACTIVE409, dữ liệu nguyên vẹn; sửa đồng thời duyệt chỗ cuối không vượt capacity.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetPeriod

**Xem kỳ đăng ký duy nhất** · `GET /api/v1/management/registration-period` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-04**; UC-14; QT-06; FR-04/AC01,AC02; TC-04.1,TC-04.2. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc singleton registration_period.id=1; không tạo lịch sử nhiều kỳ hoặc lịch tự động. Thiếu singleton là lỗi cấu hình500, không tự tạo trong request.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetPeriod` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetPeriod` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetPeriod` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetPeriod` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetPeriod` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetPeriod.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetPeriod` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementUpdatePeriod

**Mở hoặc đóng kỳ đăng ký** · `PATCH /api/v1/management/registration-period` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-04**; UC-14; QT-06; FR-04/AC01,AC02; TC-04.1,TC-04.2; Q-11. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **PeriodPatch**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `status` | Có | string; enum=["OPEN", "CLOSED"] |

Ví dụ request:

```json
{
  "status": "OPEN"
}
```

### Điều kiện trước và xử lý

Chỉ nhận status OPEN/CLOSED, thực hiện chuyển đổi khác trạng thái hiện tại; cùng trạng thái409. Lưu updatedBy từ actor và updatedAt server. Đóng không hủy đơn hoặc ngăn xét duyệt đơn cũ; mở lại vẫn cùng id1.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

Singleton `registration_period.id=1`.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementUpdatePeriod` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementUpdatePeriod` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementUpdatePeriod` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementUpdatePeriod` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementUpdatePeriod` |
| Kiểm thử tích hợp | `backend/tests/management/managementUpdatePeriod.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementUpdatePeriod` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Đóng kỳ cạnh tranh gửi đơn: thứ tự transaction quyết định; đơn chỉ tạo khi quan sát OPEN trong transaction đã giữ khóa.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementListApplications

**Tra cứu đơn đăng ký** · `GET /api/v1/management/applications` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-05**; UC-17,UC-18; QT-07,QT-09; FR-05; TC-05.1,TC-05.3. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **ApplicationQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `status` | Không | string; enum=["PENDING", "APPROVED", "REJECTED"] |
| `studentId` | Không | string; format="uuid" |
| `preferredRoomId` | Không | string; format="uuid" |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Đọc applications với filter status,studentId,preferredRoomId kết hợp AND; giữ đủ cả lịch sử đã duyệt/từ chối. DTO Application chứa IDs để gọi profile/room detail theo quyền BQL, không nhúng account.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementListApplications` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementListApplications` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementListApplications` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementListApplications` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementListApplications` |
| Kiểm thử tích hợp | `backend/tests/management/managementListApplications.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementListApplications` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetApplication

**Xem chi tiết đơn để xét duyệt** · `GET /api/v1/management/applications/{applicationId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-05**; UC-17,UC-18; QT-07,QT-09; FR-05; TC-05.1,TC-05.3. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `applicationId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc applicationId, trả trạng thái và reviewer/reason hiện hành; không suy rằng đơn vẫn PENDING chỉ vì UI đã mở. Không có trả404.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetApplication` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetApplication` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetApplication` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetApplication` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetApplication` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetApplication.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetApplication` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementApproveApplication

**Duyệt đơn và xếp phòng nguyên tử** · `POST /api/v1/management/applications/{applicationId}/approve` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-05**; UC-17 bao gồm UC-19; QT-05,QT-08,QT-09,QT-10; FR-05/AC01,AC02; TC-05.1,TC-05.2. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `applicationId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ApplicationApprove**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `roomId` | Có | string; format="uuid" |

Ví dụ request:

```json
{
  "roomId": "00000000-0000-4000-8000-000000000001"
}
```

### Điều kiện trước và xử lý

Trong một transaction chung: đơn phải PENDING; roomId chọn trong request có thể khác preferredRoomId; phòng tồn tại,ACTIVE,cùng gender và availablePlaces>0; SV chưa có residence mở. Ghi application APPROVED,reviewedBy/reviewedAt; tạo residence ALLOCATED với applicationId/studentId/roomId và allocatedBy/allocatedAt. Commit cả hai hoặc rollback cả hai. UC-19 là kiểm tra nội bộ, không có endpoint bỏ qua duyệt. Không yêu cầu kỳ còn OPEN.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`applications`, `student_profiles`, `rooms`, `registration_period`, `residence_records`; transaction duyệt/xếp dùng chung.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **ApprovalResult** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "application": {
      "id": "00000000-0000-4000-8000-000000000001",
      "studentId": "00000000-0000-4000-8000-000000000001",
      "preferredRoomId": "00000000-0000-4000-8000-000000000001",
      "periodId": 1,
      "status": "APPROVED",
      "rejectionReason": null,
      "reviewedBy": "00000000-0000-4000-8000-000000000001",
      "reviewedAt": "2026-10-30T03:00:00Z",
      "createdAt": "2026-10-30T03:00:00Z",
      "updatedAt": "2026-10-30T03:00:00Z"
    },
    "residence": {
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
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | INVALID_STATE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | ROOM_INACTIVE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | GENDER_MISMATCH | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | ACTIVE_RESIDENCE_EXISTS | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | ROOM_FULL | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementApproveApplication` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementApproveApplication` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementApproveApplication` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementApproveApplication` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementApproveApplication` |
| Kiểm thử tích hợp | `backend/tests/management/managementApproveApplication.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementApproveApplication` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Hai đơn khác nhau tranh chỗ cuối: một200 một409 ROOM_FULL. Duyệt/từ chối cùng đơn: chỉ một thành công; response thành công chứa cả Application và Residence.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementRejectApplication

**Từ chối đơn có lý do** · `POST /api/v1/management/applications/{applicationId}/reject` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-05**; UC-18; QT-08,QT-09; FR-05/AC03; TC-05.3. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `applicationId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ApplicationReject**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `reason` | Có | string; minLength=1; maxLength=500 |

Ví dụ request:

```json
{
  "reason": "Hồ sơ chưa đáp ứng điều kiện xét duyệt"
}
```

### Điều kiện trước và xử lý

Chỉ đơn PENDING; reason trim còn1–500 ký tự. Đổi REJECTED,rejectionReason=reason,reviewedBy/reviewedAt server. Không tạo residence, không thay sức chứa. Kỳ đóng vẫn xử lý được.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`applications`, `student_profiles`, `rooms`, `registration_period`, `residence_records`; transaction duyệt/xếp dùng chung.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

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
    "status": "REJECTED",
    "rejectionReason": "Hồ sơ chưa đáp ứng điều kiện xét duyệt",
    "reviewedBy": "00000000-0000-4000-8000-000000000001",
    "reviewedAt": "2026-10-30T03:00:00Z",
    "createdAt": "2026-10-30T03:00:00Z",
    "updatedAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementRejectApplication` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementRejectApplication` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementRejectApplication` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementRejectApplication` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementRejectApplication` |
| Kiểm thử tích hợp | `backend/tests/management/managementRejectApplication.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementRejectApplication` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Reason trắng422; từ chối đơn APPROVED/REJECTED409; hai người duyệt/từ chối chỉ một kết quả được commit.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementListResidences

**Tra cứu lịch sử lưu trú** · `GET /api/v1/management/residences` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-06**; UC-23; QT-16; FR-06/AC02,AC03; TC-06.2,TC-06.3. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **ResidenceQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `status` | Không | string; enum=["ALLOCATED", "CHECKED_IN", "ENDED", "CANCELLED"] |
| `studentId` | Không | string; format="uuid" |
| `roomId` | Không | string; format="uuid" |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Đọc residence_records với status,studentId,roomId nếu có. Bao gồm đã ENDED/CANCELLED và dữ liệu ngày/người thao tác. Không bỏ lịch sử vì không còn ở.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementListResidences` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementListResidences` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementListResidences` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementListResidences` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementListResidences` |
| Kiểm thử tích hợp | `backend/tests/management/managementListResidences.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementListResidences` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetResidence

**Xem một hồ sơ lưu trú** · `GET /api/v1/management/residences/{residenceId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-06**; UC-23; QT-16; FR-06; TC-06.2,TC-06.3. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `residenceId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc residenceId ở mọi trạng thái; không có trả404. DTO Residence không nhúng phiếu thu, dùng managementListReceipts với residenceId để tra phiếu.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetResidence` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetResidence` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetResidence` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetResidence` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetResidence` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetResidence.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetResidence` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementCheckIn

**Xác nhận nhận phòng** · `POST /api/v1/management/residences/{residenceId}/check-in` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-06**; UC-20; QT-05,QT-11; FR-06/AC01; TC-06.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `residenceId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **CheckIn**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `checkInDate` | Có | string; format="date" |

Ví dụ request:

```json
{
  "checkInDate": "2026-10-30"
}
```

### Điều kiện trước và xử lý

Chỉ ALLOCATED; checkInDate là ngày thực tế <=hôm nay Việt Nam. Ghi CHECKED_IN,checkInDate,checkedInBy/checkedInAt từ server. Không đổi application,room,allocatedBy/At hoặc lập phiếu tự động. Cả hai trạng thái đều chiếm chỗ nên availability không thay đổi.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`residence_records`, `applications`, `student_profiles`, `rooms`; giữ quan hệ phiếu trong `room_fee_receipts`.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

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
    "status": "CHECKED_IN",
    "allocatedBy": "00000000-0000-4000-8000-000000000001",
    "allocatedAt": "2026-10-30T03:00:00Z",
    "checkInDate": "2026-10-30",
    "checkedInBy": "00000000-0000-4000-8000-000000000001",
    "checkedInAt": "2026-10-30T03:00:00Z",
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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementCheckIn` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementCheckIn` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementCheckIn` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementCheckIn` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementCheckIn` |
| Kiểm thử tích hợp | `backend/tests/management/managementCheckIn.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementCheckIn` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Gọi hai lần: lần đầu200, lần sau409 không đổi ngày/người lần đầu và không trừ thêm chỗ.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementCancelAllocation

**Hủy xếp phòng vì không đến nhận** · `POST /api/v1/management/residences/{residenceId}/cancel` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-06**; UC-21; QT-12,QT-16; FR-06/AC02; TC-06.2; Q-16. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `residenceId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **CancelAllocation**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `reason` | Có | string; minLength=1; maxLength=500 |

Ví dụ request:

```json
{
  "reason": "Sinh viên không đến nhận phòng"
}
```

### Điều kiện trước và xử lý

Chỉ ALLOCATED; reason bắt buộc. Ghi CANCELLED,cancellationReason,cancelledBy/cancelledAt; không có ngày check-in/check-out. Giải phóng một chỗ qua trạng thái; giữ application APPROVED, lịch sử và toàn bộ phiếu UNPAID/PAID. Không thêm hoàn tiền hoặc job tự hủy.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`residence_records`, `applications`, `student_profiles`, `rooms`; giữ quan hệ phiếu trong `room_fee_receipts`.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

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
    "status": "CANCELLED",
    "allocatedBy": "00000000-0000-4000-8000-000000000001",
    "allocatedAt": "2026-10-30T03:00:00Z",
    "checkInDate": null,
    "checkedInBy": null,
    "checkedInAt": null,
    "checkOutDate": null,
    "checkedOutBy": null,
    "checkedOutAt": null,
    "cancellationReason": "Sinh viên không đến nhận phòng",
    "cancelledBy": "00000000-0000-4000-8000-000000000001",
    "cancelledAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementCancelAllocation` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementCancelAllocation` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementCancelAllocation` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementCancelAllocation` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementCancelAllocation` |
| Kiểm thử tích hợp | `backend/tests/management/managementCancelAllocation.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementCancelAllocation` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Có phiếu UNPAID vẫn hủy thành công và phiếu nguyên vẹn; lặp409 không tăng số chỗ thêm.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementCheckOut

**Ghi nhận trả phòng** · `POST /api/v1/management/residences/{residenceId}/check-out` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-06**; UC-22; QT-05,QT-13,QT-16; FR-06/AC03; TC-06.3. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `residenceId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **CheckOut**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `checkOutDate` | Có | string; format="date" |

Ví dụ request:

```json
{
  "checkOutDate": "2026-10-30"
}
```

### Điều kiện trước và xử lý

Chỉ CHECKED_IN; checkOutDate<=hôm nay và >=checkInDate. Ghi ENDED,checkOutDate,checkedOutBy/checkedOutAt. Chỉ giải phóng một chỗ; giữ checkInDate và audit trước đó. Không chặn do UNPAID, không sửa/hủy phiếu, không tính phí theo ngày.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`residence_records`, `applications`, `student_profiles`, `rooms`; giữ quan hệ phiếu trong `room_fee_receipts`.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

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
    "status": "ENDED",
    "allocatedBy": "00000000-0000-4000-8000-000000000001",
    "allocatedAt": "2026-10-30T03:00:00Z",
    "checkInDate": "2026-10-29",
    "checkedInBy": "00000000-0000-4000-8000-000000000001",
    "checkedInAt": "2026-10-29T03:00:00Z",
    "checkOutDate": "2026-10-30",
    "checkedOutBy": "00000000-0000-4000-8000-000000000001",
    "checkedOutAt": "2026-10-30T03:00:00Z",
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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementCheckOut` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementCheckOut` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementCheckOut` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementCheckOut` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementCheckOut` |
| Kiểm thử tích hợp | `backend/tests/management/managementCheckOut.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementCheckOut` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Residence có phiếu UNPAID vẫn trả thành công; số chỗ tăng đúng1; lặp409 không ghi đè audit; ngày trả trước nhận422.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementListReceipts

**Danh sách phiếu và khoản phải thu** · `GET /api/v1/management/receipts` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-07**; UC-24,UC-25 đọc hỗ trợ; QT-14,QT-15,QT-16; FR-07; TC-07.1,TC-07.2. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Các filter kết hợp AND; `page=1`, `pageSize=20` mặc định, tối đa100. Query truyền dưới dạng scalar URL: số nguyên base10, boolean chỉ `true`/`false`; không nhận key lặp, array/object, null hoặc thuộc tính lạ. Trang vượt cuối trả data=[] cùng meta hợp lệ. Sort cố định `createdAt DESC,id ASC` theo thời điểm tạo bản ghi DB; Account tie-break thêm actorKind khi trùng ID hai namespace.

Schema **ReceiptQuery**; allowlist đóng (`additionalProperties:false`). Bảng sau là query sau khi parse theo chuẩn transport.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `page` | Không | integer; minimum=1; default=1 |
| `pageSize` | Không | integer; minimum=1; maximum=100; default=20 |
| `status` | Không | string; enum=["UNPAID", "PAID"] |
| `studentId` | Không | string; format="uuid" |
| `residenceId` | Không | string; format="uuid" |

Ví dụ query: `?page=1&pageSize=20`. Các filter tùy chọn chỉ được dùng đúng bảng trên.

### Điều kiện trước và xử lý

Đọc room_fee_receipts JOIN residence cho filter studentId/residenceId; không bỏ phiếu của residence ENDED/CANCELLED. Trả amountVnd đã lưu; status filter không suy theo trạng thái lưu trú.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementListReceipts` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementListReceipts` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementListReceipts` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementListReceipts` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementListReceipts` |
| Kiểm thử tích hợp | `backend/tests/management/managementListReceipts.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementListReceipts` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Kiểm thử dữ liệu rỗng, nhiều trang, trang vượt cuối, filter kết hợp AND và sort ổn định không trùng/mất mục trong cùng snapshot.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementCreateReceipt

**Lập một phiếu thu cho hồ sơ** · `POST /api/v1/management/receipts` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-07**; UC-24; QT-14,QT-16; FR-07/AC01; TC-07.1. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ReceiptCreate**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `residenceId` | Có | string; format="uuid" |

Ví dụ request:

```json
{
  "residenceId": "00000000-0000-4000-8000-000000000001"
}
```

### Điều kiện trước và xử lý

Residence tồn tại, trạng thái ALLOCATED/CHECKED_IN và chưa có phiếu. Trong transaction chung đọc giá phòng hiện tại từ residence.roomId, tạo phiếu UNPAID với amountVnd snapshot; createdBy/createdAt server, paymentDate/paidBy/paidAt null. fee0 vẫn UNPAID. Request không nhận số tiền,studentId,roomId,status hoặc người lập.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`room_fee_receipts`, `residence_records`, `rooms`; amountVnd snapshot từ feeVnd.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **201**; `Content-Type: application/json`. Schema data **Receipt** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

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
| 403 | FORBIDDEN | Role không phải BQL. |
| 422 | VALIDATION_ERROR | Path/query/body hoặc trường thừa không hợp lệ; details chỉ tên trường và thông báo. |
| 400 / 413 / 415 | INVALID_JSON / PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | JSON sai cú pháp, body quá32KiB hoặc media type không phải application/json; áp dụng ưu tiên transport. |
| 403 | CSRF_INVALID / ORIGIN_FORBIDDEN | Thiếu/sai token hoặc Origin không được phép theo Shared. |
| 404 | NOT_FOUND | Đối tượng đích/phụ thuộc không tồn tại. |
| 409 | INVALID_STATE | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
| 409 | RECEIPT_ALREADY_EXISTS | Điều kiện tương ứng không đạt trong phần xử lý; giữ nguyên dữ liệu. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementCreateReceipt` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementCreateReceipt` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementCreateReceipt` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementCreateReceipt` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementCreateReceipt` |
| Kiểm thử tích hợp | `backend/tests/management/managementCreateReceipt.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementCreateReceipt` với đúng role và dữ liệu hợp lệ: HTTP201, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Hai request lập cùng residence: một201 một409; đổi giá phòng sau lập không làm đổi amountVnd; không tạo phiếu cho ENDED/CANCELLED.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetReceipt

**Xem chi tiết phiếu thu** · `GET /api/v1/management/receipts/{receiptId}` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-07**; UC-24,UC-25 đọc hỗ trợ; QT-14,QT-15,QT-16; FR-07; TC-07.1,TC-07.2. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Path: `receiptId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Đọc receiptId kể cả residence kết thúc/hủy; không có trả404. amountVnd lấy từ phiếu, không lấy lại giá phòng; không trả thông tin account.

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
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetReceipt` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetReceipt` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetReceipt` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetReceipt` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetReceipt` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetReceipt.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetReceipt` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementPayReceipt

**Xác nhận đã nhận đủ tiền** · `POST /api/v1/management/receipts/{receiptId}/pay` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-07**; UC-25; QT-15,QT-16; FR-07/AC02; TC-07.2. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. Mutation yêu cầu `Content-Type: application/json`, Origin được phép và header `X-CSRF-Token` hợp lệ theo Shared. Không tự gửi role/password hash/audit vào body.

Path: `receiptId`: UUID bắt buộc.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Schema **ReceiptPay**; allowlist đóng (`additionalProperties:false`). Bảng sau là JSON body.

| Trường | Bắt buộc | Kiểu và giới hạn |
|---|---|---|
| `paymentDate` | Có | string; format="date" |

Ví dụ request:

```json
{
  "paymentDate": "2026-10-30"
}
```

### Điều kiện trước và xử lý

Chỉ phiếu UNPAID. paymentDate hợp lệ<=hôm nay Việt Nam. Khi BQL xác nhận đã nhận đủ, ghi PAID,paymentDate,paidBy/paidAt server; giữ amountVnd,createdBy/At. Cho phép thanh toán phiếu của residence ENDED/CANCELLED. Không nhận amount,partial amount,payment method hoặc tích hợp online.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`room_fee_receipts`, `residence_records`, `rooms`; amountVnd snapshot từ feeVnd.

Dùng transaction READ COMMITTED và `pg_advisory_xact_lock(724006,1)` theo SQL lock protocol trước mọi business write; đọc lại account/role/khóa trong transaction. Mọi kiểm tra–ghi và serialize dữ liệu sau ghi thuộc cùng transaction/client. Commit tất cả trước response; bất kỳ lỗi nào rollback toàn bộ. Không tự đặt idempotency key hoặc replay thành công giả.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Receipt** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "residenceId": "00000000-0000-4000-8000-000000000001",
    "amountVnd": "1000000",
    "status": "PAID",
    "createdBy": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-10-30T03:00:00Z",
    "paymentDate": "2026-10-30",
    "paidBy": "00000000-0000-4000-8000-000000000001",
    "paidAt": "2026-10-30T03:00:00Z"
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementPayReceipt` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementPayReceipt` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementPayReceipt` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementPayReceipt` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementPayReceipt` |
| Kiểm thử tích hợp | `backend/tests/management/managementPayReceipt.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementPayReceipt` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Xác nhận hai lần: lần sau409; giữ ngày/người lần đầu; SV thấy trạng thái PAID; phiếu0 cũng cần xác nhận thủ công.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## managementGetStatistics

**Xem bốn chỉ số tổng hợp** · `GET /api/v1/management/statistics` · revision1.0.0 · trạng thái đặc tả `SPECIFIED_NOT_IMPLEMENTED` · owner/reviewer nhận trong task, chưa gán theo tên thành viên.

### Truy vết và quyền

Nguồn: **FR-08**; UC-27; QT-17; FR-08/AC01; TC-08.1; SHOULD sau MUST. Role **BQL**; session cookie hợp lệ, account chưa khóa. Quyền này không kế thừa cho role khác.

### HTTP và đầu vào

`Accept: application/json`; cookie phiên do Shared cấp. GET không body; không cần CSRF mutation header. Không dùng Authorization Bearer/JWT riêng.

Không nhận query parameter; kể cả `page` hoặc `studentId` thừa đều422. Không có request body với GET.

Request schema: không body, không query.

### Điều kiện trước và xử lý

Trong cùng snapshot đọc: totalRooms=count rooms ACTIVE; availablePlaces=sum capacity−occupancy của phòng ACTIVE; currentResidents=count residence CHECKED_IN; unpaidReceipts=count receipts UNPAID kể cả residence đã kết thúc/hủy. Rỗng trả0 cả bốn; không thêm doanh thu/export/bộ lọc kỳ.

Thứ tự xử lý theo Shared/00-conventions: giới hạn transport/JSON → Origin/CSRF cho mutation → xác thực fresh/khóa → role → validate path/query/body → tìm bản ghi kèm ownership → trạng thái → điều kiện nghiệp vụ theo thứ tự operation → ghi atomic hoặc đọc → serialize DTO. Không lộ tồn tại dữ liệu trước khi kiểm quyền. Với mutation, các kiểm tra phụ thuộc dữ liệu phải đọc lại sau khi nhận khóa transaction. Khi đồng thời nhiều điều kiện nghiệp vụ sai, trả điều kiện xuất hiện trước trong đoạn xử lý của operation.

### Tác động dữ liệu và đồng thời

`rooms`, `residence_records`, `room_fee_receipts`; cùng một snapshot cho bốn aggregate.

Không ghi dữ liệu nghiệp vụ. Đọc trong một snapshot ổn định; list dùng cùng snapshot cho data và totalItems để không lệch phân trang khi có mutation. Không khóa toàn bộ business write chỉ để đọc danh sách.

Khi client mất response, tải lại trạng thái qua GET trước khi thử mutation mới. Các action đã đổi trạng thái gọi lại trả409 INVALID_STATE; tạo trùng theo mã lỗi riêng. Không dựa vào frontend disable nút để bảo vệ.

### Thành công

HTTP **200**; `Content-Type: application/json`. Schema data **Statistics** tại Shared. Mọi key bắt buộc phải có kể cả null; không tự thêm success/message/entity DB hoặc bỏ null để giảm payload.

```json
{
  "data": {
    "totalRooms": 2,
    "availablePlaces": 7,
    "currentResidents": 3,
    "unpaidReceipts": 2
  }
}
```

### Thất bại

| HTTP | Mã lỗi | Điều kiện |
|---|---|---|
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / ACCOUNT_LOCKED | Thiếu phiên, phiên hết hạn hoặc tài khoản bị khóa; chưa xử lý nghiệp vụ. |
| 403 | FORBIDDEN | Role không phải BQL. |
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
| Mount method/path và middleware | `backend/src/roles/management/router.ts` → controller.`managementGetStatistics` |
| Transport và serialize response | `backend/src/roles/management/controller.ts` export `managementGetStatistics` |
| Nghiệp vụ, transaction | `backend/src/roles/management/service.ts` export `managementGetStatistics` |
| SQL có tham số và mapping | `backend/src/roles/management/repository.ts` export `managementGetStatistics` hoặc helper được dùng bởi operation này |
| Parse/allowlist input | `backend/src/roles/management/validation.ts` export `managementGetStatistics` |
| Kiểm thử tích hợp | `backend/tests/management/managementGetStatistics.test.ts` |

Các file trên là đích triển khai đã chốt; một export chưa được code không được xem là đã hoạt động. Không đặt thêm nghiệp vụ trong server.ts/app.ts, không copy shared auth/database theo role.

- Kiểm thử `managementGetStatistics` với đúng role và dữ liệu hợp lệ: HTTP200, DTO đúng schema, giá trị ngày/tiền/enum/null đúng contract.
- Kiểm thử thiếu phiên, account khóa, hai role còn lại; xác nhận không đọc/ghi dữ liệu khi bị từ chối.
- Kiểm thử field thừa, type sai, UUID sai, query key lặp và boundary của từng trường; mutation thất bại không để lại ghi một phần.
- Dữ liệu2 phòng6chỗ,2 ALLOCATED,3 CHECKED_IN,2 UNPAID trả2/7/3/2; rỗng trả0/0/0/0.

Phụ thuộc đặc tả: [schema và dictionary](../../SQL/README.md), [quy tắc nghiệp vụ](<../../Business Rules/README.md>), Shared DTO/error/lock protocol cùng revision. Những kiểm thử trên là tiêu chí triển khai phải thực hiện và ghi bằng chứng; chưa mặc định đã chạy runtime.

## Nơi chạy kiểm thử sau bàn giao

Máy thành viên chỉ cần Node.js 24/npm 11; chạy build/unit theo backend README. Test PostgreSQL cần viết tại backend/tests/integration/<role>/<operationId>.test.ts và bàn giao cho Bùi Thế Anh cùng fixture, lệnh và expected result. Các đường dẫn test trong bảng từng operation là nhóm độc lập; thêm nhóm integration tương ứng cho các ca cần DB. Ghi NOT_RUN_PENDING_OWNER cho test DB chưa chạy, không xóa hoặc giảm ca bắt buộc của contract. Xem [phân công](../../Coordination/testing-responsibilities.md).
