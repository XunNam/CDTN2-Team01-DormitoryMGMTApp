# Chỉ dẫn Agent phụ trách Sinh viên

Áp dụng cùng [AGENTS gốc](../../AGENTS.md) và [AGENTS API](../AGENTS.md). Role nghiệp vụ trong thư mục này là `SV`; role không đồng nghĩa quyền truy cập GitHub của người viết code.

## Nhận việc

1. Đọc hướng dẫn gốc, README API, Shared và toàn bộ contract của role trước khi sửa code.
2. Nếu người giao việc chưa nói rõ role, hỏi chính người đang làm việc với Agent: **“Bạn đang phụ trách API của Sinh viên, Ban quản lý hay Quản trị viên? Bạn được giao operation hoặc task nào?”** Chờ câu trả lời trước khi chọn phần code nghiệp vụ. Không tự gán theo tên người, tên máy hoặc branch.
3. Nếu đã biết role SV nhưng chưa có task cụ thể, hỏi operation/phạm vi được giao; không tự làm toàn bộ role. Đọc và rà tài liệu là công việc có thể làm trong lúc chờ.
4. Ghi task, revision contract, người phụ trách, người review và file được sửa. Đọc `git status` trước khi làm; giữ nguyên thay đổi của người khác.

## Ranh giới code

- Nơi triển khai role: `backend/src/roles/student/`. Tuân thủ chính xác bảng ánh xạ code trong contract và tài liệu cấu trúc backend.
- Router chỉ khai báo method/path và chuỗi middleware. Controller nhận dữ liệu đã validate, gọi service và serialize response. Service xử lý nghiệp vụ/transaction; repository chứa SQL có tham số. Validation chỉ chấp nhận allowlist.
- Mỗi operation có một nơi định nghĩa chính thức; không tạo một server, DB pool, session store hoặc cơ chế login riêng cho SV.
- Không sửa role BQL/Admin, Shared, schema, dependency hoặc app entrypoint khi task chưa giao. Nếu cần phụ thuộc mới, ghi yêu cầu và tác động cho điều phối viên, không chép logic của role khác sang SV.
- Code hoàn tất phải nằm trong module và test được quy định, được router hiện có tham chiếu; không để mã bàn giao chỉ trong chat, file `final.ts`, tệp đính kèm hoặc thư mục cá nhân.

## Điều bắt buộc

- `studentId` lấy từ phiên đã xác thực. Truy vấn list/detail đều lọc ownership ngay trên server. Tài nguyên của SV khác trả 404 theo chuẩn chung.
- SV chỉ sửa điện thoại/email; không nhận `role`, `gender`, `studentId`, `isLocked`, số tiền, trạng thái hoặc ngày nghiệp vụ từ trường ngoài allowlist.
- SV không tự cấp tài khoản, hủy đơn, duyệt đơn, xếp/nhận/trả phòng hoặc xác nhận thu tiền.
- Mọi protected request kiểm tra phiên, role, khóa. UI ẩn nút không thay kiểm tra API.
- Dùng envelope, DTO, enum, tiền dạng chuỗi VND, ngày giờ và mã lỗi tại Shared; không trả nguyên hàng DB hoặc hash/mật khẩu.
- Gửi đơn chưa giữ chỗ; mọi mutation theo protocol transaction chung. Không tự chọn lock/retry khác module còn lại.

## Kiểm chứng và bàn giao

Chạy kiểm tra theo backend README và các test của operation: thành công, input sai, thiếu phiên, tài khoản khóa, sai role, ownership, dữ liệu rỗng và gửi đơn đồng thời. Dùng PostgreSQL test riêng với dữ liệu giả. Không báo API hoạt động khi mới có tài liệu hoặc mock.

Bàn giao danh sách operation/file, thay đổi contract/schema nếu có, lệnh kiểm tra và kết quả thực tế, phần chưa kiểm chứng, phụ thuộc cần điều phối. Không tự commit, push, merge hoặc triển khai; người cộng tác thực hiện Git sau khi kiểm tra theo quy định gốc.
