# Phần dùng chung

Kế thừa [AGENTS API](../AGENTS.md). Shared không là role thứ tư. Chỉ người có task Shared từ điều phối sửa schemas, auth, error, session, transaction hoặc migration. Agent role đọc và dùng các helper có sẵn; nếu thiếu helper, nêu phụ thuộc thay vì tạo bản sao.

Trước nhận task Shared chưa rõ, hỏi người giao “Bạn đã được Anh giao phần Shared nào và những file nào được sửa?”. Không nhận mình có quyền Shared chỉ do đang làm ADMIN.

`schemas.json` là nguồn field/type; `examples.json` minh họa dữ liệu giả. OpenAPI/request examples được dẫn xuất qua `tools/build_contract_artifacts.py`; chạy lại và kiểm tra khi đổi chuẩn.

## Khối lượng và giai đoạn thực hiện

Áp dụng [đánh giá và chia giai đoạn](../../Coordination/phased-execution.md) trước task Shared. Đánh giá cả session, CSRF, quyền và kiểm thử liên phần; nếu quá lớn, báo người giao và chia theo phụ thuộc trong phạm vi được giao. Ghi kế hoạch/checkpoint để tiếp tục; không gộp task Shared vào role hoặc đánh dấu hoàn tất auth khi chỉ mới xong một giai đoạn.

## Kiểm thử khi máy thành viên không có PostgreSQL

Theo [phân công kiểm thử](../../Coordination/testing-responsibilities.md), thành viên chỉ cần Node.js 24/npm 11 để triển khai, viết test và chạy build/unit. Không yêu cầu cài PostgreSQL hoặc dừng role vì thiếu database. Vẫn viết test DB/tích hợp tại backend/tests/integration/<role>/ và bàn giao fixture, lệnh, expected result; ghi NOT_RUN_PENDING_OWNER để Bùi Thế Anh chạy trên máy Anh. READY_FOR_OWNER không đồng nghĩa DONE; test cạnh tranh/database thật vẫn bắt buộc trước nghiệm thu tương ứng.
