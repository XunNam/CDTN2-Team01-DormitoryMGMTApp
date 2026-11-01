# Đánh giá khối lượng và chia giai đoạn thực hiện

Áp dụng cho mọi AI nhận task trong repo. Quy tắc này bổ sung cách thực hiện công việc; giữ nguyên contract revision 1.0.0, schema, FR/QT/AC/TC, quyền sửa file và thứ tự phụ thuộc đã chốt. Nguồn: yêu cầu chủ dự án ngày 01/11/2026, tránh nhận khối lượng vượt khả năng hoàn tất trong một phiên AI.

## Đánh giá trước khi code

Sau khi rõ role và task, AI phải xem khối lượng thực tế trước khi hứa hoàn thành cả role:

- Danh sách operationId được giao; nhóm đọc, ghi, chuyển trạng thái và liên phần.
- Số file/lớp phải sửa, lượng tài liệu cần đọc, trạng thái code hiện tại và thay đổi chưa bàn giao của người khác.
- Phụ thuộc Shared auth, schema, dữ liệu mẫu, môi trường PostgreSQL test và phần role khác đã có hay còn thiếu.
- Độ phức tạp quyền, ownership, transaction, cạnh tranh, session và tiền; số operation ít không đồng nghĩa việc nhẹ.
- Thời gian và ngữ cảnh cần cho code, kiểm thử, sửa lỗi, rà soát và bàn giao; tính cả bước kiểm chứng, không chỉ thời gian viết code.
- Giới hạn phiên/ngữ cảnh/công cụ nếu môi trường thực sự cung cấp. Không tự bịa số token, phần trăm hạn mức còn lại hoặc cam kết chắc chắn tránh mọi giới hạn của nhà cung cấp.

Kết luận ngắn gọn cho người giao: làm trọn task trong phiên hay nên chia giai đoạn, căn cứ và phụ thuộc. Task nhỏ, rõ và có đủ nền thì thực hiện trọn task; không bắt người dùng xác nhận lại các bước thường lệ đã được giao.

Nên chia khi task bao gồm cả role/nhiều nhóm nghiệp vụ, nhiều lớp cùng sửa, mutation nhạy cảm, phụ thuộc chưa ổn định hoặc cần nhiều vòng test/sửa lỗi. Không dùng ngưỡng cứng “N API mỗi phiên”: một thao tác duyệt đơn có thể nặng hơn nhiều API đọc. Nếu không đủ cơ sở hoàn tất cả code và kiểm thử trong phiên, chọn giai đoạn nhỏ có đầu ra kiểm chứng được.

## Thông báo và kế hoạch khi công việc lớn

Trước khi sửa một loạt file, giải thích cho chính người giao việc rằng làm toàn bộ trong một lần có nguy cơ hết ngữ cảnh/hạn mức hoặc không đủ thời gian kiểm tra. Đề xuất kế hoạch theo [mẫu giai đoạn](phase-plan-template.md), gồm:

1. Task/role và danh sách operationId đầy đủ đã được giao.
2. Mỗi giai đoạn làm operation nào, file nào, phụ thuộc gì và đầu ra gì.
3. Các test và điều kiện kết thúc giai đoạn; phần còn phải kiểm chứng sau khi ghép.
4. Giai đoạn nên bắt đầu và cách tiếp tục trong phiên sau; phân biệt đang làm, chờ phụ thuộc và chưa làm.

Nếu được giao triển khai trọn task/role, việc chia giai đoạn là cách tổ chức trong phạm vi đã ủy quyền: thông báo kế hoạch, cho người dùng cơ hội điều chỉnh và bắt đầu giai đoạn đầu đủ điều kiện. Không tự biến việc chia nhỏ thành yêu cầu xin phép lại mỗi giai đoạn. Nếu người dùng chỉ yêu cầu lập kế hoạch hoặc chỉ giao một giai đoạn, làm đúng phạm vi đó. Chỉ hỏi và đợi trả lời khi role/task chưa rõ, cần quyền sửa Shared/schema chưa được giao, thay đổi phạm vi hoặc cần quyết định nghiệp vụ mới.

