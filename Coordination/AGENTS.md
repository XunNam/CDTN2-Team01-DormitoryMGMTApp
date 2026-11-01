# Hướng dẫn điều phối và bàn giao

Tuân thủ [AGENTS gốc](../AGENTS.md). Chỉ sửa trong bản clone repository hiện tại; AI không tự commit, push, merge, tạo tag hoặc triển khai.

- Đây là hướng dẫn thực hiện theo bộ đặc tả `1.0.0`, không phải bằng chứng các API nghiệp vụ đã được triển khai.
- Trước khi code, xác nhận role người giao việc đang phụ trách và danh sách operation được giao. Nếu chưa rõ, hỏi chính người đang dùng AI: **“Bạn đang được giao role Sinh viên (SV), Ban quản lý (BQL) hay Quản trị viên (ADMIN), và các operation/task nào?”** Chờ câu trả lời trước khi sửa code nghiệp vụ. Không suy role từ tên người, vị trí thư mục đang mở hoặc AI dùng trước đó.
- Không tự gán một thành viên vào role. Role nghiệp vụ và danh tính thành viên là hai thông tin khác nhau. Một người có thể nhận nhiều task khi được giao rõ.
- Nếu đã rõ role nhưng chưa rõ phạm vi, đọc [danh mục contract](../API%20Endpoint/README.md) và hỏi người giao chọn operation/task; không tự làm toàn bộ role.
- Sửa nhiệm vụ, quyền sở hữu, dependency hoặc trạng thái hoàn thành phải có căn cứ trong task/handoff; không đổi `DONE` chỉ vì tồn tại file hoặc AI đã trả lời xong.
- Phần nền dùng chung, auth, SQL, DTO và transaction protocol do Bùi Thế Anh điều phối. Người đang làm một role phải đề xuất thay đổi qua task, không tự sửa shared để né dependency.
- Tài liệu nhận việc, triển khai và bàn giao ở [README](README.md), [mẫu task](task-template.md), [bản đồ code](code-ownership.md), [quy trình](implementation-workflow.md), [mẫu bàn giao](handoff-template.md).

## Khối lượng và giai đoạn thực hiện

Trước code, thực hiện [đánh giá và chia giai đoạn](phased-execution.md). Nếu task vượt khả năng làm và kiểm tra trọn trong phiên, báo người giao, đề xuất nhóm operation theo contract/phụ thuộc đã có; ghi kế hoạch, checkpoint và bước tiếp tục. Không đổi quyền hoặc bỏ kiểm thử để làm nhanh. Hoàn thành giai đoạn phải phân biệt với hoàn thành toàn task/role. Task nhỏ được làm trọn; không tự yêu cầu duyệt lại từng bước đã được giao.

## Kiểm thử khi máy thành viên không có PostgreSQL

Theo [phân công kiểm thử](testing-responsibilities.md), thành viên chỉ cần Node.js 24/npm 11 để triển khai, viết test và chạy build/unit. Không yêu cầu cài PostgreSQL hoặc dừng role vì thiếu database. Vẫn viết test DB/tích hợp tại backend/tests/integration/<role>/ và bàn giao fixture, lệnh, expected result; ghi NOT_RUN_PENDING_OWNER để Bùi Thế Anh chạy trên máy Anh. READY_FOR_OWNER không đồng nghĩa DONE; test cạnh tranh/database thật vẫn bắt buộc trước nghiệm thu tương ứng.
