# Danh mục lỗi chuẩn

Revision1.0.0; envelope duy nhất tại [conventions](00-conventions.md). Message tiếng Việt, code ổn định, không thêm code từng thành viên.

| HTTP | error.code | Ý nghĩa |
|---|---|---|
| 401 | `AUTH_REQUIRED` | Thiếu phiên đăng nhập hợp lệ |
| 401 | `SESSION_EXPIRED` | Phiên quá hạn hoặc sessionVersion cũ |
| 401 | `ACCOUNT_LOCKED` | Tài khoản bị khóa |
| 401 | `INVALID_CREDENTIALS` | Sai nguồn danh tính/identifier/password; không phân biệt người dùng không tồn tại với sai password |
| 403 | `FORBIDDEN` | Vai trò không có quyền chức năng |
| 403 | `CSRF_INVALID` | Thiếu/sai token của phiên |
| 403 | `ORIGIN_FORBIDDEN` | Thiếu/sai Origin ở mutation |
| 404 | `NOT_FOUND` | Không tồn tại hoặc ngoài ownership sinh viên |
| 409 | `DUPLICATE_STUDENT_CODE` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `DUPLICATE_BUILDING_CODE` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `DUPLICATE_ROOM_CODE` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `DUPLICATE_USERNAME` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `ACCOUNT_ALREADY_EXISTS` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `PERIOD_CLOSED` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `PENDING_APPLICATION_EXISTS` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `ACTIVE_RESIDENCE_EXISTS` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `ROOM_INACTIVE` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `ROOM_FULL` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `GENDER_MISMATCH` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `CAPACITY_BELOW_OCCUPANCY` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 409 | `ROOM_OCCUPIED` | Không thể ngừng sử dụng phòng còn hồ sơ lưu trú mở |
| 409 | `INVALID_STATE` | Thao tác không hợp lệ ở trạng thái hiện tại hoặc action lặp |
| 409 | `RECEIPT_ALREADY_EXISTS` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 422 | `VALIDATION_ERROR` | Sai field/path/query/schema |
| 422 | `PASSWORD_INCORRECT` | Mật khẩu hiện tại không đúng |
| 422 | `PASSWORD_UNCHANGED` | Mật khẩu mới trùng hiện tại |
| 400 | `INVALID_JSON` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 413 | `PAYLOAD_TOO_LARGE` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Xung đột nghiệp vụ được mô tả tại operation tương ứng |
| 500 | `INTERNAL_ERROR` | Lỗi ngoài dự kiến; response không chứa chi tiết nội bộ |
| 503 | `SERVICE_UNAVAILABLE` | DB/kết nối/lock timeout tạm thời; transaction rollback |

Lỗi PASSWORD_INCORRECT/PASSWORD_UNCHANGED dùng details.field=currentPassword/newPassword. Mọi response lỗi giữ nguyên dữ liệu nếu chưa commit. Nếu client mất kết nối sau commit, dùng GET kiểm tra, không kết luận rollback từ việc không nhận response. Lỗi constraint/trigger PostgreSQL phải map từ allowlist tên constraint và ngữ cảnh operation; lỗi chưa biết500, không lộ câu SQL.
