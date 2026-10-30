# Checklist trước khi tích hợp

- [ ] Task đã xác nhận người, role, operation, phạm vi file và revision.
- [ ] Không có route/field/enum/error/role mới ngoài contract hoặc quyết định được ghi.
- [ ] Một app Express, một pool, một auth/session store; module không mở server riêng.
- [ ] Response dùng `{ data }`, list thêm `meta`; lỗi `{ error: { code, message, details? } }`; 204 không body.
- [ ] Request strict allowlist; không nhận owner/actor/status/amount do server phải quyết định.
- [ ] Actor được đọc lại từ DB; account khóa bị chặn request kế tiếp; role không kế thừa nghiệp vụ.
- [ ] Query SV bắt buộc ownership; list/detail/filter không lộ dữ liệu hoặc tồn tại tài nguyên của SV khác.
- [ ] Schema/cột/mapping khớp SQL nguồn; không lộ password/hash/session ID hoặc SQL nội bộ.
- [ ] Transaction dùng protocol chung, đã thử retry/rollback/cạnh tranh trên PostgreSQL thật nếu liên quan.
- [ ] Gửi đơn chưa giữ chỗ; duyệt và tạo residence nguyên tử; nhận không trừ thêm; hủy/trả giải phóng đúng một lần.
- [ ] Một phiếu/residence; snapshot tiền lúc lập; đổi giá phòng không đổi phiếu; trả phòng không xóa nợ.
- [ ] Build/test phù hợp đã chạy, bằng chứng được ghi; phần chưa chạy nêu rõ.
- [ ] Thay đổi contract/schema/shared có review liên phần; người phụ trách không tự nhận đã có review độc lập.
- [ ] Không đánh dấu NFR đạt từ scaffold hoặc mock. Không có dữ liệu/mật khẩu thật trong file/log.
- [ ] Handoff chỉ rõ file/function, dependency và cách kiểm tra; Anh quyết định merge thủ công.
