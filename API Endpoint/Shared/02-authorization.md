# Ma trận quyền và phạm vi dữ liệu

| Namespace | SV | BQL | ADMIN |
|---|---|---|---|
| /auth/csrf và /auth/login | Có, theo luồng auth | Có | Có |
| /auth/me, /auth/change-password, /auth/logout | Tài khoản mình | Tài khoản mình | Tài khoản mình |
| /student/* | Chỉ dữ liệu mình và danh mục công khai trong role | Không | Không |
| /management/* | Không | Có | Không |
| /admin/* | Không | Không | Có |

Không role kế thừa. Shared guard đọc account thực theo `(actorKind, accountId)` ở mỗi request bảo vệ, kiểm tra `is_locked`, `session_version` và role. Session không lưu role để dùng thay dữ liệu hiện tại; role không hợp lệ bị từ chối. SV suy ra studentId từ student_accounts.student_id; client không chọn chủ thể.

GET detail SV dùng truy vấn `WHERE id=$id AND student_id=$actorStudentId`; phiếu join residence_records để kiểm chủ. Không tìm bản ghi người khác rồi trả403 riêng; trả404 NOT_FOUND. List luôn lọc ownership cả count, kể cả filter/search. Request không mở quyền qua thuộc tính lạ.

ADMIN xem account metadata và candidates gồm id/mã/tên/hasAccount=false để cấp login. Không trả toàn bộ hồ sơ, liên hệ, lưu trú hay phiếu thu. BQL xem/sửa hồ sơ nghiệp vụ nhưng không cấp/khóa/mở tài khoản. SV chỉ sửa phone/email trong profile.

Mọi request đã được nhận trước lúc khóa có thể hoàn tất; request tiếp theo bị401. Mutation sau khi chờ write lock phải đọc lại account và sessionVersion. Khóa/mở và đổi mật khẩu không xóa lịch sử, không thay trạng thái đơn/lưu trú/phiếu.
