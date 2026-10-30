# Bootstrap và dữ liệu thử

Chỉ dùng database demo/test mới đã xác minh, không đọc hoặc thay dữ liệu thật. Không lưu mật khẩu thật, hash tài khoản thật hoặc thông tin sinh viên thật trong repo. File [invariants.sql](../tests/invariants.sql) dùng hash prefix giả để test constraint, **không dùng đăng nhập**.

## Admin đầu tiên

1. Công cụ bootstrap được giao riêng sinh Argon2id theo Shared auth từ password demo nhập qua prompt ẩn hoặc secret environment, không log password/hash.
2. Mở transaction READ COMMITTED, lấy advisory lock(724006,1), xác nhận staff username bootstrap chưa tồn tại.
3. INSERT staff_accounts(username,display_name,role,password_hash) với role ADMIN và hash đã sinh. Username theo chuẩn lower-case; không truyền password rõ vào SQL/log.
4. COMMIT, đăng nhập bằng Shared login; Admin cấp account BQL/SV qua API trong demo. BQL tạo profile trước rồi Admin cấp account SV; bootstrap không thay chức năng FR-01/02.

Ví dụ prepared SQL (ký hiệu `$1..$3` là parameter của driver, không copy làm script psql trực tiếp):

```sql
INSERT INTO staff_accounts(username,display_name,role,password_hash)
VALUES ($1,$2,'ADMIN',$3)
RETURNING id,username,display_name,role,is_locked;
```

Nếu Admin tự khóa toàn bộ, người vận hành có thể khôi phục **đúng account demo được xác minh** bằng UPDATE is_locked=false trong transaction có lock. AI không tự chạy khôi phục; không đổi role hoặc xóa tạo lại account.

## Fixture nghiệp vụ

Để triển khai acceptance/NFR sau này, seed script phải có profile trước student account, một BQL, một Admin, phòng MALE/FEMALE, trạng thái residence và receipt theo đầy đủ state machine. Mọi approval tạo residence cùng transaction, receipt snapshot theo giá lúc lập. Các trạng thái không được chèn tắt bỏ trigger.

NFR-02 cần100 profile SV,100 phòng,20 user đồng thời,tổng100 request đọc,ít nhất95 dưới2s; đây là quy mô kiểm thử tương lai, không phải tuyên bố đã có seed100 hoặc đã đạt tải. Thông số máy và dữ liệu seed deterministic ghi tại task kiểm chứng.
