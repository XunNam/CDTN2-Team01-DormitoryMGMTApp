# Transaction và thứ tự khóa dùng chung

Revision 1.0.0, `DELEGATED_SELECTION` theo Q-20 và prompt tạo đặc tả. Chọn **một khóa advisory cấp transaction cho mọi business write** để dễ chứng minh đúng cho prototype 20 người; đây là đánh đổi giới hạn throughput ghi, không phải kỹ thuật cho hệ thống quy mô lớn.

## Protocol bắt buộc

Mỗi transaction thay đổi account, profile, tòa, phòng, kỳ, đơn, residence hoặc receipt phải:

1. Lấy một `PoolClient`, `BEGIN ISOLATION LEVEL READ COMMITTED`.
2. Statement đầu sau BEGIN: `SELECT pg_advisory_xact_lock(724006,1)`. Chờ khóa kết thúc **trước** SELECT nghiệp vụ; không ghép lock và SELECT vào cùng CTE/statement.
3. Đọc lại account đúng actorKind/id/sessionVersion, `is_locked`, role. Kiểm role sau khóa; không giữ quyền cũ từ middleware/session. Admin tự khóa vẫn được; transaction đã nhận trước thời điểm khóa không phải bị hủy ngược.
4. SELECT lại các bản ghi cần thiết, check ownership, trạng thái và điều kiện. Khi cần `FOR UPDATE`, thứ tự: actor account → profile → period → application → room → residence → receipt; nhiều row cùng bảng theo UUID tăng dần. Không lấy row lock trước global lock.
5. Ghi bằng câu lệnh tham số hóa trên **chính client đó**; kiểm rowCount. Không `pool.query` xen trong transaction, không gọi HTTP hoặc chờ người dùng trong transaction.
6. COMMIT rồi mới trả response. Constraint deferred có thể lỗi tại COMMIT; phải catch, ROLLBACK, map lỗi và release client. Lỗi không để lại phần ghi dở.
7. Không tự retry mutation khi mất response. Tải lại trạng thái; yêu cầu mới khi đã hoàn tất trả 409. Deadlock/serialization không tự replay chưa xác định; rollback, trả lỗi retry an toàn theo Shared.

```sql
BEGIN ISOLATION LEVEL READ COMMITTED;
SELECT pg_advisory_xact_lock(724006,1);
-- SELECT actor fresh; SELECT domain; validate; UPDATE/INSERT using same connection.
COMMIT;
```

Session store `sessions` touch/prune không lấy business lock, vì không ghi nghiệp vụ. Login read và verify hash không giữ transaction trong lúc Argon2id; sau verify, lấy business lock, đọc lại account/hash/sessionVersion/khóa trước cấp session. Đổi mật khẩu có thể tính hash trước lock; verify/recheck lại trạng thái/hash dưới lock rồi ghi hash + `session_version+1`. Session hiện tại regenerate với version mới; phiên khác bị từ chối ở request kế tiếp.

## Ranh giới nghiệp vụ

| Hành động | Đọc lại trong lock | Ghi cùng transaction |
|---|---|---|
| Gửi đơn | period OPEN; không đơn PENDING/residence mở; phòng ACTIVE,còn chỗ,đúng giới tính | INSERT application PENDING; không ghi occupancy |
| Duyệt/xếp | đơn PENDING; sinh viên không residence mở; phòng được chọn ACTIVE,còn chỗ,đúng giới tính | UPDATE application APPROVED,reviewedBy; INSERT residence ALLOCATED |
| Từ chối | đơn PENDING,lý do hợp lệ | UPDATE REJECTED,reason,reviewedBy |
| Nhận | residence ALLOCATED,ngày<=hôm nay | UPDATE CHECKED_IN,checkInDate,actor/time; không counter |
| Hủy | residence ALLOCATED,lý do | UPDATE CANCELLED,reason,actor/time; giữ receipt |
| Trả | residence CHECKED_IN,checkout>=checkin,không tương lai | UPDATE ENDED,date,actor/time; không check đã trả hết tiền |
| Lập phiếu | residence ALLOCATED/CHECKED_IN,chưa receipt,giá hiện tại | INSERT receipt UNPAID,amount snapshot,createdBy |
| Thanh toán | receipt UNPAID,ngày hợp lệ,BQL đã nhận đủ | UPDATE PAID,paymentDate,actor/time; không phụ thuộc residence còn mở |
| Sửa phòng/profile | số phân bổ,giới tính của mọi residence mở | UPDATE chỉ khi invariant giữ đúng |
| Mở/đóng kỳ | trạng thái khác trạng thái yêu cầu | UPDATE singleton + updatedBy |
| Khóa/mở | actor ADMIN fresh,đúng target namespace,trạng thái khác | UPDATE isLocked; không đổi role,xóa lịch sử |

## Vì sao các cuộc đua được bảo vệ

Mọi writer tham gia cùng khóa nên chỉ một writer được kiểm rồi ghi tại một thời điểm. Writer thứ hai chờ đến khi writer thứ nhất COMMIT, sau đó READ COMMITTED ở statement mới thấy dữ liệu mới. Hai duyệt chỗ cuối: một thành công, người sau thấy ROOM_FULL; hai lập phiếu: người sau thấy receipt/unique; đóng kỳ-vừa gửi: thứ tự lấy khóa quyết định đơn được nhận trước hay bị PERIOD_CLOSED.

Trigger/unique là lớp kiểm tra bổ sung, **không tự thay thế global lock**. BEFORE STATEMENT trigger `require_business_lock` trên mọi bảng nghiệp vụ từ chối DML khi connection chưa giữ exclusive advisory(724006,1) hoặc isolation khác READ COMMITTED. Seed phải dùng cùng lock; không cho các module tự ghi tắt bằng ORM hay câu SQL ngoài transaction. Trigger không biết những SELECT đã chạy trước đó nên người viết vẫn phải lấy khóa ở statement đầu; không dùng session-level advisory lock dù cùng key. Vai trò ứng dụng không nên là superuser/schema owner khi triển khai; provisioning quyền là task vận hành riêng.

Phép kiểm dùng [pg_locks PostgreSQL](https://www.postgresql.org/docs/18/view-pg-locks.html): hai key integer ở classid/objid, objsubid=2; kiểm đúng pid/database/mode/granted. Lỗi nội bộ BUSINESS_LOCK_REQUIRED là bug đường ghi, trả500 INTERNAL_ERROR và rollback; không đổi thành lỗi nghiệp vụ của người dùng.

## Kiểm chứng đồng thời cần chạy

Hai client độc lập; client A BEGIN+lock+ghi giữ 5 giây, client B bắt đầu khi A chưa COMMIT. B phải chờ và sau đó thấy state mới. Chạy cả hai thứ tự cho: duyệt chỗ cuối; duyệt/từ chối cùng đơn; nhận/hủy; trả hai lần; lập phiếu hai lần; sửa capacity/duyệt; đóng kỳ/gửi; khóa account/request kế tiếp. [Kịch bản](tests/concurrency.md) là hướng dẫn chạy; chưa có runtime thì không đánh dấu đạt.
