# Checklist trước khi tích hợp

- [ ] Task đã xác nhận người, role, operation, phạm vi file và revision.
- [ ] Không có route/field/enum/error/role mới ngoài contract hoặc quyết định được ghi.
- [ ] Một app Express, một pool, một auth/session store; module không mở server riêng.
- [ ] Response dùng `{ data }`, list thêm `meta`; lỗi `{ error: { code, message, details? } }`; 204 không body.
- [ ] Request strict allowlist; không nhận owner/actor/status/amount do server phải quyết định.
- [ ] Actor được đọc lại từ DB; account khóa bị chặn request kế tiếp; role không kế thừa nghiệp vụ.
- [ ] Query SV bắt buộc ownership; list/detail/filter không lộ dữ liệu hoặc tồn tại tài nguyên của SV khác.
- [ ] Schema/cột/mapping khớp SQL nguồn; không lộ password/hash/session ID hoặc SQL nội bộ.
- [ ] Thành viên: transaction đúng protocol, đã viết test/fixture retry/rollback/cạnh tranh liên quan; ghi NOT_RUN_PENDING_OWNER cho test PostgreSQL chưa chạy.
- [ ] Anh trước merge: đã chạy các test PostgreSQL/tích hợp liên quan và xử lý lỗi; unit pass không thay kiểm chứng này.
- [ ] Gửi đơn chưa giữ chỗ; duyệt và tạo residence nguyên tử; nhận không trừ thêm; hủy/trả giải phóng đúng một lần.
- [ ] Một phiếu/residence; snapshot tiền lúc lập; đổi giá phòng không đổi phiếu; trả phòng không xóa nợ.
- [ ] Build/test phù hợp đã chạy, bằng chứng được ghi; phần chưa chạy nêu rõ.
- [ ] Thay đổi contract/schema/shared có review liên phần; người phụ trách không tự nhận đã có review độc lập.
- [ ] Không đánh dấu NFR đạt từ scaffold hoặc mock. Không có dữ liệu/mật khẩu thật trong file/log.
- [ ] Handoff chỉ rõ file/function, dependency và cách kiểm tra; Anh quyết định merge thủ công.

## Bàn giao theo giai đoạn

- Có đánh giá khối lượng; nếu chia giai đoạn thì phủ đúng operation của task, đúng phụ thuộc và không giảm tiêu chí kiểm thử.
- Kế hoạch/checkpoint nêu file, hàm, kiểm chứng thực tế và bước tiếp theo; kiểm tra trạng thái code thay vì chỉ tin tóm tắt.
- Phần xong/chưa làm/chưa kiểm chứng được tách rõ; không đánh dấu toàn role DONE khi mới xong một giai đoạn.
