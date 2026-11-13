# Từ điển dữ liệu và mapping API SQL

Revision **1.0.0**. Cột/length/null/default là `DELEGATED_SELECTION` theo prompt chốt schema; nghiệp vụ giữ SRS và Q-25..27. DDL là nguồn chuẩn cấu trúc, [schemas.json](<../API Endpoint/Shared/schemas.json>) là nguồn chuẩn field công khai. Không tự expose mọi cột chỉ vì có mapping dưới đây.

## Quy tắc chung

- UUID/PK/FK trả chuỗi; smallint kỳ trả số1; BIGINT tiền trả chuỗi canonical. JS không chuyển tiền sang Number.
- TIMESTAMPTZ trả ISO8601 UTC; DATE trả YYYY-MM-DD. NULL SQL -> null JSON khi DTO cho phép, không bỏ trường required.
- Request PATCH thiếu=giữ nguyên; null chỉ cho trường nullable; unknown field422. Profile SV chỉ allowlist phone/email.
- Business keys trim/uppercase (studentCode,code), username trim/lowercase; không trim hoặc biến đổi password. Họ tên/class/faculty/address trim; chuỗi rỗng không thay null.
- Độ dài varchar của PostgreSQL tính ký tự; capacity integer1..10000; tên1..150, class/faculty1..100. Validate trước SQL để trả lỗi422 theo field.
- DTO phải SELECT/map allowlist theo từng endpoint, join tên tòa/phòng khi được phép. Không trả passwordHash/sessionVersion/session blob.
- Tất cả trường actor/time, owner sinh viên, status mặc định và giá phiếu do server xác định; client không tự gửi để nhận quyền.

## Bảng và cột

### student_profiles

