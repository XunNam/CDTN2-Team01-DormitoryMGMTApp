# Thống kê tổng hợp

## QT-17

**SRS_CONFIRMED**, FR-08 SHOULD, UC-27, TC-08.1; Q-22 nhận thực hiện sau MUST. Chỉ BQL được đọc, Admin không kế thừa quyền. Không thêm doanh thu/export/biểu đồ nhiều kỳ.

| Chỉ số | Công thức chuẩn |
|---|---|
| totalRooms | COUNT rooms.status=ACTIVE |
| availablePlaces | SUM capacity-allocatedPlaces trên phòng ACTIVE |
| currentResidents | COUNT residence.status=CHECKED_IN |
| unpaidReceipts | COUNT receipt.status=UNPAID, kể cả residence đã ENDED/CANCELLED |

Tên field theo [Statistics DTO](<../API Endpoint/Shared/schemas.json>); mapper phải đúng bốn tên trên. Mọi aggregate COALESCE về0, không null. Dùng một SELECT/cùng snapshot, không JOIN ba tập đa dòng rồi COUNT làm nhân bản. Không tính ALLOCATED là người đang ở.

Given2 phòng ACTIVE mỗi phòng6,2 ALLOCATED+3 CHECKED_IN,2 UNPAID, When BQL xem, Then2 phòng,7 chỗ,3 sinh viên đang ở,2 phiếu chưa trả (`TC-08.1`). Given không có dữ liệu, Then cả4 số0. Given phiếu UNPAID của residence ENDED, Then vẫn đếm phiếu đó. Role SV/Admin gọi thống kê403, không lộ aggregate ngoài quyền.
