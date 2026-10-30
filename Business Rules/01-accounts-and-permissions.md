# Tài khoản và quyền

Nguồn: SRS FR-01/02, UC-01..UC-10, QT-01..03 trang20; Q-25/26/27 thay plaintext, DB-only và bỏ guard. Đọc [Shared auth](<../API Endpoint/Shared/01-authentication.md>) và [SQL](../SQL/01-data-dictionary.md).

## QT-01

**SRS_CONFIRMED.** Admin cấp tài khoản và gán đúng một role SV/BQL/ADMIN. Sinh viên không tự đăng ký; BQL không cấp tài khoản; Admin không duyệt/xếp/thu tiền. UC-06 nằm trong cấp tài khoản, không có API đổi role sau cấp.

Server xác thực đúng kho bằng accountType STUDENT/STAFF; không tin role gửi từ client. Guard đọc account, isLocked, sessionVersion và role mỗi request. Role sai403 FORBIDDEN; thiếu/phiên cũ401; ownership SV không khớp404 NOT_FOUND. Mật khẩu Argon2id, không response/log plaintext/hash.

Ví dụ hợp lệ: Admin cấp account SV cho profile có trước; SV đăng nhập rồi xem hồ sơ mình. Không hợp lệ: Admin gọi duyệt đơn, dù có quyền cấp tài khoản BQL. Given Admin đã đăng nhập, When gọi action duyệt, Then403 và đơn/residence không đổi (`TC-01.1`, `TC-N1`). SQL `guard_account` giữ role bất biến; kiểm role API không thể thay bằng CHECK SQL.

## QT-02

**SRS_CONFIRMED**, Q-26 giữ đầy đủ chức năng. BQL tạo profile trước, Admin cấp student_accounts tham chiếu studentId sau; UNIQUE student_id ngăn cấp lần hai. Profile tồn tại chưa tự được đăng nhập. Khóa chỉ đổi isLocked, không xóa profile/đơn/lưu trú/phiếu.

Admin được tự khóa theo Q-17; không last-admin guard. Request bảo vệ tiếp theo sau khóa phải401 ACCOUNT_LOCKED, không cần đẩy logout realtime. Mở khóa cho đăng nhập lại; không thay lịch sử. Mọi account mutation dùng global lock rồi đọc lại actor; request đã bắt đầu hợp lệ không cần bị hủy ngược.

Given profile chưa có account, When Admin cấp hai lần, Then lần đầu thành công và lần sau409 ACCOUNT_ALREADY_EXISTS (`TC-01.1`). Given đã có phiếu/lịch sử, When khóa rồi mở, Then login bị chặn khi khóa và dữ liệu giữ nguyên (`TC-01.2`). DB đảm bảo FK/UNIQUE; API xác minh Admin, namespace và input. Actor/time server; không đổi role để giả lập khóa.

## QT-03

**SRS_CONFIRMED.** studentCode duy nhất, trim/uppercase, bất biến sau tạo. SV chỉ xem profile của mình và PATCH phone/email; field còn lại gồm gender/dateOfBirth/permanentAddress do BQL quản lý. Unknown/cấm field422 VALIDATION_ERROR; không bỏ qua field lạ một cách im lặng.

Hồ sơ do BQL tạo có fullName,gender,className,faculty; phone/email/dateOfBirth/address nullable theo dictionary. Cập nhật giới tính không được làm residence đang ALLOCATED/CHECKED_IN sai giới tính phòng. Đơn PENDING giữ nguyên, kiểm lại lúc duyệt. Service lấy studentId từ principal, không từ request của SV.

Given SV A, When sửa email riêng, Then email đổi và các trường khác giữ (`TC-02.2`). When đọc ID của B hoặc gửi gender trong contact request, Then404 hoặc422 tương ứng, không lộ dữ liệu B. Tạo trùng studentCode409 DUPLICATE_STUDENT_CODE (`TC-02.1`). Sửa gender gây conflict trả409 GENDER_MISMATCH. SQL guard_profile + unique + global lock hỗ trợ invariant, không thay quyền field tại API.
