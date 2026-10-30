# Phòng và sức chứa

Nguồn: FR-03/05, UC-11..13/17/19, SRS trang9–11/20. [Công thức](00-glossary-and-statuses.md) và [transaction](../SQL/04-transactions-and-locking.md) là chuẩn chung.

## QT-04

**SRS_CONFIRMED.** BQL chỉ giảm capacity khi capacity mới>=allocatedPlaces, và chỉ ngừng phòng khi không còn residence ALLOCATED/CHECKED_IN. Thay gender chỉ khi mọi residence mở vẫn tương thích; không chuyển tòa/đổi code phòng. Cả hồ sơ giữ chỗ cũng ngăn ngừng phòng, không chỉ người đã nhận.

Đọc lại count trong global lock trước UPDATE; capacity thấp hơn trả409 CAPACITY_BELOW_OCCUPANCY, ngừng phòng đang chiếm chỗ trả409 ROOM_OCCUPIED; sửa gender xung đột trả409 GENDER_MISMATCH. Trigger guard_room là bảo vệ bổ sung. Không để validation từ ảnh chụp UI cũ thay check hiện tại.

Given phòng6 chỗ đã phân bổ5, When giảm xuống5, Then hợp lệ. When giảm4 hoặc ngừng, Then lỗi và giữ capacity/status cũ (`TC-03.2`). Cạnh tranh duyệt chỗ cuối và giảm capacity dùng cùng lock, kết quả cuối không vi phạm. Input capacity ngoài1..10000 trả422, phân biệt lỗi input với conflict.

## QT-05

**SRS_CONFIRMED.** allocatedPlaces đếm ALLOCATED+CHECKED_IN; availablePlaces=capacity-count và không âm. Residence ENDED/CANCELLED không đếm. Không counter tự tăng/trừ, không clamp giá trị âm để giấu sai.

Given phòng6,2 ALLOCATED+3 CHECKED_IN, When BQL/SV đọc phòng, Then1 chỗ (`TC-03.1`). Nhận một ALLOCATED thành CHECKED_IN vẫn1; trả một CHECKED_IN thì2. Hai giao dịch duyệt cùng chỗ cuối: một thành công, giao dịch sau409 ROOM_FULL, giữ đơn sau PENDING (`TC-05.2`). View room_availability đọc cùng công thức; chỉ BQL quản lý, SV lọc đồng thời buildingId/gender/availableOnly và chỉ ACTIVE (`TC-03.3`).
