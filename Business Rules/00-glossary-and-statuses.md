# Thuật ngữ và trạng thái

Revision1.0.0. Hồ sơ sinh viên là dữ liệu cá nhân; account là quyền đăng nhập được Admin cấp sau. Có profile chưa có account là hợp lệ. `actorKind STUDENT/STAFF` chỉ chọn kho identity, không tạo role thứ tư. Role `SV/BQL/ADMIN` bất biến sau cấp; Admin không kế thừa quyền BQL.

## Số chỗ

`allocatedPlaces = COUNT(residence.status IN ('ALLOCATED','CHECKED_IN'))` theo phòng. `availablePlaces = capacity - allocatedPlaces`. Hồ sơ “chưa kết thúc/mở” là cả hai trạng thái trên; `ENDED/CANCELLED` không chiếm chỗ. Không lưu availablePlaces làm cột/counter. Gửi đơn chỉ nguyện vọng; phòng thực tế do duyệt xác định và có thể khác nguyện vọng.

## State machine chuẩn

| Đối tượng | Trạng thái đầu | Chuyển hợp lệ | Actor |
|---|---|---|---|
| Đơn | PENDING | PENDING→APPROVED hoặc REJECTED | BQL |
| Lưu trú | ALLOCATED | ALLOCATED→CHECKED_IN→ENDED; ALLOCATED→CANCELLED | BQL |
| Phiếu thu | UNPAID | UNPAID→PAID | BQL |
| Tài khoản | isLocked=false | false↔true | ADMIN |
| Phòng | ACTIVE mặc định | ACTIVE↔INACTIVE khi không còn residence mở lúc ngừng | BQL |
| Kỳ singleton | CLOSED | CLOSED↔OPEN | BQL |

Không PATCH trạng thái tùy ý. Lặp action đã hoàn thành trả409 `INVALID_STATE`; logout lặp204. Không tái kích hoạt residence đã kết thúc, đổi đơn đã duyệt thành bị từ chối hoặc tạo trạng thái hủy đơn. Gửi lại khi đủ điều kiện tạo bản ghi mới.

## Tiền và ngày

Phí phòng theo kỳ/người, VND nguyên đồng. JSON dùng chuỗi số canonical; SQL BIGINT không âm. `amountVnd` phiếu lấy giá phòng tại lúc **lập phiếu**, không lúc xếp phòng; phí0 vẫn UNPAID đến khi BQL xác nhận hợp lệ. Không chia theo ngày, trả nhiều đợt, hoàn tiền hoặc tự xóa nợ.

`checkInDate/checkOutDate/paymentDate` là ngày nghiệp vụ YYYY-MM-DD tại Việt Nam. BQL có thể nhập quá khứ/hôm nay, không tương lai; checkOutDate>=checkInDate. Actor/timestamp thao tác do server sinh UTC độc lập với ngày nhập lùi; không có API sửa lịch sử.
