# Thiết kế dữ liệu PostgreSQL

Revision **1.0.0**, `DELEGATED_SELECTION` cho cột/độ dài/protocol cụ thể theo prompt tạo đặc tả và Q-20; giữ nguyên 8 FR, 3 NFR, 17 QT, 27 UC của SRS. Đây là DDL thực thi cho DB mới, chưa phải bằng chứng ứng dụng đã triển khai hoặc migration đã chạy trên DB người dùng.

Đọc lần lượt [dictionary](01-data-dictionary.md), [ERD](02-relationships.md), [constraints](03-constraints-and-indexes.md), [transaction](04-transactions-and-locking.md), [migration](05-migration-policy.md), [kiểm chứng](06-schema-verification.md).

## Dựng database thử nghiệm

Người vận hành tạo **một database rỗng dành riêng cho test**, cấu hình `DATABASE_URL` trỏ đúng DB đó; không dùng database học tập/đồ án đã có dữ liệu. DDL không có `DROP`, không tự tạo role hoặc thay quyền người dùng.

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f SQL/schema.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f SQL/tests/invariants.sql
```

`schema.sql` chạy một lần trên DB trống; lần thứ hai sẽ lỗi vì đối tượng đã tồn tại. Không sửa thành `IF NOT EXISTS` để che schema lệch. Script integrity chạy trong transaction và `ROLLBACK`, không để lại fixture. [Seed bootstrap](seeds/README.md) nhận hash Argon2id do công cụ tạo, không chứa mật khẩu thật.

## Dữ liệu chuẩn

- 9 bảng nghiệp vụ/identity gồm `student_profiles`, `student_accounts`, `staff_accounts`, `buildings`, `rooms`, `registration_period`, `applications`, `residence_records`, `room_fee_receipts`; cộng `sessions` của session store (tổng **10 bảng**).
- `room_availability` là view một dòng/phòng: các cột phòng, `building_code`, `building_name`, `allocated_places`, `available_places`.
- Không bảng thanh toán nhiều đợt, không occupancy counter, không bảng audit tổng quát, không soft-delete đại trà.
- JSON phải map theo allowlist tại [schemas.json](<../API Endpoint/Shared/schemas.json>); không trả nguyên entity DB, `password_hash`, `session_version`, `sessions` hoặc các trường ngoài DTO.

## Tình trạng kiểm chứng

Xem [biên bản](06-schema-verification.md). Docker daemon hiện không hoạt động và không có psql trên PATH lúc biên soạn; không kết nối PostgreSQL của người dùng. Các test SQL đã được soạn để người nhận chạy trên DB tách biệt; runtime hiện ghi `NOT_RUN`.
