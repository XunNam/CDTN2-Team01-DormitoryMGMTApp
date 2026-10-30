# Chỉ dẫn Agent phụ trách Ban quản lý

Áp dụng cùng [AGENTS gốc](../../AGENTS.md) và [AGENTS API](../AGENTS.md). Thư mục này sở hữu contract role `BQL`.

## Nhận việc

Nếu chưa xác định role, hỏi người đang làm việc với Agent: **“Bạn đang phụ trách API của Sinh viên, Ban quản lý hay Quản trị viên? Bạn được giao operation hoặc task nào?”** Chờ trả lời trước khi chọn nghiệp vụ. Khi chỉ biết BQL mà chưa rõ task, hỏi phạm vi operation được giao; không tự nhận toàn bộ role hoặc gán việc theo tên thành viên.

Đọc README API, Shared, contract BQL, schema và Business Rules trước khi code. Ghi revision contract, task, owner, reviewer, file được sửa và phụ thuộc; kiểm tra `git status` để tránh ghi đè công việc khác.

## Vị trí và cách viết code

- Role module đặt tại `backend/src/roles/management/`; tên hàm và file cho từng operation theo contract và cấu trúc backend đã chốt.
- Router khai báo HTTP/middleware; controller chuyển input đã validate vào service và trả DTO; service sở hữu kiểm tra nghiệp vụ và transaction; repository chỉ SQL có tham số; validation chặn thuộc tính lạ.
- Dùng DB pool, auth/session, error mapper và serializer dùng chung. Không dựng Express app riêng, schema riêng hoặc tạo bản sao chuẩn trả dữ liệu.
- Không sửa `backend/src/roles/student/`, `admin/`, Shared, app entrypoint, dependency hoặc schema ngoài task được giao. Đề xuất thay đổi liên phần cho điều phối viên trước khi áp dụng.
- Mã hoàn tất được đặt trực tiếp vào module/test đúng operation và nối vào router theo slot đã định; không giao bằng file cá nhân hoặc chỉ chép code vào chat.

## Ràng buộc nghiệp vụ

- BQL không cấp/khóa tài khoản hoặc gán role. Hồ sơ sinh viên được tạo trước tài khoản, không tự sinh login.
- Chỗ đã phân bổ = số residence `ALLOCATED` + `CHECKED_IN`; không tự lưu bộ đếm rời hoặc trừ chỗ khi gửi đơn.
- Duyệt đơn và tạo residence là một transaction nguyên tử. Áp cùng lock protocol với gửi đơn, sửa giới tính/sức chứa/phòng, nhận/hủy/trả và lập phiếu.
- Nhận phòng không trừ thêm chỗ; hủy hoặc trả giải phóng đúng một lần. Trả phòng không bị chặn vì còn phiếu chưa thanh toán.
- Một residence chỉ có một phiếu. Số tiền snapshot từ giá phòng lúc lập; không lấy số tiền tùy ý từ request, không tính lại sau đổi giá.
- Chỉ mutation theo hành động đã có contract; không PATCH trạng thái tùy ý, không DELETE mặc định, không thanh toán từng phần/hoàn tiền hoặc thêm job tự động.
- FR-08 có đúng bốn chỉ số; giữ SHOULD, thực hiện sau MUST.
- Danh tính người thực hiện và timestamp do server sinh. Dùng chính xác DTO/error/enum/format Shared, không trả entity DB.

## Kiểm chứng và bàn giao

Kiểm thử mỗi operation cho luồng đúng, validation, role sai, khóa, trạng thái sai và không thay đổi dữ liệu khi thất bại. Với quyền, sức chứa, lưu trú hoặc tiền phải có review chéo và test PostgreSQL thật, gồm hai request cạnh tranh chỗ cuối, duyệt/từ chối cùng đơn, lập phiếu trùng và gọi lại nhận/trả/thu tiền.

Bàn giao operation và đường dẫn code/test, contract revision, dependencies, lệnh/kết quả kiểm tra, phần chưa kiểm chứng và rủi ro tích hợp. Không tự commit/push/merge/tag hoặc triển khai.
