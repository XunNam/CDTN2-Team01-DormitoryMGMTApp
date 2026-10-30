# Chỉ dẫn biên soạn và triển khai API

Đọc [AGENTS gốc](../AGENTS.md). Revision hiện hành **1.0.0**, trạng thái SPECIFIED_NOT_IMPLEMENTED. Hợp đồng HTTP ở đây là đầu vào triển khai, khác kế hoạch lịch sử ở Planning.

1. Nếu nhận việc code mà chưa biết role, hỏi chính người giao việc: “Bạn đang phụ trách role Sinh viên (SV), Ban quản lý (BQL), Quản trị viên (ADMIN), hay phần Shared được Anh giao?” Đợi câu trả lời, không đoán theo tên người hoặc tài khoản đang đăng nhập.
2. Sau role, xác định operationId/task. Role chỉ khoanh vùng được làm, không tự cấp quyền sửa toàn bộ hệ thống. Nếu task chưa rõ, hỏi API nào được giao hoặc xác nhận danh sách operation còn trống trong task board với người giao.
3. Đọc Shared, schema SQL và contract role trước code. `README.md` sở hữu danh mục method+URL+operationId; `Shared/schemas.json` sở hữu cấu trúc field, `Shared/03-data-contracts.md` giải thích semantics; không sao chép một bộ enum/DTO khác.
4. Code nằm tại `backend/src`, không đặt code chạy trong thư mục tài liệu. Mỗi operation ánh xạ layer và test ở manifest. Không tự tạo backend/database/auth riêng.
5. Đổi contract/schema/Shared cần task của điều phối và cập nhật đồng bộ consumer, tài liệu, test. Không âm thầm đổi tên trường/status cho code dễ viết hơn.
6. Không tự commit/push/merge. Sau code báo file, operation, kiểm thử đã chạy và phần chưa chạy cho người giao việc.
