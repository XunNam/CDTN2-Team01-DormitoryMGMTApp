# Hướng dẫn code role ADMIN

Đọc [AGENTS gốc](../../../../AGENTS.md), [backend AGENTS](../../../AGENTS.md) và [contract role](../../../../API%20Endpoint/System%20Admin/API-Contract.md). Chỉ sửa repo; AI không tự commit/push/merge.

Nếu chưa rõ người giao đang làm role nào, hỏi họ role SV/BQL/ADMIN và operation/task trước khi code. Chỉ sửa folder này nếu task đã xác nhận role **ADMIN** và operation tương ứng; không suy role từ việc đang mở folder. Nếu task vượt sang role khác/Shared/SQL, ghi dependency và hỏi phạm vi, không tự sửa.

- router.ts nối route tương đối dưới prefix role đã mount tại app.ts; validation.ts parse strict; controller.ts trả envelope chuẩn; service.ts chứa nghiệp vụ; repository.ts chứa SQL tham số hóa và mapper DTO. Thêm function đúng operationId vào IMPLEMENTATION SLOT, không tạo app/listen/pool mới.
- Role namespace chỉ mở cho ADMIN; không lấy role hoặc ownership do client tự khai. Hành động ghi dùng transaction chung với actor được đọc lại sau lock.
- Response và error giữ đúng Shared; không trả entity DB trực tiếp, không password/hash/token. Quy tắc ownership SV và quyền BQL/ADMIN giữ theo contract, không role kế thừa.
- Không thay schema/auth/error enum/transaction hoặc folder role khác nếu chưa được giao task liên phần. Test tại backend/tests/admin/<operationId>.test.ts; kiểm thử input, quyền, khóa, ownership, retry và đồng thời theo operation.
- Kết thúc bằng handoff file/function, kiểm chứng thực tế, dependency và điều chưa chạy; người dùng tự push branch/PR, Anh tự review và merge.
