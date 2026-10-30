# Ràng buộc và chỉ mục

Revision 1.0.0. SQLSTATE nội bộ được adapter đổi sang [mã lỗi API](<../API Endpoint/Shared/04-errors.md>); không trả tên constraint, thông điệp trigger hoặc SQL thô cho người dùng.

| Bất biến | Cơ chế trong schema | Kiểm tra tại service |
|---|---|---|
| Writer giữ đúng protocol | BEFORE STATEMENT require_business_lock kiểm advisory key+pid+database+mode và READ COMMITTED | Lấy xact lock ở statement đầu; không session-level lock |
| Mã SV duy nhất | UNIQUE `student_profiles.student_code` | Trim + uppercase, regex trước ghi |
| Account SV gắn hồ sơ có trước | FK + UNIQUE `student_accounts.student_id` | Admin cấp, kiểm đúng kho và role |
| Hai kho credentials | Hai bảng, role CHECK, `guard_account` | principal gồm actorKind/accountId; role đọc fresh |
| Role và mã bất biến | `guard_account`, `guard_profile`, `guard_building`, `guard_room` | PATCH allowlist không nhận field cấm |
| Đơn chờ duy nhất | Partial unique `applications_one_pending_per_student` | Từ chối 409 khi đã có đơn |
| Hồ sơ mở duy nhất | Partial unique `residence_one_open_per_student` | Kiểm trong transaction gửi/duyệt |
| Một residence/đơn | UNIQUE `residence_records.application_id` | Duyệt + tạo atomically |
| APPROVED có đúng một residence | Deferred `application_pair`, `residence_pair` | Cập nhật đơn trước INSERT residence; lỗi COMMIT phải rollback |
| Đúng sinh viên/actor khi duyệt | `guard_residence` đối chiếu đơn | Đọc đơn và actor trong cùng transaction |
| Sức chứa/giới tính/phòng hoạt động | `guard_room`, `guard_profile`, `guard_residence` | **Bắt buộc global lock trước check**, trigger không thay protocol |
| Không giữ chỗ khi gửi | Không có counter, đơn không tham gia view count | Không tạo residence ở bước gửi |
| State machine hợp lệ | `guard_application`, `guard_residence`, `guard_receipt`, `guard_period` | Kiểm trạng thái trước, mutation lặp 409 |
| Lý do/ngày/người đúng trạng thái | CHECK nhiều cột + trigger actor/date | Chuẩn hóa input, actor/time do server |
| Giá phiếu chốt | `guard_receipt` lấy giá hiện tại lúc INSERT và cấm đổi | Client không có amountVnd trong request |
| Không mất lịch sử | FK RESTRICT + `preserve_history`/`preserve_history_truncate` | Không có endpoint DELETE/TRUNCATE |
| Đổi mật khẩu vô hiệu phiên cũ | `guard_account` buộc sessionVersion tăng đúng 1 khi hash đổi | Verify password cũ, Argon2id, regenerate session hiện tại |

## Kiểu dữ liệu và validation

UUID dùng `gen_random_uuid()`. Enum dùng varchar + CHECK để DDL dễ đọc; không thêm enum ngoài chuẩn API. BIGINT tiền có biên PostgreSQL `0..9223372036854775807` và phải trả JSON chuỗi số; không ép sang JS Number. Mã 1..32 ký tự ASCII chuẩn uppercase; username 3..50 ký tự lower-case. Capacity 1..10000 là giới hạn kỹ thuật prototype, không phải nguyên văn SRS.

CHECK SQL cho email là kiểm tra cấu trúc tối thiểu; validator request theo schema API vẫn là nơi kiểm email chặt hơn. Ngày tương lai được trigger kiểm theo `Asia/Ho_Chi_Minh` tại lúc ghi. Không lưu ngày giả để thay null.

## Chỉ mục và đọc nhất quán

Unique tạo index cho PK/business key/FK unique. Các index `rooms_filter_idx`, `applications_*`, `residence_*`, `receipts_status_created_idx` phục vụ lọc và lịch sử. Index `lower(full_name),id` hỗ trợ sort/prefix phù hợp, **không khẳng định tăng tốc mọi ILIKE '%q%'**; 100 hồ sơ ở NFR không cần thêm extension trigram khi chưa đo.

View count chỉ đếm `ALLOCATED/CHECKED_IN`. Không dùng `GREATEST(0,...)` để che bug chỗ âm. Truy vấn list và count trong cùng read-only REPEATABLE READ transaction nếu response cần `meta` khớp cùng snapshot; giữ sort + id ổn định. Thống kê dùng một SELECT nhiều subquery, không join nhiều tập rồi đếm nhân bản.
