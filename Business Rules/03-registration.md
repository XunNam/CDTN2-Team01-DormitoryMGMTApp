# Kỳ và đăng ký lưu trú

Nguồn FR-04, UC-14..16, SRS trang10–11/20–21; Q-11/Q-12 chấp nhận một kỳ thủ công và gửi lại nếu đủ điều kiện.

## QT-06

**SRS_CONFIRMED**, Q-11 làm rõ. Có một registration_period id=1; BQL mở/đóng thủ công, có thể mở lại cùng kỳ. SV chỉ gửi đơn khi OPEN. Đóng không xóa/tự từ chối đơn cũ và vẫn cho BQL xét đơn đã gửi. Không lịch tự động hoặc nhiều kỳ.

Mở/đóng và gửi lấy cùng global lock, sau lock đọc lại status. Nếu đóng trước, gửi409 PERIOD_CLOSED; nếu gửi trước, đơn tồn tại hợp lệ rồi kỳ đóng. Mutation kỳ cùng status409 INVALID_STATE; lưu updatedBy BQL và updatedAt server.

Given CLOSED, When SV gửi, Then409 và không tạo đơn (`TC-04.2`). Given OPEN, When SV đủ điều kiện gửi, Then PENDING (`TC-04.1`). Hai thứ tự đóng/gửi cần hai client độc lập, không chứng minh bằng disable nút.

## QT-07

**SRS_CONFIRMED.** Một SV tối đa một application PENDING và không được tự hủy/sửa đơn. Khi đã có residence ALLOCATED/CHECKED_IN cũng không nhận đơn mới. Sau từ chối hoặc residence kết thúc/hủy, có thể gửi bản ghi mới nếu mọi điều kiện còn đúng; không sửa đơn cũ hay giới hạn số lần thêm.

Partial unique applications_one_pending_per_student, unique residence mở và service global lock cùng bảo vệ. Trùng đơn409 PENDING_APPLICATION_EXISTS; có residence mở409 ACTIVE_RESIDENCE_EXISTS. Ownership luôn từ principal, không chấp nhận studentId tùy ý. Given có PENDING, When gửi hai request mới, Then không xuất hiện PENDING thứ hai (`TC-04.2`). Tự hủy đơn không có route; không thêm trạng thái CANCELLED cho application.

## QT-08

**SRS_CONFIRMED.** preferredRoomId chỉ là nguyện vọng. Gửi đủ điều kiện phải phòng ACTIVE,còn chỗ,đúng gender nhưng **không giữ chỗ**. Chỉ duyệt+xếp atomically mới tạo residence ALLOCATED. Phòng sau đó hết chỗ/ngừng không tự đổi đơn PENDING; BQL chọn phòng khác phù hợp hoặc từ chối có lý do.

Given còn1 chỗ, When hai SV cùng gửi lúc đủ điều kiện, Then cả hai có thể PENDING và room vẫn1. When duyệt, một người lấy chỗ, người sau409 ROOM_FULL nếu vẫn chọn phòng đó (`TC-04.1`, `TC-05.2`). SQL application không tham gia view occupancy; không tạo reservation riêng hay giữ chỗ từ frontend.
