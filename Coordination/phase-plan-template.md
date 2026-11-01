# Mẫu kế hoạch thực hiện theo giai đoạn

Dùng cùng [quy tắc chia giai đoạn](phased-execution.md) và [mẫu task](task-template.md). Kế hoạch nằm tại `Coordination/tasks/<TASK-ID>/plan.md`; ghi đúng task được giao, không tự tạo phân công cho người khác.

```text
Task / role / owner / reviewer:
Contract revision và nguồn yêu cầu:
Phạm vi operationId đã được giao:
Đánh giá: làm trọn trong phiên / đề xuất chia giai đoạn
Căn cứ: độ phức tạp, số file, transaction, test, phụ thuộc và rủi ro ngữ cảnh
Thông tin hạn mức thực sự được cung cấp (nếu có; không tự ước lượng thành số liệu thật):
Phụ thuộc đã có / chưa có và file được phép sửa:

Giai đoạn P1:
  OperationId:
  File và output:
  Phụ thuộc:
  Test bắt buộc / điều kiện hoàn tất:
  Trạng thái:
Giai đoạn P2...: cùng cấu trúc

Đối chiếu: mỗi operation được giao có đúng giai đoạn triển khai chính; không thiếu/ngoài phạm vi
Giai đoạn hiện tại, phạm vi dự kiến của phiên này:
Điểm cần quyết định thêm (chỉ khi thực sự có):
Checkpoint: Coordination/tasks/<TASK-ID>/progress.md
Bước tiếp theo sau phiên này:
```

Mẫu thông báo: “Task này có ... operation, trong đó ... cần transaction/kiểm thử liên phần. Tôi đề xuất ... giai đoạn theo contract hiện hành để còn đủ ngữ cảnh cho code, kiểm tra và bàn giao. Phiên này ưu tiên ...; phần còn lại được ghi trong kế hoạch và checkpoint.” Không điền số liệu mà chưa kiểm tra repo.
