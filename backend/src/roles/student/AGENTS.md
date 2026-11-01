# Hướng dẫn code role SV

Đọc [AGENTS gốc](../../../../AGENTS.md), [backend AGENTS](../../../AGENTS.md) và [contract role](../../../../API%20Endpoint/Student/API-Contract.md). Chỉ sửa repo; AI không tự commit/push/merge.

Nếu chưa rõ người giao đang làm role nào, hỏi họ role SV/BQL/ADMIN và operation/task trước khi code. Chỉ sửa folder này nếu task đã xác nhận role **SV** và operation tương ứng; không suy role từ việc đang mở folder. Nếu task vượt sang role khác/Shared/SQL, ghi dependency và hỏi phạm vi, không tự sửa.

- router.ts nối route tương đối dưới prefix role đã mount tại app.ts; validation.ts parse strict; controller.ts trả envelope chuẩn; service.ts chứa nghiệp vụ; repository.ts chứa SQL tham số hóa và mapper DTO. Thêm function đúng operationId vào IMPLEMENTATION SLOT, không tạo app/listen/pool mới.
- Role namespace chỉ mở cho SV; không lấy role hoặc ownership do client tự khai. Hành động ghi dùng transaction chung với actor được đọc lại sau lock.
- Response và error giữ đúng Shared; không trả entity DB trực tiếp, không password/hash/token. Quy tắc ownership SV và quyền BQL/ADMIN giữ theo contract, không role kế thừa.
- Không thay schema/auth/error enum/transaction hoặc folder role khác nếu chưa được giao task liên phần. Test tại backend/tests/student/<operationId>.test.ts; kiểm thử input, quyền, khóa, ownership, retry và đồng thời theo operation.
- Kết thúc bằng handoff file/function, kiểm chứng thực tế, dependency và điều chưa chạy; người dùng tự push branch/PR, Anh tự review và merge.

## Khối lượng và giai đoạn thực hiện

Trước code, thực hiện [đánh giá và chia giai đoạn](../../../../Coordination/phased-execution.md). Nếu task vượt khả năng làm và kiểm tra trọn trong phiên, báo người giao, đề xuất nhóm operation theo contract/phụ thuộc đã có; ghi kế hoạch, checkpoint và bước tiếp tục. Không đổi quyền hoặc bỏ kiểm thử để làm nhanh. Hoàn thành giai đoạn phải phân biệt với hoàn thành toàn task/role. Task nhỏ được làm trọn; không tự yêu cầu duyệt lại từng bước đã được giao.

## Kiểm thử khi máy thành viên không có PostgreSQL

Theo [phân công kiểm thử](../../../../Coordination/testing-responsibilities.md), thành viên chỉ cần Node.js 24/npm 11 để triển khai, viết test và chạy build/unit. Không yêu cầu cài PostgreSQL hoặc dừng role vì thiếu database. Vẫn viết test DB/tích hợp tại backend/tests/integration/<role>/ và bàn giao fixture, lệnh, expected result; ghi NOT_RUN_PENDING_OWNER để Bùi Thế Anh chạy trên máy Anh. READY_FOR_OWNER không đồng nghĩa DONE; test cạnh tranh/database thật vẫn bắt buộc trước nghiệm thu tương ứng.
