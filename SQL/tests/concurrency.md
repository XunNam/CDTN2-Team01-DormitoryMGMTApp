# Kiểm chứng hai kết nối PostgreSQL độc lập

Trạng thái **NOT_RUN**; cần DB mới riêng cho test và implementation hoặc script SQL theo đúng protocol. Không thử trên dữ liệu thật. Integrity một kết nối ở [invariants.sql](invariants.sql) không thay test này.

## Bố trí

Tạo fixture hai SV nam với hai đơn PENDING, một phòng ACTIVE capacity1, chưa residence, một staff BQL hoạt động. Có thể lấy lệnh setup đầu `invariants.sql`, nhưng thay bằng transaction fixture **được COMMIT** trên DB disposable. Ghi lại UUID và giá trị ban đầu; không copy hash fixture để login ứng dụng.

Mở hai terminal `psql` cùng database. Session A và B đều `\set ON_ERROR_STOP on`. Session A giữ transaction chưa COMMIT; session B chạy khi A vẫn đang giữ khóa, phải bị chặn tại câu advisory lock, không chỉ được chạy sau khi A xong.

```sql
-- Session A
BEGIN ISOLATION LEVEL READ COMMITTED;
SELECT pg_advisory_xact_lock(724006,1);
-- SELECT actor BQL fresh, application A, student, room, count.
-- UPDATE application A APPROVED then INSERT residence A ALLOCATED.
SELECT pg_sleep(5); -- Chỉ dùng trong test để tạo overlap thật.
COMMIT;
```

```sql
-- Session B: start BEFORE A commits.
BEGIN ISOLATION LEVEL READ COMMITTED;
SELECT pg_advisory_xact_lock(724006,1); -- Must wait.
-- NEW statement after lock: SELECT available_places -> 0.
-- Service reports ROOM_FULL; do not update application B.
ROLLBACK;
```

Không chạy raw SQL INSERT residence B bất chấp điều kiện rồi coi trigger lỗi là tất cả kiểm chứng API. Cần chạy cả request chồng lấp qua implementation để xác minh status/error/transaction adapter; DB trigger là lớp phụ.

## Ma trận bắt buộc

| Hai thao tác chồng lấp | Kết quả sau cả hai kết thúc |
|---|---|
| Duyệt A và B lấy chỗ cuối | Một residence mới, phòng không âm; đơn thua vẫn PENDING,409 ROOM_FULL |
| Duyệt và từ chối cùng đơn | Chỉ một kết quả cuối; APPROVED kèm residence hoặc REJECTED không residence; người sau409 INVALID_STATE |
| Nhận và hủy cùng residence | Chỉ CHECKED_IN hoặc CANCELLED, metadata đúng nhánh |
| Hai trả cùng residence | Một ENDED, chỗ tăng một lần, người sau409 |
| Hai lập phiếu | Một receipt, một snapshot, người sau409 RECEIPT_ALREADY_EXISTS |
| Hai xác nhận tiền | Một lần PAID; ngày/người đầu không bị ghi đè |
| Giảm capacity/ngừng phòng và duyệt | Không capacity dưới số phân bổ, không residence mở trong phòng INACTIVE |
| Đổi gender profile/phòng và duyệt | Không residence mở sai gender |
| Đóng kỳ và gửi đơn | Nếu đóng thắng: không tạo đơn; nếu gửi thắng: đơn PENDING được giữ sau đóng |
| Đổi giá và lập phiếu | Snapshot bằng giá ở thứ tự transaction đã thắng trước lập, không bị sửa về sau |
| Hủy/trả và lập phiếu | Nếu hủy/trả thắng: lập mới bị từ chối; nếu lập thắng: phiếu giữ sau kết thúc |
| Khóa actor và request ghi tiếp theo | Request được kiểm sau khóa phải401; lịch sử không mất |

Mỗi case lưu thứ tự BEGIN/lock/COMMIT, thời điểm gọi hai client, response API, SELECT kiểm invariant cuối và trạng thái dọn fixture. Chạy đổi thứ tự A/B. Không thay NFR-02 bằng thời gian chờ global lock trong test5 giây; đo tải là kịch bản khác.
