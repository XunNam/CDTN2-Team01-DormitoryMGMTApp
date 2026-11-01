# Mẫu checkpoint công việc

Sao chép thành `Coordination/tasks/<TASK-ID>/progress.md`. Điền bằng trạng thái thực tế, cập nhật dần theo [quy tắc chia giai đoạn](phased-execution.md). Không đặt secret/log chứa dữ liệu thật trong checkpoint.

```text
Task / role / người phụ trách:
Cập nhật lúc (ngày, giờ, múi giờ):
Contract revision / file plan:
Phạm vi được giao / file được phép sửa:
Giai đoạn hiện tại:
Trạng thái: IN_PROGRESS / WAITING_DEPENDENCY / READY_FOR_REVIEW / giai đoạn đã xong

Operation đã triển khai và trạng thái kiểm chứng từng operation:
File/hàm đã sửa; route đã nối:
Test/command đã chạy, kết quả và môi trường thực tế:
Test chưa chạy và lý do:
Phần đang làm dở, lỗi còn lại, code chưa nối:
Phụ thuộc thiếu / quyết định cần người giao việc:
Các giai đoạn/operation còn lại:
Bước tiếp tục chính xác (file, hàm, operation, test):
Những điều cần giữ nguyên khi tiếp tục:
Đề xuất prompt tiếp: Tiếp tục task... giai đoạn...; đọc checkpoint và đối chiếu diff trước sửa.
```

Khi người review xác nhận DONE cho task, vẫn giữ lịch sử bàn giao để truy vết. Agent không tự đánh dấu toàn role DONE từ việc một giai đoạn được hoàn thành.