Khi dự kiến cần nhiều phiên, nói rõ “phiên này ưu tiên giai đoạn X”, không hứa thực hiện ngầm sau khi phiên đã kết thúc. Nếu giữa quá trình mới thấy quá tải, cập nhật kế hoạch và checkpoint trước khi tiếp tục sửa rộng; không chờ công cụ từ chối vì hết hạn mức mới ghi tiến độ.

## Nguyên tắc chia nhỏ

- Chia theo nhóm nghiệp vụ và phụ thuộc trong task board; phủ đúng các operation được giao. Không thêm/bớt chức năng để một giai đoạn có vẻ hoàn tất.
- Ưu tiên lát công việc đi đủ validation → repository → service → controller → router → test cho một nhóm API. Không trải code dang dở trên toàn bộ role chỉ để ghi đã chạm mọi file.
- Mọi mutation vẫn giữ transaction nguyên tử. Giai đoạn không phải là cách tách approve và tạo residence thành hai lần ghi rời, hoặc bỏ kiểm tra cạnh tranh để làm sau.
- Không đánh dấu hoàn thành operation khi chỉ có mock/stub, thiếu wiring hoặc chưa chạy các test bắt buộc. Code đã viết nhưng chưa kiểm chứng phải ghi đúng tình trạng.
- Shared hoặc schema chưa sẵn: ghi phụ thuộc, nêu người cần điều phối; chỉ làm phần độc lập trong phạm vi đã giao. Việc chia giai đoạn không cấp thêm quyền sửa nền chung.
- Không tách lịch sử code thành bản sao `final.ts`, thư mục cá nhân hoặc câu trả lời chat. Code ở đúng module; tiến độ ghi tại task tương ứng.

## Ví dụ cho trọn role SV

Điều kiện: task SV-01 đã được giao đầy đủ; Shared auth, schema và dữ liệu test được kiểm tra trước tích hợp. Đây là gợi ý chia công việc, không là phân công người hoặc thay đổi contract.

| Giai đoạn | OperationId theo contract | Điều kiện kết thúc |
|---|---|---|
| SV-01/P1 — Hồ sơ và danh mục | `studentGetProfile`, `studentUpdateContact`, `studentListBuildings`, `studentListRooms`, `studentGetRoom`, `studentGetPeriod` | Đủ 6 API, allowlist/ownership/role/filter/response được kiểm; ghi riêng các test còn chờ nền |
| SV-01/P2 — Đăng ký và lưu trú | `studentCreateApplication`, `studentListApplications`, `studentGetApplication`, `studentListResidences`, `studentGetResidence` | Đủ 5 API; gửi đơn không giữ chỗ, ownership và trường hợp trùng/cạnh tranh đúng contract |
| SV-01/P3 — Phiếu thu và tích hợp | `studentListReceipts`, `studentGetReceipt` | Đủ 2 API; giữ khả năng đọc phiếu sau trả/hủy; review toàn bộ 13 API, chạy kiểm thử liên phần phù hợp và bàn giao |

P3 không hoãn kiểm thử của P1/P2 tới cuối. Nếu nhóm đang giao từng operation, chỉ lấy phần được giao từ ví dụ; không tự nhận cả 13 API.

## Ví dụ cho trọn role BQL

