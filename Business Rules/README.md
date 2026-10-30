# Quy tắc nghiệp vụ VLU DormFlow

Revision **1.0.0**. Các QT-01..QT-17 là `SRS_CONFIRMED` (SRS trang20–21); các làm rõ giữ Q-25..27 và [decision](../Planning/10-DECISIONS-AND-HANDOFF.md). Cách biểu diễn kỹ thuật/validation/lock là `DELEGATED_SELECTION` theo prompt tạo bộ đặc tả, không giả là nguyên văn SRS.

| Tệp | Nội dung chuẩn |
|---|---|
| [Glossary và trạng thái](00-glossary-and-statuses.md) | Công thức chỗ, owner, vai trò, sáu state machine |
| [Tài khoản và quyền](01-accounts-and-permissions.md) | QT-01, QT-02, QT-03 |
| [Phòng và sức chứa](02-rooms-and-capacity.md) | QT-04, QT-05 |
| [Đăng ký](03-registration.md) | QT-06, QT-07, QT-08 |
| [Xét duyệt](04-review-and-allocation.md) | QT-09, QT-10 |
| [Vòng đời lưu trú](05-residence-lifecycle.md) | QT-11, QT-12, QT-13 |
| [Phiếu thu](06-receipts-and-payment.md) | QT-14, QT-15, QT-16 |
| [Thống kê](07-statistics.md) | QT-17 |
| [Ma trận kiểm chứng](08-validation-matrix.md) | FR/UC/TC, invariant và test đồng thời |

Mọi ghi phải dùng [global transaction protocol](../SQL/04-transactions-and-locking.md). [SQL schema](../SQL/schema.sql) bảo vệ phần cấu trúc/trạng thái; không thay thế quyền API và ownership. [Shared](<../API Endpoint/Shared/00-conventions.md>) là nguồn duy nhất cho response/status/error; không trả thông điệp trigger SQL làm message người dùng.
