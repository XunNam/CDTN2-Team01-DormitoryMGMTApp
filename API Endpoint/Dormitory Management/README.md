# API dành cho Ban quản lý ký túc xá

Role máy: `BQL`. Contract revision1.0.0, trạng thái SPECIFIED_NOT_IMPLEMENTED. Có **28 operation HTTP** cho role này; xác thực dùng chung nằm ở Shared.

1. Đọc [AGENTS.md](AGENTS.md); nếu chưa biết role/task phải hỏi người đang giao việc trước khi code.
2. Đọc [API-Contract.md](API-Contract.md) và schema/error/transaction chung.
3. Nhận task với operationId, owner, reviewer, phạm vi file và phụ thuộc rõ ràng. Role không tự gán thành viên hoặc quyền sửa Shared/schema.
4. Triển khai trong `backend/src/roles/management/`, kiểm thử và bàn giao đúng task. Các tên file/export ở contract là đích bắt buộc để tích hợp.

## Nguồn dùng chung

- [Danh mục toàn bộ API](../README.md)
- [Quy ước HTTP](../Shared/00-conventions.md)
- [Đăng nhập và phiên](../Shared/01-authentication.md)
- [Phân quyền](../Shared/02-authorization.md)
- [DTO và validation](../Shared/03-data-contracts.md)
- [Mã lỗi](../Shared/04-errors.md)
- [Đồng thời và retry](../Shared/05-concurrency-and-retry.md)
- [Database](../../SQL/README.md)

Các route hỗ trợ đọc phục vụ UI không tạo thêm quyền nghiệp vụ. Không tự mở API ngoài danh mục, không copy định nghĩa Shared thành bản riêng theo role. Không commit/push/merge bằng Agent; người cộng tác kiểm tra và làm Git theo hướng dẫn gốc.
