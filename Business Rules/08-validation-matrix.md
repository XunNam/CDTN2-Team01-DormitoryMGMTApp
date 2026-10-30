# Ma trận truy vết và kiểm chứng liên phần

Revision 1.0.0. Bảng này là **đặc tả kết quả cần kiểm**, không phải kết quả chạy API/DB. Giữ nguyên 19 TC chức năng gốc và TC-N1..N3; test bổ sung có mã BR-* để không đổi mã SRS.

| FR và UC | QT chuẩn | Operation trọng tâm | SQL/cơ chế | TC SRS và kết quả cần đạt |
|---|---|---|---|---|
| FR-01, UC-01..06 | QT-01/02 | login, logout, changePassword, adminCreateAccount, adminSetAccountLock | Hai kho account, FK profile, UNIQUE student_id, role bất biến, session_version | TC-01.1 cấp/đăng nhập/đúng quyền; TC-01.2 khóa mở giữ dữ liệu; TC-01.3 đổi mật khẩu và logout |
| FR-02, UC-07..10 | QT-02/03 | managementCreateProfile,managementUpdateProfile,studentGetProfile,studentUpdateContact | UNIQUE student_code,guard_profile,DTO allowlist | TC-02.1 tạo/tìm/mã trùng;02.2 chỉ sửa liên hệ mình |
| FR-03, UC-11..13 | QT-04/05 | managementCreateRoom, managementUpdateRoom, studentListRooms, studentGetRoom | room_availability, guard_room, global lock | TC-03.1 phòng 6 chỗ, giữ 2, ở 3, còn 1; TC-03.2 không giảm xuống 4 hoặc ngừng khi 5 chỗ đã phân bổ; TC-03.3 lọc kết hợp |
| FR-04, UC-14..16 | QT-06/07/08 | managementUpdatePeriod,studentCreateApplication,studentListApplications | Singleton,partial unique pending,guard_application | TC-04.1 tạo PENDING chưa giữ;04.2 kỳ đóng/đơn chờ/residence mở bị từ chối |
| FR-05, UC-17..19 | QT-05/08/09/10 | managementApproveApplication,managementRejectApplication | Deferred pair,UNIQUE application_id,partial unique residence,global lock | TC-05.1 atomically APPROVED+ALLOCATED;05.2 không vượt chỗ/khi sai điều kiện;05.3 từ chối có lý do |
| FR-06, UC-20..23 | QT-11/12/13/16 | managementCheckIn,managementCancelAllocation,managementCheckOut,managementListResidences | guard_residence,view count,no history delete | TC-06.1 nhận không trừ thêm;06.2 hủy trả 1;06.3 trả giữ UNPAID |
| FR-07, UC-24..26 | QT-14/15/16 | managementCreateReceipt,managementPayReceipt,studentListReceipts | UNIQUE residence_id,snapshot trigger,guard_receipt | TC-07.1 giá lúc lập/chặn phiếu 2;07.2 PAID + ngày/người và SV thấy |
| FR-08, UC-27 | QT-17 | managementGetStatistics | Một SELECT aggregate, COALESCE về 0 | TC-08.1 đúng 2 phòng, 7 chỗ, 3 đang ở, 2 UNPAID; dữ liệu trống trả 0 |

UC-06 là phần cấp account; UC-19 là kiểm điều kiện nội bộ của duyệt. Không tạo hai API dư để “phủ đủ UC”. Danh mục đầy đủ và method/URL ở [API index](<../API Endpoint/README.md>).

## Test bổ sung bắt buộc trước tích hợp

| ID | Given và When | Then |
|---|---|---|
| BR-OWN-01 | SV A đọc detail/list/filter của B | Không thấy dữ liệu B, detail trả 404, không lộ count/metadata của B |
| BR-FIELD-01 | SV PATCH contact kèm gender/role/studentId | 422, không field nào bị đổi |
| BR-PROFILE-01 | Có profile chưa có account, thử login | 401; chỉ khi cấp account hợp lệ mới đăng nhập được |
| BR-LOCK-01 | Account đã khóa, gọi request bảo vệ kế tiếp | 401 ACCOUNT_LOCKED, mọi dữ liệu nghiệp vụ giữ nguyên |
| BR-SESSION-01 | Đổi password ở phiên A, phiên B dùng version cũ | A regenerate, B nhận 401 SESSION_EXPIRED, không lộ hash |
| BR-CAP-01 | Hai client duyệt chỗ cuối chồng lấp | Một thành công, một 409 ROOM_FULL, số chỗ không âm |
| BR-RACE-01 | Duyệt và từ chối cùng đơn |Chỉ một state cuối, không residence mồ côi |
| BR-GENDER-01 | Đổi gender hoặc capacity trong lúc duyệt |Không residence mở sai giới tính/quá capacity |
| BR-PERIOD-01 | Gửi đơn và đóng kỳ chồng lấp |Thứ tự lock xác định kết quả, đơn đã nhận giữ nguyên |
| BR-PRICE-01 | Giá xếp A, lập B, sau đó lại C |Phiếu B bất biến |
| BR-PAY-01 | Hai tạo phiếu hoặc xác nhận tiền đồng thời |Một phiếu/một lần PAID, ngày/người không ghi đè |
| BR-ZERO-01 | feeVnd='0', lập phiếu | amountVnd='0', status=UNPAID |
| BR-HISTORY-01 | Hủy residence ALLOCATED hoặc trả residence CHECKED_IN có phiếu UNPAID | Lịch sử/phiếu/nợ giữ nguyên, SV còn xem và BQL còn xác nhận được |
| BR-DATE-01 | Ngày tương lai hoặc checkout trước checkin | 422, metadata và dữ liệu không đổi |
| BR-RETRY-01 | Gọi lại nhận/hủy/trả/pay sau thành công | 409 INVALID_STATE, không thay số chỗ hoặc metadata |

Chi tiết test hai connection ở [concurrency](../SQL/tests/concurrency.md). Integrity một connection [invariants.sql](../SQL/tests/invariants.sql) bảo vệ cấu trúc/state, không thay test ownership/API.

## Yêu cầu phi chức năng giữ nguyên

- **TC-N1/NFR-01:** thử ba role, chưa login, sai role, sai owner, tài khoản khóa và hash Argon2id thực; mọi truy cập trái quyền không trả dữ liệu bảo vệ.
- **TC-N2/NFR-02:** 100 SV, 100 phòng, 20 user đồng thời, tổng 100 request đọc; ít nhất 95 request dưới 2 giây; ghi môi trường, endpoint và thời gian. Không chỉ đo health.
- **TC-N3/NFR-03:** máy có Docker và Compose; sau cấu hình, frontend, API và DB khởi động bằng tối đa 2 lệnh; thử tạo phòng và duyệt đơn. Scaffold health chạy không đồng nghĩa đã đạt tiêu chí nghiệm thu này.

Mọi test chưa có runtime phải ghi NOT_RUN. Người làm ghi lệnh, kết quả, bằng chứng và hạn chế tại task/handoff; một người khác rà soát quyền, sức chứa, tiền và migration trước tích hợp.
