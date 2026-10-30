# Phần dùng chung

Kế thừa [AGENTS API](../AGENTS.md). Shared không là role thứ tư. Chỉ người có task Shared từ điều phối sửa schemas, auth, error, session, transaction hoặc migration. Agent role đọc và dùng các helper có sẵn; nếu thiếu helper, nêu phụ thuộc thay vì tạo bản sao.

Trước nhận task Shared chưa rõ, hỏi người giao “Bạn đã được Anh giao phần Shared nào và những file nào được sửa?”. Không nhận mình có quyền Shared chỉ do đang làm ADMIN.

`schemas.json` là nguồn field/type; `examples.json` minh họa dữ liệu giả. OpenAPI/request examples được dẫn xuất qua `tools/build_contract_artifacts.py`; chạy lại và kiểm tra khi đổi chuẩn.