Hồ sơ sinh viên do BQL tạo trước; SV chỉ đọc riêng và sửa phone/email.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `student_code` | `studentCode` | `varchar(32) NOT NULL UNIQUE CHECK (student_code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$')` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `full_name` | `fullName` | `varchar(150) NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 150 AND full_name = btrim(full_name))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `gender` | `gender` | `varchar(6) NOT NULL CHECK (gender IN ('MALE','FEMALE'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `class_name` | `className` | `varchar(100) NOT NULL CHECK (length(btrim(class_name)) BETWEEN 1 AND 100 AND class_name = btrim(class_name))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `faculty` | `faculty` | `varchar(100) NOT NULL CHECK (length(btrim(faculty)) BETWEEN 1 AND 100 AND faculty = btrim(faculty))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `phone` | `phone` | `varchar(21) CHECK (phone ~ '^\+?[0-9]{7,20}$')` | Nullable, optional + rồi 7..20 chữ số, tổng tối đa21 ký tự. |
| `email` | `email` | `varchar(254) CHECK (length(email) BETWEEN 3 AND 254 AND email = btrim(email) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')` | Nullable, email có giá trị phải hợp lệ; không UNIQUE, không bắt buộc email trường. |
| `date_of_birth` | `dateOfBirth` | `date` | Nullable, ngày <= hôm nay tại Asia/Ho_Chi_Minh; không dùng ngày giả. |
| `permanent_address` | `permanentAddress` | `varchar(500) CHECK (length(btrim(permanent_address)) BETWEEN 1 AND 500 AND permanent_address = btrim(permanent_address))` | Nullable, khi có trim và1..500; chỉ BQL sửa. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### staff_accounts

Kho đăng nhập BQL/Admin; username bất biến, không kế thừa quyền nghiệp vụ.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `username` | `username` | `varchar(50) NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,49}$')` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `display_name` | `displayName` | `varchar(150) NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 150 AND display_name = btrim(display_name))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `role` | `role` | `varchar(5) NOT NULL CHECK (role IN ('BQL','ADMIN'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `password_hash` | Nội bộ | `text NOT NULL CHECK (password_hash LIKE '$argon2id$%')` | Nội bộ; Argon2id. KHÔNG có field passwordHash trong response/log. |
| `is_locked` | `isLocked` | `boolean NOT NULL DEFAULT false` | Admin thay đổi; false mặc định. Guard đọc fresh mỗi request. |
| `session_version` | Nội bộ | `integer NOT NULL DEFAULT 1 CHECK (session_version >= 1)` | Nội bộ; tăng đúng 1 khi hash đổi; không trả trong DTO. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### student_accounts

Kho đăng nhập SV; studentId duy nhất, role cố định SV. Admin cấp/khóa, chủ thể đổi mật khẩu.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `student_id` | `studentId` | `uuid NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE RESTRICT` | FK student_profiles.id; SV lấy từ principal, không cho chọn owner bằng request. |
| `role` | `role` | `varchar(2) NOT NULL DEFAULT 'SV' CHECK (role = 'SV')` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `password_hash` | Nội bộ | `text NOT NULL CHECK (password_hash LIKE '$argon2id$%')` | Nội bộ; Argon2id. KHÔNG có field passwordHash trong response/log. |
| `is_locked` | `isLocked` | `boolean NOT NULL DEFAULT false` | Admin thay đổi; false mặc định. Guard đọc fresh mỗi request. |
| `session_version` | Nội bộ | `integer NOT NULL DEFAULT 1 CHECK (session_version >= 1)` | Nội bộ; tăng đúng 1 khi hash đổi; không trả trong DTO. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### buildings

Danh mục tòa nhà; BQL tạo/sửa tên, code bất biến.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `code` | `code` | `varchar(32) NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$')` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `name` | `name` | `varchar(150) NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 150 AND name = btrim(name))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### rooms

Phòng thuộc tòa; BQL quản lý, SV chỉ đọc phòng ACTIVE. Chỗ còn lại lấy từ view.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `building_id` | `buildingId` | `uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `code` | `code` | `varchar(32) NOT NULL CHECK (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,31}$')` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `capacity` | `capacity` | `integer NOT NULL CHECK (capacity BETWEEN 1 AND 10000)` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `gender` | `gender` | `varchar(6) NOT NULL CHECK (gender IN ('MALE','FEMALE'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `fee_vnd` | `feeVnd` | `bigint NOT NULL CHECK (fee_vnd >= 0)` | Input/output API feeVnd là chuỗi số nguyên canonical 0..9223372036854775807. |
| `status` | `status` | `varchar(8) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### registration_period

Singleton numeric id=1; BQL mở/đóng, không tạo nhiều kỳ.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1)` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `status` | `status` | `varchar(6) NOT NULL DEFAULT 'CLOSED' CHECK (status IN ('OPEN','CLOSED'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `updated_by` | `updatedBy` | `uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT` | BQL actor server mở/đóng kỳ; null chỉ lúc khởi tạo CLOSED. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### applications

SV gửi đơn PENDING cho mình; BQL duyệt hoặc từ chối; nguồn/owner bất biến.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `student_id` | `studentId` | `uuid NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT` | FK student_profiles.id; SV lấy từ principal, không cho chọn owner bằng request. |
| `preferred_room_id` | `preferredRoomId` | `uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `period_id` | `periodId` | `smallint NOT NULL DEFAULT 1 REFERENCES registration_period(id) ON DELETE RESTRICT` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `status` | `status` | `varchar(8) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `rejection_reason` | `rejectionReason` | `varchar(500)` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `reviewed_by` | `reviewedBy` | `uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT` | FK staff_accounts BQL; server lấy actor, trigger xác nhận role/khóa tại lúc ghi. |
| `reviewed_at` | `reviewedAt` | `timestamptz` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### residence_records

BQL tạo atomically khi duyệt và cập nhật bằng action nhận/hủy/trả, không PATCH trạng thái tùy ý.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `application_id` | `applicationId` | `uuid NOT NULL UNIQUE REFERENCES applications(id) ON DELETE RESTRICT` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `student_id` | `studentId` | `uuid NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT` | FK student_profiles.id; SV lấy từ principal, không cho chọn owner bằng request. |
| `room_id` | `roomId` | `uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `status` | `status` | `varchar(10) NOT NULL DEFAULT 'ALLOCATED' CHECK (status IN ('ALLOCATED','CHECKED_IN','ENDED','CANCELLED'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `allocated_by` | `allocatedBy` | `uuid NOT NULL REFERENCES staff_accounts(id) ON DELETE RESTRICT` | BQL actor server; phải bằng reviewer của đơn được duyệt. |
| `allocated_at` | `allocatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `check_in_date` | `checkInDate` | `date` | DATE ngày nghiệp vụ <= hôm nay; chỉ khi nhận phòng. |
| `checked_in_by` | `checkedInBy` | `uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT` | BQL actor server khi nhận phòng. |
| `checked_in_at` | `checkedInAt` | `timestamptz` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `check_out_date` | `checkOutDate` | `date` | DATE <= hôm nay và >=check_in_date; giữ check-in metadata cũ. |
| `checked_out_by` | `checkedOutBy` | `uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT` | BQL actor server khi trả phòng. |
| `checked_out_at` | `checkedOutAt` | `timestamptz` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `cancellation_reason` | `cancellationReason` | `varchar(500)` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `cancelled_by` | `cancelledBy` | `uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT` | BQL actor server khi hủy xếp. |
| `cancelled_at` | `cancelledAt` | `timestamptz` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### room_fee_receipts

BQL lập một phiếu/residence và xác nhận toàn bộ. amountVnd snapshot bất biến.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `id` | `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Server sinh UUID, bất biến; registration_period.id là smallint cố định 1. |
| `residence_id` | `residenceId` | `uuid NOT NULL UNIQUE REFERENCES residence_records(id) ON DELETE RESTRICT` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `amount_vnd` | `amountVnd` | `bigint NOT NULL CHECK (amount_vnd >= 0)` | API amountVnd là chuỗi; SQL trigger lấy rooms.fee_vnd lúc lập, không nhận amount từ client. |
| `status` | `status` | `varchar(6) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','PAID'))` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `created_by` | `createdBy` | `uuid NOT NULL REFERENCES staff_accounts(id) ON DELETE RESTRICT` | BQL actor server khi lập phiếu. |
| `created_at` | `createdAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field. |
| `payment_date` | `paymentDate` | `date` | DATE <= hôm nay; ngày nhận đủ tiền nhập bởi BQL. |
| `paid_by` | `paidBy` | `uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT` | BQL actor server khi xác nhận toàn bộ. |
| `paid_at` | `paidAt` | `timestamptz` | Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn. |
| `updated_at` | `updatedAt` | `timestamptz NOT NULL DEFAULT clock_timestamp()` | Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field. |

### sessions

Session store nội bộ connect-pg-simple. Không phải DTO và không được trả qua API.

| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |
|---|---|---|---|
| `sid` | Nội bộ | `varchar NOT NULL PRIMARY KEY` | Session ID nội bộ; không log hoặc đưa vào JSON. |
| `sess` | Nội bộ | `json NOT NULL` | JSON session nội bộ gồm cookie/principal/CSRF; không chứa password/hash. |
| `expire` | Nội bộ | `timestamp(6) NOT NULL` | timestamp(6) tương thích store; DB process/session timezone UTC, không phải ngày nghiệp vụ. |

## Trường suy ra và nguồn đọc

| API field | Nguồn | Phạm vi |
|---|---|---|
| allocatedPlaces | view room_availability.allocated_places | COUNT residence ALLOCATED/CHECKED_IN |
| availablePlaces | view room_availability.available_places | capacity - allocatedPlaces, không clamp để che lỗi |
| buildingCode, buildingName | JOIN buildings qua room.building_id | Room DTO; không trả danh sách người ở cho SV |
| accountType | STUDENT nếu student_accounts, STAFF nếu staff_accounts | DTO account theo contract, không là role thứ tư |
| identifier | student_profiles.student_code hoặc staff_accounts.username | Login/account metadata, không password/hash |
| totalItems,totalPages | COUNT cùng snapshot và ceil(totalItems/pageSize) | meta phân trang, không cột SQL |

Mọi nullable/default và CHECK đầy đủ xem [schema.sql](schema.sql). Các CHECK/triggers liên cột và liên bảng xem [constraints](03-constraints-and-indexes.md); dictionary không thay thế protocol transaction.

Inventory tự động: **89 cột** trong **10 bảng**. Regenerate bằng Python chuẩn `SQL/tools/build_dictionary.py`, rồi review ngữ nghĩa và thay đổi DTO.
