# Bảng nhận việc ban đầu

Revision1.0.0. Đây là danh mục giao việc, không là tuyên bố các tính năng đã được code. Chưa gán người cụ thể. Người giao task điền owner/reviewer và file trước bắt đầu. Khi chưa biết role hoặc operation, Agent hỏi người giao; không tự lấy tất cả task chưa có owner.

| Task | Role người thực hiện | Đầu ra | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| BASE-REVIEW | Shared được Anh giao | Review schema+helper+contract; chạy SQL trên DB test sạch; xác nhận bản1.0.0 cho tích hợp | Bộ tài liệu hiện tại | Chờ người review |
| AUTH-01 | Shared được Anh giao | getCsrfToken/login/logout/changePassword/getCurrentIdentity + kiểm thử session/CSRF/khóa/version | BASE-REVIEW | Chưa triển khai |
| ADMIN-01 | ADMIN |5 operation Admin theo manifest; cấp account từ profile đã có | AUTH-01; có staffAdmin demo từ công cụ hash | Chưa triển khai |
| BQL-FOUNDATION | BQL | Profile/building/room/period; kiểm thử sức chứa và dữ liệu đầu vào | AUTH-01 | Chưa triển khai |
| SV-01 | SV |13 operationStudent; ưu tiên profile/room/period trước gửi đơn | AUTH-01; BQL-FOUNDATION dữ liệu giả | Chưa triển khai |
| BQL-LIFECYCLE | BQL | Applications/residences/actions + kiểm thử đồng thời | BQL-FOUNDATION; dữ liệu đơn SV | Chưa triển khai |
| BQL-FEE | BQL | Receipts/create/pay và bảo toàn khoản phải thu | BQL-LIFECYCLE | Chưa triển khai |
| BQL-STATS | BQL | managementGetStatistics, đúng 4 chỉ số SHOULD | MUST ổn định | Chưa triển khai |
| INTEGRATE | Anh điều phối | Review cácPR, kiểm thử luồng liên phần vàNFR; merge thủ công | Các handoff từng task | Chưa triển khai |

ADMIN-01 không chặn BQL-FOUNDATION nếu có account demo hợp lệ trên DB test; DB seed không thay chức năng cấp account. Các API chưa được task giao không tự thêm route tạm trảsuccess. Khi task quá lớn tách theo operationId; cập nhật bảng với người đang giữ file để tránh hai Agent sửa cùngcontroller.ts.

## Nơi thực hiện các phụ thuộc và kiểm thử

Các dependency auth/schema/fixture trong bảng là điều kiện để kiểm chứng tích hợp đầy đủ, không buộc máy thành viên cài PostgreSQL mới được viết code. Thành viên dùng Node/npm, triển khai phần độc lập và viết test tích hợp để Anh chạy. BASE-REVIEW và kiểm thử DB do Anh điều phối trên máy Anh; các task role có thể READY_FOR_OWNER khi code/build/unit/hồ sơ đủ, còn test PostgreSQL ghi NOT_RUN_PENDING_OWNER. Xem [phân công](testing-responsibilities.md).
