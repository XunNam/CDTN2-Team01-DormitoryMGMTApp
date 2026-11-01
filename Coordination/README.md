# Hướng dẫn cho thành viên và AI tham gia

Revision: **1.0.0 — READY_FOR_IMPLEMENTATION** cho đặc tả. Backend hiện là khung dùng chung; trạng thái hoàn thành tính năng phải được ghi theo task và kiểm thử thực tế.

## Bắt đầu một phiên làm việc

1. Đọc [AGENTS gốc](../AGENTS.md), README gốc, quyết định mới và [danh mục API](../API%20Endpoint/README.md).
2. Xem trạng thái working tree; không ghi đè phần người khác đang sửa. Người dùng tự bảo đảm đang ở branch phù hợp.
3. Hỏi role nếu chưa có: “Bạn đang được giao role Sinh viên (SV), Ban quản lý (BQL) hay Quản trị viên (ADMIN), và các operation/task nào?”
4. Khi người dùng trả lời, đối chiếu role với folder contract tương ứng. Nếu task mâu thuẫn role, hỏi lại; không đổi quyền API theo role người code.
5. Hoàn tất [mẫu task](task-template.md): operationId, người phụ trách, file được sửa, đầu ra, dependency, người review, FR/QT/AC/TC và revision.
6. Đánh giá khối lượng theo [quy tắc chia giai đoạn](phased-execution.md); báo kế hoạch và tạo checkpoint nếu cần thực hiện nhiều phiên.
7. Đọc mọi AGENTS áp dụng cho file đích, DTO/lỗi/auth dùng chung và phần SQL/quy tắc liên quan trước khi code.

Thông tin role chưa rõ chỉ chặn code nghiệp vụ. AI vẫn có thể đọc tài liệu, xác định dependency và liệt kê câu hỏi, nhưng không tạo implementation tự chọn.

## Nơi tìm chỉ dẫn

| Việc cần làm | Tài liệu |
|---|---|
| Xác nhận người đang giữ task | [Bảng nhận việc](task-board.md) |
| Xác định API được giao | [Danh mục API](../API%20Endpoint/README.md) và contract của role |
| Tìm file code và giới hạn sửa | [Bản đồ code](code-ownership.md) và [backend README](../backend/README.md) |
| Đánh giá làm trọn hay chia nhiều phiên | [Quy tắc giai đoạn](phased-execution.md), [mẫu kế hoạch](phase-plan-template.md), [checkpoint](progress-template.md) |
| Thực hiện một operation đúng tầng | [Quy trình triển khai](implementation-workflow.md) |
| Tạo task có thể giao cho AI | [Mẫu task](task-template.md) |
| Bàn giao để Anh review | [Mẫu bàn giao](handoff-template.md) |
| Checklist trước tích hợp | [Kiểm tra bàn giao](review-checklist.md) |

## GitHub và tích hợp

Thành viên tự tạo branch cho task, commit và push branch của mình, mở Pull Request tới branch nhóm đang dùng. Không đoán tên default branch. Bùi Thế Anh review, kiểm tra và tự merge. AI chỉ sửa file, kiểm thử và cung cấp nội dung bàn giao; không tự thực hiện các lệnh ghi Git theo AGENTS gốc. Push không có nghĩa đã hoàn thành hoặc đã tích hợp.

Một PR nên chứa một nhóm operation có thể kiểm chứng, kèm contract/SQL/test bị ảnh hưởng. Không dùng PR chỉ sửa contract để hợp thức hóa code trái SRS. Khi đổi request/response, enum, schema hoặc quyền: ghi đề xuất, đánh giá consumer, cập nhật quyết định và đồng bộ trước khi nhận triển khai.

## Trình tự giao việc

1. Nền dùng chung và schema được review; có DB test sạch và dữ liệu giả.
2. Shared auth/session và account provisioning được triển khai, kiểm thử riêng trước khi mở luồng role.
3. Phòng/hồ sơ/kỳ → đăng ký/duyệt/lưu trú → phiếu thu → thống kê SHOULD.
4. Từng role owner triển khai task theo contract, gửi handoff và PR cho Anh.
5. Anh kiểm tra luồng liên phần sau khi tích hợp. Không đánh dấu NFR đạt từ các test scaffold.

Không gán mặc định một trong ba bạn vào một role hay gói công việc. Anh và thành viên phải xác nhận task thực tế.