| Giai đoạn | OperationId theo contract | Phụ thuộc và kiểm chứng trọng tâm |
|---|---|---|
| BQL/P1 — Hồ sơ | `managementListProfiles`, `managementCreateProfile`, `managementGetProfile`, `managementUpdateProfile` | Auth/schema; mã trùng, field allowlist, thay đổi giới tính có hồ sơ mở |
| BQL/P2 — Tòa nhà, phòng và kỳ | `managementListBuildings`, `managementCreateBuilding`, `managementGetBuilding`, `managementUpdateBuilding`, `managementListRooms`, `managementCreateRoom`, `managementGetRoom`, `managementUpdateRoom`, `managementGetPeriod`, `managementUpdatePeriod` | Số chỗ, giới tính, giá, mở/đóng kỳ; có thể tách P2 nhỏ hơn nếu cần |
| BQL/P3 — Xét duyệt và lưu trú | `managementListApplications`, `managementGetApplication`, `managementApproveApplication`, `managementRejectApplication`, `managementListResidences`, `managementGetResidence`, `managementCheckIn`, `managementCancelAllocation`, `managementCheckOut` | Phòng/profile và đơn test; transaction, chỗ cuối, trạng thái, hủy/trả giữ lịch sử |
| BQL/P4 — Thu phí | `managementListReceipts`, `managementCreateReceipt`, `managementGetReceipt`, `managementPayReceipt` | Residence; snapshot tiền, phiếu trùng, xác nhận toàn bộ, giữ khoản phải thu |
| BQL/P5 — Thống kê và tích hợp | `managementGetStatistics` | Đúng 4 chỉ số SHOULD sau MUST, kiểm tra luồng liên phần và bàn giao toàn role |

Khối lượng BQL lớn hơn hai role còn lại, nên mặc định đề xuất nhiều giai đoạn khi được giao toàn bộ 28 API. Không gán tên thành viên hoặc tự chuyển API sang role khác để cân tải.

## Ví dụ cho trọn role ADMIN

| Giai đoạn | OperationId theo contract | Kiểm chứng trọng tâm |
|---|---|---|
| ADMIN/P1 — Tra cứu | `adminListAccounts`, `adminGetAccount`, `adminListProfileCandidates` | Namespace STUDENT/STAFF, metadata tối thiểu, không mở quyền nghiệp vụ |
| ADMIN/P2 — Cấp và khóa tài khoản | `adminCreateAccount`, `adminSetAccountLock` | Hồ sơ có trước, mật khẩu băm, role bất biến, khóa/mở/self-lock và hiệu lực request kế tiếp; review tích hợp |

Task nhỏ hơn có thể làm trong một phiên nếu đủ điều kiện. Auth 5 API là task Shared riêng: không gộp vào ADMIN/SV/BQL khi chưa được giao.

## Checkpoint và tiếp tục phiên sau

Dùng một hồ sơ tiến độ riêng: `Coordination/tasks/<TASK-ID>/progress.md` theo [mẫu checkpoint](progress-template.md). `<TASK-ID>` là mã task đã xác nhận, không ghi đè tiến độ của người khác. Cập nhật sau mỗi nhóm API đã kiểm tra, khi phát hiện phụ thuộc/lỗi lớn, trước đổi giai đoạn và trước kết thúc phiên; không chỉ ghi trong chat.

Checkpoint phải đủ để AI khác tiếp tục: revision/role/task/phạm vi, giai đoạn, operation đã làm, file/hàm/router, test thực tế, lỗi còn lại, thao tác đang dở, bước tiếp theo chính xác và quyết định chưa có. Không lưu mật khẩu, cookie/token, connection string thật hoặc log nhạy cảm.

Trước phiên mới: đọc AGENTS → task/kế hoạch → checkpoint → contract liên quan; kiểm tra `git status`/diff và code thực tế để xác nhận tiến độ. Checkpoint là thông tin bàn giao, không thay nguồn yêu cầu; khi trạng thái code khác mô tả, rà soát trước sửa. Không viết lại phần đã đúng, không ghi đè thay đổi mới, không mặc định mọi thứ trong checkpoint đã được kiểm thử.

Kết thúc một giai đoạn: báo rõ giai đoạn nào xong, kiểm chứng nào đạt/chưa chạy, phần nào còn lại và đề xuất lệnh giao việc tiếp. Hoàn thành một giai đoạn không đồng nghĩa hoàn thành role, task, tích hợp hoặc NFR. Nếu phiên bị ngắt đột ngột, phiên sau phục hồi từ checkpoint gần nhất cùng diff; không bảo đảm checkpoint cuối đã được ghi.
