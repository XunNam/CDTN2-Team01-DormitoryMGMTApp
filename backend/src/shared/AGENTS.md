# Hướng dẫn Shared backend

Tuân thủ [AGENTS gốc](../../../AGENTS.md) và [backend AGENTS](../../AGENTS.md). Chỉ sửa repo, AI không tự commit/push/merge.

Chỉ sửa Shared khi có task nền chung do Anh giao. Role task không tự sửa auth, DB, session, DTO, error hoặc transaction protocol. Code dùng chung có một owner task và người review liên phần; không nhân bản vào từng role.

Các auth operation đặt tại `auth/{router,validation,controller,service,repository}.ts`; helper guard/security có sẵn không chứng minh auth flow đã hoàn tất. Đọc contract auth và ngoại lệ logout hết phiên trước gắn middleware.

Đăng ký helper chung phải có test phù hợp trong `backend/tests/shared/`, nêu tác động ba role. Thay đổi dữ liệu/query/schema phải đồng bộ SQL và contract trước bàn giao.

## Khối lượng và giai đoạn thực hiện

Trước code, thực hiện [đánh giá và chia giai đoạn](../../../Coordination/phased-execution.md). Nếu task vượt khả năng làm và kiểm tra trọn trong phiên, báo người giao, đề xuất nhóm operation theo contract/phụ thuộc đã có; ghi kế hoạch, checkpoint và bước tiếp tục. Không đổi quyền hoặc bỏ kiểm thử để làm nhanh. Hoàn thành giai đoạn phải phân biệt với hoàn thành toàn task/role. Task nhỏ được làm trọn; không tự yêu cầu duyệt lại từng bước đã được giao.

## Kiểm thử khi máy thành viên không có PostgreSQL

Theo [phân công kiểm thử](../../../Coordination/testing-responsibilities.md), thành viên chỉ cần Node.js 24/npm 11 để triển khai, viết test và chạy build/unit. Không yêu cầu cài PostgreSQL hoặc dừng role vì thiếu database. Vẫn viết test DB/tích hợp tại backend/tests/integration/<role>/ và bàn giao fixture, lệnh, expected result; ghi NOT_RUN_PENDING_OWNER để Bùi Thế Anh chạy trên máy Anh. READY_FOR_OWNER không đồng nghĩa DONE; test cạnh tranh/database thật vẫn bắt buộc trước nghiệm thu tương ứng.
