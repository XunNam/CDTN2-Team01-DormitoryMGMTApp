# Hướng dẫn AI viết backend

Đọc [AGENTS gốc](../AGENTS.md), [hướng dẫn backend](README.md), [Coordination](../Coordination/README.md) và contract revision1.0.0. Chỉ sửa trong bản clone hiện tại; không tự commit/push/merge/tag/triển khai.

- Nếu chưa được nói role/task, hỏi chính người giao việc: **“Bạn đang được giao role Sinh viên (SV), Ban quản lý (BQL) hay Quản trị viên (ADMIN), và các operation/task nào?”** Chờ trả lời trước code nghiệp vụ. Đã rõ role nhưng chưa rõ API thì hỏi operationId; không tự làm cả role hoặc gán bạn nhóm vào domain.
- Đúng role và task mới được sửa folder role tương ứng. Các file nền `app.ts`, `server.ts`, `shared/**`, manifest/lockfile/tsconfig và `SQL/**` phải có task Shared hoặc chỉ định của Anh.
- Một Express app, một Pool, một session/auth, một schema. Không tạo server/auth/DB riêng để tránh phụ thuộc.
- Code hoàn tất đặt trong slot của router/validation/controller/service/repository; exported function theo operationId, test tại `tests/<role>/<operationId>.test.ts`. Không để code hoàn chỉnh chỉ trong chat, file tạm hoặc tài liệu Markdown.
- Mọi response theo Shared DTO/error; `sendData`/`sendList`, 204 không body; không raw DB row/hash/password/session/token. Chỉ log dữ liệu đã loại bí mật và định danh không cần thiết.
- Mọi mutation dùng transaction chung và client được truyền, recheck actor sau advisory lock. GET list/count dùng cùng snapshot. Không dựa vào UI disable nút hoặc đếm chỗ trước transaction.
- Scaffold không triển khai auth/business. Task role không được giả login/session để tuyên bố API chạy. Chuẩn bị validation/test độc lập trong khi chờ Shared auth; ghi dependency.
- Chạy `npm run check` trên máy thành viên, bàn giao test DB thật cho Anh theo phân công; ghi kết quả thực tế, điều chưa chạy và ảnh hưởng liên phần vào handoff. Không coi test DB giả là kiểm chứng chống vượt sức chứa.

## Khối lượng và giai đoạn thực hiện

Trước code, thực hiện [đánh giá và chia giai đoạn](../Coordination/phased-execution.md). Nếu task vượt khả năng làm và kiểm tra trọn trong phiên, báo người giao, đề xuất nhóm operation theo contract/phụ thuộc đã có; ghi kế hoạch, checkpoint và bước tiếp tục. Không đổi quyền hoặc bỏ kiểm thử để làm nhanh. Hoàn thành giai đoạn phải phân biệt với hoàn thành toàn task/role. Task nhỏ được làm trọn; không tự yêu cầu duyệt lại từng bước đã được giao.

## Kiểm thử khi máy thành viên không có PostgreSQL

Theo [phân công kiểm thử](../Coordination/testing-responsibilities.md), thành viên chỉ cần Node.js 24/npm 11 để triển khai, viết test và chạy build/unit. Không yêu cầu cài PostgreSQL hoặc dừng role vì thiếu database. Vẫn viết test DB/tích hợp tại backend/tests/integration/<role>/ và bàn giao fixture, lệnh, expected result; ghi NOT_RUN_PENDING_OWNER để Bùi Thế Anh chạy trên máy Anh. READY_FOR_OWNER không đồng nghĩa DONE; test cạnh tranh/database thật vẫn bắt buộc trước nghiệm thu tương ứng.
