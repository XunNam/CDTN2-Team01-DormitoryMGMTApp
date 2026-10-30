# Xét duyệt và xếp phòng

Nguồn FR-05, UC-17..19, SRS trang11/21. UC-19 là kiểm tra nội bộ của action duyệt, không endpoint công khai riêng.

## QT-09

**SRS_CONFIRMED.** BQL chỉ duyệt/từ chối đơn PENDING. Từ chối cần rejectionReason sau trim dài1..500, chuyển REJECTED, lưu reviewer/time; không tạo residence/chỗ. Actor/time server lấy từ phiên đã kiểm lại sau global lock.

Đơn đã xử lý trả409 INVALID_STATE; lý do thiếu/rỗng422 VALIDATION_ERROR. Given PENDING, When BQL từ chối có lý do, Then SV chủ đơn thấy REJECTED+reason và count chỗ không đổi (`TC-05.3`). Hai người duyệt/từ chối cùng đơn: người thứ hai đọc status mới,409, không ghi kết quả khác. `guard_application` và deferred pair bảo vệ không có residence trên đơn REJECTED.

## QT-10

**SRS_CONFIRMED.** Duyệt chỉ thành công nếu đơn PENDING, phòng được chọn ACTIVE,còn chỗ,gender tương thích, sinh viên chưa có residence mở. Có thể chọn roomId khác preferredRoomId. Khi thành công phải cùng transaction: application APPROVED và một residence ALLOCATED liên kết đúng studentId/applicationId/allocatedBy.

Check theo thứ tự bảo vệ thông tin tại contract: auth/role/input/resource trước lỗi nghiệp vụ; rồi status, residence mở, phòng ACTIVE,gender,capacity. Xung đột tương ứng409 INVALID_STATE/ACTIVE_RESIDENCE_EXISTS/ROOM_INACTIVE/GENDER_MISMATCH/ROOM_FULL. Không chia action duyệt và tạo residence thành hai HTTP requests.

Given đủ điều kiện, When duyệt, Then1 residence và availablePlaces giảm1 (`TC-05.1`). Given chỗ cuối bị người khác lấy, When giao dịch sau vào lock, Then ROOM_FULL, đơn vẫn PENDING, không residence dở (`TC-05.2`). Deferred constraint lỗi ở COMMIT phải rollback toàn bộ trước trả success. Sửa gender/profile/capacity/period hay receipt không được bỏ cùng protocol global lock.
