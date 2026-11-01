# Mẫu giao task API

Sao chép nội dung dưới đây vào một file task có mã do Anh cấp; điền trước khi bắt đầu code. Không thay placeholder bằng giả định của AI.

```text
Task ID và tiêu đề:
Trạng thái: ASSIGNED / IN_PROGRESS / READY_FOR_REVIEW / CHANGES_REQUESTED / READY_FOR_OWNER / DONE
Người phụ trách thực tế:
Người review:
Role được giao: SV / BQL / ADMIN / SHARED
OperationId, method + path:
Contract revision: 1.0.0
File contract và vị trí operation:
FR, UC, QT, AC, TC:
Mục tiêu và phạm vi:
File được tạo/sửa:
File dùng chung chỉ được đọc:
Input DTO / output DTO / errorCode:
Schema bảng/cột/constraint:
Đánh giá khối lượng: làm trọn phiên / chia giai đoạn và lý do:
Kế hoạch giai đoạn, operationId, đầu ra, điều kiện hoàn tất:
Phạm vi dự kiến phiên này / checkpoint / bước tiếp tục:
Dependency và thứ tự triển khai:
Transaction/ownership/role/lock cần bảo toàn:
Test đúng/sai input, sai quyền, khóa, ownership:
Test retry/cạnh tranh/rollback khi liên quan:
Lệnh chạy và tiêu chí hoàn thành:
Điểm cần Anh quyết định hoặc điều phối:
Tác động UI/role khác/migration:
```

Mẫu prompt cho AI của thành viên:

```text
Hãy đọc AGENTS.md và README gốc, Coordination/README.md cùng các AGENTS con.
Tôi đang được giao role <SV/BQL/ADMIN>; task <mã task>, operation <danh sách>.
Đọc contract revision 1.0.0 và schema dùng chung, chỉ sửa <danh sách file>.
Nếu role hoặc task còn thiếu, hỏi lại tôi trước khi code nghiệp vụ.
Trước code, tự đánh giá khối lượng; nếu quá lớn, báo tôi và đề xuất chia giai đoạn theo contract/phụ thuộc.
Ghi kế hoạch và checkpoint để phiên sau tiếp tục đúng điểm, không làm lại phần đã xong.
Giữ method/path, tên trường, enum, quyền, envelope và transaction đã chốt.
Không tạo backend/auth/database riêng. Không tự commit, push hoặc merge.
Hoàn tất bằng handoff có file, kiểm thử thực tế, phần chưa kiểm chứng và dependency.
```
