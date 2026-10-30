# Hướng dẫn Agent thực hiện nghiệp vụ

Đọc [AGENTS gốc](../AGENTS.md), [mục lục](README.md), SRS/decision và contract của role đã được giao. Nếu chưa biết role hoặc operation, hỏi người giao việc: **“Bạn đang phụ trách SV, BQL hay ADMIN và API/task nào?”** Chỉ đọc và rà soát phần chung trong lúc chờ, không tự nhận role/phần việc.

- Giữ một định nghĩa cho mỗi QT-01..QT-17 ở file sở hữu dưới đây; không tạo quy tắc riêng theo role.
- Code đặt theo [hướng dẫn backend](../backend/README.md) và contract; không đặt code triển khai trong thư mục tài liệu này hoặc sửa trực tiếp file của người khác ngoài task.
- Enum/DTO/lỗi theo Shared, dữ liệu theo SQL, transaction theo [protocol](../SQL/04-transactions-and-locking.md). Không đổi field hoặc trạng thái để dễ code.
- Khi SRS và xác nhận mới khác nhau, dùng Q-25..27/decision hiện hành; không áp plaintext, DB-only hoặc profile tự có account.
- Không tự thêm quyền, tự hủy đơn, chuyển phòng, thanh toán online/phân kỳ/hoàn tiền hoặc hard-delete lịch sử.
- Mọi thay đổi nghiệp vụ cần nguồn quyết định và danh sách API/SQL/UI/test bị ảnh hưởng. Chưa được giao đổi nghiệp vụ thì báo vấn đề cho người giao việc, không tự sửa contract để khớp code sai.
- Bàn giao test theo Given/When/Then, bằng chứng chạy và việc chưa kiểm chứng. Người khác rà soát quyền, đồng thời, sức chứa, tiền và migration trước tích hợp; không tự commit/push/merge.
