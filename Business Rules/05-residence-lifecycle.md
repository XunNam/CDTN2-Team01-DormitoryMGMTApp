# Nhận hủy xếp và trả phòng

Nguồn FR-06, UC-20..23, SRS trang12/21; giữ phiếu/lịch sử theo [QT-16](06-receipts-and-payment.md#qt-16). Ngày nghiệp vụ nhập lùi được, timestamp/actor server không sửa theo ngày nhập.

## QT-11

**SRS_CONFIRMED.** Chỉ BQL xác nhận ALLOCATED→CHECKED_IN, lưu checkInDate<=hôm nay,checkedInBy,checkedInAt. Số chỗ không giảm thêm vì cả hai trạng thái đều đã chiếm chỗ. Không có action nhận do SV hoặc API tự đổi nguồn application.

Given ALLOCATED đã chiếm1 chỗ, When nhận hợp lệ, Then CHECKED_IN và availablePlaces giữ nguyên (`TC-06.1`). Nhận lần hai hoặc sau hủy409 INVALID_STATE; ngày tương lai422 VALIDATION_ERROR. Nhận-hủy đồng thời dùng lock, chỉ một state transition thắng; người sau409 và metadata cũ giữ nguyên.

## QT-12

**SRS_CONFIRMED**, Q-16 làm rõ thủ công. BQL chỉ hủy xếp từ ALLOCATED khi không đến nhận, cần cancellationReason trim1..500; ghi cancelledBy/cancelledAt. Residence chuyển CANCELLED, không còn đếm chiếm chỗ; không xóa hoặc đổi application APPROVED.

Given ALLOCATED có phiếu UNPAID, When hủy, Then availablePlaces tăng1, phiếu và nợ giữ nguyên, SV tra được lịch sử (`TC-06.2` và test bổ sung QT16). Hủy lần hai/sau nhận409 INVALID_STATE; thiếu lý do422. Không job tự hủy theo ngày hoặc hoàn tiền. Giữ trường owner,room,allocatedAt bất biến; không dùng hủy để chuyển phòng.

## QT-13

**SRS_CONFIRMED.** Chỉ BQL trả CHECKED_IN→ENDED, checkOutDate<=hôm nay và>=checkInDate; giữ metadata nhận phòng, ghi checkedOutBy/checkedOutAt. Giải phóng đúng một chỗ bằng cách không còn trong count, không cộng counter.

Given CHECKED_IN có phiếu chưa trả, When trả hợp lệ, Then ENDED,availablePlaces tăng1,receipt UNPAID giữ nguyên (`TC-06.3`). Không thêm tiền điều kiện phải trả hết nợ. Trả lần hai409 INVALID_STATE và không tăng thêm chỗ; ngày trả trước nhận422. Hồ sơ kết thúc vẫn được đọc qua lịch sử BQL/SV sở hữu; không endpoint sửa ngày/room/owner trong quá khứ.
