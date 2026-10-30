# Phiếu thu thanh toán và lịch sử

Nguồn FR-07/06, UC-24..26, SRS trang12–13/21. Phạm vi chỉ thu đủ tiền thủ công; không tích hợp thanh toán online hay hoàn tiền.

## QT-14

**SRS_CONFIRMED.** BQL lập tối đa một receipt cho mỗi residence ALLOCATED/CHECKED_IN. amountVnd lấy feeVnd phòng tại lúc lập, không lấy lúc xếp, không nhận từ client; snapshot bất biến. Phiếu mới UNPAID, kể cả giá0, không chia theo ngày.

Global lock bảo vệ đọc giá/lifecycle và INSERT; UNIQUE residence_id chặn trùng. Given giá lúc xếp A, sau đó giá B, When lập, Then amount B. When đổi giá C về sau, Then phiếu vẫn B (`TC-07.1`). Lập lần hai409 RECEIPT_ALREADY_EXISTS, residence đã ENDED/CANCELLED chưa phiếu409 INVALID_STATE; không tạo phiếu hồi tố ngoài phạm vi. Hai lập đồng thời chỉ một phiếu, không tạo khoản phải thu đôi.

## QT-15

**SRS_CONFIRMED.** BQL chỉ xác nhận khi đã nhận đủ tiền toàn bộ receipt UNPAID; chuyển PAID,lưu paymentDate<=hôm nay,paidBy,paidAt. Không nhận amountVnd hoặc paidBy tùy ý từ client. SV chỉ đọc phiếu mình, không xác nhận.

Given UNPAID và BQL đã nhận đủ, When xác nhận, Then PAID và SV thấy trạng thái (`TC-07.2`). Lặp xác nhận409 INVALID_STATE, giữ ngày/người đầu tiên. Có thể xác nhận phiếu cũ khi residence ENDED/CANCELLED vì nợ được giữ; không điều kiện residence còn mở. SQL trigger giữ snapshot/metadata; guard API role/ownership vẫn bắt buộc. Không thêm trạng thái trả một phần/void/refunded.

## QT-16

**SRS_CONFIRMED.** Trả phòng/hủy xếp/khóa tài khoản không xóa residence,application,receipt hoặc tự xóa nợ. UNPAID còn được BQL theo dõi và SV sở hữu đọc. History DELETE trigger và FK RESTRICT hỗ trợ; không cascade xóa hay gọi DELETE từ API.

Given CHECKED_IN+UNPAID, When trả phòng, Then ENDED+UNPAID và vẫn xác nhận được khi nhận đủ (`TC-06.3`, `TC-07.2`). Given ALLOCATED+UNPAID, When hủy, Then CANCELLED+UNPAID; không tự hoàn/void/xóa. Liên kết owner/room/source và snapshot amount không đổi. Truy vấn list/chi tiết phiếu không lọc bỏ residence kết thúc; quyền riêng tư của SV vẫn áp dụng với dữ liệu lịch sử.
