# Danh mục công việc, phụ thuộc và lịch thực hiện

Trạng thái: **PLAN_RECONCILED** cho phạm vi kế hoạch. Tên thành viên, hướng phân công frontend/API, stack và deadline đã có từ Q-01..Q-04; Q-25..Q-27 đã được xác nhận tiếp theo tại [11-ANSWER-REVIEW.md](11-ANSWER-REVIEW.md). Giao từng gói API, người soạn schema, số giờ/tuần và lịch chi tiết bên dưới vẫn là **PROPOSED**. Lượt này chỉ hoàn thiện kế hoạch, không tạo contract/DDL/code.

Mốc chủ dự án cung cấp: tuần 03 - **26/09/2026** tới tuần 12 - **28/11/2026**; phải xong trước **20/12/2026**; báo cáo/nộp **23/12/2026**. Kế hoạch giữ **28/11** làm mục tiêu xong tính năng và **19/12** làm hết đệm nội bộ, không coi 20/12 là ngày được phép còn đang hoàn thiện tính năng.

## 1. Quy tắc đọc backlog

- `DOC-*`: công việc tạo bộ đặc tả khi có prompt tiếp theo. Việc hoàn thiện kế hoạch hiện tại không tự chuyển sang các task tạo contract/DDL này.
- `APP-*`: nền/API/kiểm thử/đóng gói tương lai; `FE-*`: frontend do Anh thực hiện. Chỉ triển khai sau khi có yêu cầu tương ứng.
- `TV1`: **Bùi Thế Anh**, frontend/điều phối/ownership/review/tích hợp. `TV2`: **Trần Quốc Vương**; `TV3`: **Nguyễn Đỗ Tuấn Kiệt**; `TV4`: **Trần Tuấn Kiệt** - ba thành viên làm API được Anh giao. Mã TV4 chuẩn hóa người thứ tư dù Q-04 lặp số “3”; không sửa câu trả lời gốc.
- `API-A`, `API-B`, `API-C` là **gói đề xuất, chưa gán cho TV2/TV3/TV4**, định nghĩa tại [06-COLLABORATION-PLAN.md](06-COLLABORATION-PLAN.md). `API-owner`/`DB-owner` là vị trí Anh sẽ giao cho đúng một người, chưa phải người đã nhận việc. Anh có thể tách/đổi nhóm để cân tải trước khi giao.
- Task chưa được giao khởi tạo `BACKLOG`. Không xem kế hoạch mô tả task là task đã hoàn tất. Mỗi task khi chuyển READY phải có đúng một owner cụ thể; người phối hợp và reviewer được ghi riêng.
- Quy mô XS/S/M/L là tương đối, dùng để chia nhỏ và bàn giao; không phải cam kết giờ làm chưa có dữ kiện.
- Q-25..Q-27 không còn blocker: mật khẩu băm, giữ đủ FR-01/FR-02; DB trực tiếp chỉ bootstrap/demo; role bất biến, kiểm tra role/ownership/locked mỗi API request bảo vệ và từ chối request tiếp theo nếu khóa. Áp dụng chuẩn chung tại [10-DECISIONS-AND-HANDOFF.md](10-DECISIONS-AND-HANDOFF.md), không dùng câu trả lời gốc đã bị làm rõ để cắt chức năng SRS.

## 2. Backlog tạo bộ đặc tả

| ID | Việc và đầu ra | Phụ thuộc | Owner / review đề xuất | Quy mô | Tiêu chí hoàn tất |
|---|---|---|---|---|---|
| DOC-01 | Tiếp nhận các quyết định đã hòa giải, xác định phạm vi bộ đặc tả được giao ở prompt tiếp theo | Kế hoạch này + prompt tạo đặc tả | TV1 / cả nhóm | M | Q→DEC có nguồn; phần xác nhận sau được áp dụng; không tự mở giai đoạn viết code |
| DOC-02 | Chuyển chuẩn chung thành glossary/status/ID/ngày/tiền/field definitions dùng cho đặc tả | DOC-01, sổ quyết định | TV1 điều phối / ba API owners sau khi giao | M | Một định nghĩa dùng chung, mapping tiếng Việt/giá trị kỹ thuật |
| DOC-03 | Ma trận role/operation/ownership, auth lifecycle | DOC-01/02, xác nhận Q-25..Q-27 | API-owner gói A, chưa giao / TV1 + một API reviewer | M | Kiểm tra role/ownership/locked tại API; role bất biến; mật khẩu băm; giữ đủ FR-01 |
| DOC-04 | Quy tắc QT-01..05 và validation dữ liệu nền | DOC-02/03, quyết định dữ liệu | API-owner gói A, chưa giao / TV1 + reviewer liên quan | M | Giữ đầy đủ FR-01/FR-02; catalog điều kiện/lỗi, nguồn, test và nơi cưỡng chế |
| DOC-05 | Quy tắc QT-06..13: đăng ký, xếp, lưu trú | DOC-02/03, quyết định kỳ/ngày | API-owner gói B, chưa giao / TV1 + reviewer gói A/C | L | Transition hợp lệ + forbidden, giữ/giải phóng chỗ, cạnh tranh |
| DOC-06 | Quy tắc QT-14..17: phiếu/tiền/thống kê | DOC-02, Q-14/22 đã đồng ý đề xuất | API-owner gói C, chưa giao / TV1 + reviewer gói B | M | Snapshot giá, 1 phiếu/hồ sơ, giữ nợ sau trả/hủy; bốn chỉ số SRS sau MUST |
| DOC-07 | Logical model, ERD, dictionary/FK/constraints/indexes | DOC-02/04/05/06 | DB-owner do TV1 giao / TV1 + API reviewer khác | L | Các entity/cardinality/field đủ; tài khoản liên kết hồ sơ theo QT-02; không CHECK sai ràng buộc liên dòng |
| DOC-08 | Soạn `SQL/schema.sql` + policy migration/locking | DOC-07, PostgreSQL 18.6 và chuẩn tại sổ quyết định | DB-owner do TV1 giao / TV1 + API reviewer khác | L | DDL đầy đủ, có cơ chế chống trùng/quá chỗ và không mất lịch sử |
| DOC-09 | API Shared auth/conventions/errors/DTO/retry | DOC-02/03 và chuẩn API chung | API-owner gói A, chưa giao / TV1 + owners gói B/C | L | Một schema dùng chung; các gói không có auth/DB độc lập |
| DOC-10 | API Student Markdown, mỗi operation có mục riêng trong file nhóm theo cây 02 | DOC-04/05/06/09, quyết định thông tin lưu trú | TV1 điều phối / API owners góp/rà phần của mình | M | Đủ hồ sơ/phòng/đơn/lưu trú/phiếu; field allowlist; owner từng operation rõ |
| DOC-11 | API BQL Markdown, mỗi operation có mục riêng trong file nhóm theo cây 02 | DOC-04/05/06/08/09 | TV1 điều phối / API owners góp/rà phần của mình | L | Giữ tạo/quản lý hồ sơ FR-02; thao tác ghi nêu atomicity, lỗi/retry và trạng thái |
| DOC-12 | API System Admin Markdown | DOC-03/09, xác nhận Q-26/27 | API-owner gói A, chưa giao / TV1 + một API reviewer | M | Giữ cấp/khóa/mở khóa theo SRS; cấp SV theo hồ sơ có trước; không endpoint đổi role sau tạo |
| DOC-13 | AGENTS/README mỗi phần, ownership, task/handoff template | DOC-01, mô hình Q-04 | TV1 / cả nhóm | M | Biết đọc/sửa gì, không tự merge, phần riêng bàn giao cho Anh, không tự commit |
| DOC-14 | Traceability FR/QT/UC→operation→schema→test | DOC-08/10/11/12 | TV1 điều phối / cả nhóm | L | Phủ 27 UC đúng nghĩa, 17 QT và 8 FR; chức năng bị làm rõ có quyết định nguồn |
| DOC-15 | Review chéo, kiểm chứng DDL/links, bàn giao bộ đặc tả | DOC-08..14 | TV1 / cả nhóm | M | Không lệch naming/enum/quyền; NOT_RUN minh bạch; không tự commit |

Các owner theo gói chỉ là vị trí công việc cần Anh phân công, không phải ba thành viên đã mặc nhiên nhận A/B/C. Task không chuyển READY khi owner chưa có tên cụ thể. DOC-07 và bản nháp API có thể nghiên cứu song song sau DOC-02/03. Chỉ chốt DOC-08/10/11/12 khi các quy tắc liên quan đã thống nhất. Task L cần tách tiếp theo dữ liệu/operation mà vẫn giữ owner và reviewer.

## 3. Backlog nền/API để nhóm chuẩn bị phân việc

| ID | Lát chức năng và đầu ra tương lai | Phụ thuộc | Owner / review đề xuất | Hoàn tất khi |
|---|---|---|---|---|
| APP-01 | Khung Next.js/Express.js/PostgreSQL và cấu hình chạy trên máy nhóm | Bộ đặc tả, chuẩn source, yêu cầu viết app | TV1 điều phối; người viết nền API/DB do Anh giao / một API reviewer | Một app Express, một schema/auth chung; config không có secret; Anh không phải người mặc nhiên viết mọi API |
| APP-02 | Schema/migrations + seed giả + cách dựng DB test | APP-01,DOC-08 | DB-owner do TV1 giao / TV1 + API reviewer khác | PostgreSQL đúng phiên bản; unique/FK/constraints được kiểm chứng; bootstrap/demo không thay API nghiệp vụ |
| APP-03 | API login/logout/change password + auth guards | APP-01/02,DOC-03/09 | API-owner gói A, chưa giao / TV1 + API reviewer khác | Mật khẩu băm; session theo chuẩn chung; role/ownership/locked kiểm tra request; TC-01.3/NFR-01 |
| APP-04 | API BQL tạo/tìm/sửa hồ sơ + sinh viên xem/sửa liên hệ | APP-02/03,DOC-04/10/11 | API-owner gói A, chưa giao / TV1 + API reviewer khác | TC-02.1/02.2 đạt; field ngoài quyền không sửa; giữ đủ FR-02 theo Q-26 |
| APP-05 | API Admin cấp tài khoản/gán role lúc tạo/khóa/mở khóa | APP-03/04,DOC-12 | API-owner gói A, chưa giao / TV1 + API reviewer khác | TC-01.1/01.2; hồ sơ SV có trước; role bất biến; khóa từ chối request bảo vệ tiếp theo; không cần sự kiện đẩy |
| APP-06 | API tòa nhà/phòng, tìm kiếm và số chỗ | APP-02/03,DOC-04 | API-owner gói A, chưa giao / TV1 + reviewer gói B | TC-03.1..03.3; số chỗ tính từ dữ liệu chuẩn phía server, không do client tự đếm |
| APP-07 | API kỳ + gửi/theo dõi đơn | APP-03/04/06,DOC-05 | API-owner gói B, chưa giao / TV1 + reviewer gói A | TC-04.1/04.2, gửi lặp và đóng kỳ cạnh tranh theo contract |
| APP-08 | API BQL duyệt/từ chối/xếp phòng | APP-07,DOC-05/08/11 | API-owner gói B, chưa giao / TV1 + reviewer gói A/C | TC-05.1..05.3 + chỗ cuối/đơn cạnh tranh, transaction rollback |
| APP-09 | API nhận/hủy xếp/trả phòng, lịch sử | APP-08,DOC-05 | API-owner gói B, chưa giao / TV1 + reviewer gói C | TC-06.1..06.3, retry không tăng chỗ lặp, lịch sử còn |
| APP-10 | API lập phiếu, xác nhận đủ tiền, tra cứu riêng | APP-08,DOC-06 | API-owner gói C, chưa giao / TV1 + reviewer gói B | TC-07.1/07.2 + snapshot, trùng phiếu, giữ nợ sau kết thúc |
| APP-11 | API thống kê đúng bốn chỉ số SHOULD, làm sau MUST | APP-06/09/10, Q-22 đã đồng ý đề xuất | API-owner gói C, chưa giao / TV1 + reviewer gói A/B | TC-08.1; cùng định nghĩa đếm; nếu lịch buộc hoãn phải có quyết định mới |
| APP-12 | E2E/quyền/khóa/cạnh tranh/hiệu năng | Từng API APP-03..10 + frontend liên quan; APP-11 khi đã có | TV1 điều phối; từng test giao đúng một người / cả nhóm | TC-N1/TC-N2 + test bắt buộc có bằng chứng trên app đã tích hợp |
| APP-13 | Đóng gói Docker/Compose cuối dự án, README cài sạch, demo/bàn giao | APP-01..10, APP-12, FE-01..04; APP-11 theo phạm vi cuối | TV1 điều phối; người viết cấu hình do Anh giao / người dựng máy sạch | TC-N3; tối đa 2 lệnh; dữ liệu giữ khi restart; không tự triển khai internet |

Mỗi API-owner chỉ nhận phần riêng được Anh giao, tự kiểm thử và bàn giao. Không tự merge code của thành viên khác, không tạo backend/schema/auth riêng theo người. Anh nhận bàn giao, kiểm tra và tích hợp thủ công; mỗi thành viên vẫn có thể review qua GitHub. Phân công theo tên cho các gói A/B/C chưa được thực hiện trong kế hoạch này.

### Frontend do Bùi Thế Anh thực hiện

| ID | Đầu ra đề xuất | Phụ thuộc | Owner / review | Tiêu chí hoàn tất |
|---|---|---|---|---|
| FE-01 | Khung giao diện, đăng nhập/đăng xuất/đổi mật khẩu, trạng thái phiên và điều hướng theo role | APP-01/03 + contract auth | TV1 / người viết API auth | Dùng API thật; role không chỉ kiểm tra ở UI; request bị khóa/hết phiên đưa về luồng phù hợp |
| FE-02 | Giao diện sinh viên: hồ sơ/liên hệ, phòng, đơn, lưu trú và khoản phí riêng | API tương ứng trong APP-04/06..10 | TV1 / các API owners liên quan | Không sửa trường ngoài quyền, không xem dữ liệu người khác; hiển thị loading/empty/error và kết quả nghiệp vụ |
| FE-03 | Giao diện BQL: hồ sơ, tòa/phòng, kỳ, duyệt, lưu trú, thu phí; thống kê sau MUST | APP-04/06..11 | TV1 / các API owners liên quan | Thao tác qua API đã bàn giao; hiển thị lỗi/sức chứa/trạng thái đúng contract |
| FE-04 | Giao diện Admin cấp/khóa/mở khóa tài khoản, role chỉ gán khi tạo | APP-05 | TV1 / người viết API quản trị | Không lộ quyền nghiệp vụ BQL; sinh viên được cấp theo hồ sơ có trước; khóa được kiểm tra ở API |

Anh làm frontend theo các API đã bàn giao; không bắt buộc chờ tất cả API mới bắt đầu ghép màn hình. Nếu cần đổi API cho phù hợp frontend, cập nhật quyết định/contract/test và báo lại người phụ trách qua quy trình nhóm trước khi họ làm tiếp. Không chỉnh lặng một phía để giao diện chạy.

## 4. Đường phụ thuộc chính

```text
Kế hoạch đã hòa giải + prompt tạo đặc tả tiếp theo
    -> Quyết định + thuật ngữ/quyền
        -> Business Rules <-> API <-> SQL
            -> Anh review đặc tả, giao gói API cho TV2/TV3/TV4
                -> Nền chung + tài khoản/hồ sơ/phòng
                    -> Đăng ký -> Duyệt/xếp -> Nhận/trả
                                         -> Phiếu/thu phí -> Thống kê
                -> Thành viên bàn giao từng phần API riêng
                    -> Anh tích hợp thủ công + tạo frontend tương ứng
                        -> Kiểm thử xuyên suốt -> Docker cuối dự án -> demo/nộp
```

Mỗi phần bàn giao dùng một backend Express.js, schema và auth chung. Có thể bàn giao API theo nhiều lô để Anh ghép frontend dần; không tự diễn giải “phần riêng” thành một server độc lập cho mỗi người. Tài liệu contract/fixture dùng chung giúp chuẩn bị frontend, nhưng chỉ công nhận luồng hoàn tất sau khi Anh ghép với API thật và kiểm chứng.

## 5. Lịch theo ngày và các mốc đã có

**Ngày lập/cập nhật kế hoạch: 30/10/2026**, theo múi giờ người dùng. SRS ghi 10 tuần; Q-03 xác định tuần 03 tới tuần 12 với mốc ngày cụ thể, không còn nguyên 10 tuần để bắt đầu lại. Từ 30/10 tới 28/11 là 29 ngày; tới 19/12 là 50 ngày; nộp 23/12 là 54 ngày. Đây là khoảng cách ngày, không phải số ngày công hoặc cam kết số giờ của thành viên.

Suy theo khoảng cách 7 ngày giữa các mốc từ tuần 03 = 26/09 tới tuần 12 = 28/11: tuần 04 = 03/10, tuần 05 = 10/10, tuần 06 = 17/10, tuần 07 = 24/10, tuần 08 = 31/10, tuần 09 = 07/11, tuần 10 = 14/11, tuần 11 = 21/11. Các mốc giữa là phép quy đổi lịch để tham khảo, không phải lịch từng tuần đã được giảng viên xác nhận. Nhóm tự mô tả đang ở tuần 8; dùng ngày cụ thể làm căn cứ giao mốc, không để chênh một ngày của nhãn tuần chặn hoàn thiện kế hoạch.

| Khoảng ngày năm 2026 | Trọng tâm đề xuất | Owner điều phối / người thực hiện | Cổng kiểm tra/đầu ra mục tiêu |
|---|---|---|---|
| 30/10-01/11 | Hoàn thiện kế hoạch, nguồn quyết định, rà Q-25..Q-27; chuẩn bị giao gói API | Anh review/điều phối; AI hỗ trợ trong phạm vi kế hoạch | PLAN_RECONCILED; chưa có contract/DDL/code; không còn blocker ba xác nhận |
| 02/11-07/11 | Sau prompt cho phép: bộ đặc tả, schema và quy tắc chung; giao tên cụ thể cho task; khung app nếu đã được yêu cầu triển khai | Anh review; API/DB owners được giao thực hiện | DOC-15; contracts/schema/auth chung; nền Next.js/Express.js/PostgreSQL khi được giao viết code |
| 08/11-14/11 | API lô 1: xác thực, tài khoản, hồ sơ, tòa/phòng; Anh nhận bàn giao và làm frontend tương ứng | Ba thành viên theo task API được giao; Anh frontend/tích hợp | TC-01/02/03 và khóa request; frontend gọi các API thật đã bàn giao |
| 15/11-21/11 | Kỳ, đăng ký, duyệt/xếp phòng, nhận/hủy/trả; ghép UI theo lô API | API-owner gói B phối hợp gói A/C; Anh frontend/tích hợp | TC-04/05/06; cạnh tranh chỗ cuối; không trùng hồ sơ, không trả chỗ lặp |
| 22/11-28/11 | Phiếu/thu phí, bốn chỉ số thống kê sau MUST; hoàn tất frontend và ghép các luồng | API-owner gói C và người làm task còn lại; Anh frontend/review | **28/11 mục tiêu hoàn tất tính năng**; TC-07/08; luồng ba role chạy với API/DB thật |
| 29/11-05/12 | Kiểm thử hệ thống/NFR, xử lý lỗi liên phần; đóng gói Docker/Compose cuối dự án và thử cài sạch lần đầu | Anh điều phối; mỗi người sửa phần mình; người viết cấu hình được giao riêng | TC-N1/TC-N2 và thử TC-N3; không đợi sát ngày nộp mới biết lỗi đóng gói |
| 06/12-12/12 | Hoàn thiện tài liệu/báo cáo, ứng viên bàn giao, cài sạch và demo | Anh điều phối; cả nhóm rà theo phần việc | Bằng chứng nghiệm thu, README đúng môi trường, danh sách lỗi/hạn chế |
| 13/12-19/12 | Đệm sửa lỗi, review cuối, đóng gói và diễn tập | Anh kiểm tra/tích hợp thủ công; người phụ trách lỗi sửa | **Hết 19/12 phải hoàn tất** để đáp ứng yêu cầu xong trước 20/12 |
| 20/12-22/12 | Kiểm tra gói đã hoàn tất, chuẩn bị nộp/báo cáo và diễn tập | Anh điều phối; cả nhóm | Không dành đây làm quỹ viết tính năng còn thiếu; xử lý lỗi bất ngờ bằng quyết định có phạm vi |
| 23/12 | Báo cáo và nộp đồ án | Chủ dự án/nhóm tự thực hiện | Gói nộp, minh chứng và nguồn đúng phiên bản do nhóm chọn |

Lịch chi tiết là **PROPOSED**, phụ thuộc prompt cho từng giai đoạn và giờ làm thực tế; chưa phải giao việc có cam kết ngày cho TV2/TV3/TV4. Nếu chốt đặc tả muộn hoặc tiến độ hụt, Anh điều chỉnh ngay task và khối lượng, không tự dời mốc 28/11 hoặc hạn trước 20/12.

Q-22 đã đồng ý đưa đúng bốn chỉ số thống kê sau MUST. Nếu cần hoãn để bảo vệ hạn MUST, phải ghi quyết định mới; không âm thầm coi SHOULD đã hoãn. Không loại kiểm tra quyền, khóa, chống quá chỗ, chống trùng hoặc giữ lịch sử để đổi lấy tiến độ màn hình.

Q-01/Q-02 chọn đóng gói Docker vào cuối dự án; bảng đặt công việc đóng gói sau mốc tính năng 28/11. Chuẩn bị cấu hình Docker sớm hoặc thử đóng gói một luồng nhỏ trước đó là **đề xuất tùy chọn giảm rủi ro**, không phải chủ dự án đã yêu cầu Docker từ đầu. Các thành viên có thể phát triển trên máy riêng với PostgreSQL local; phiên bản/cấu hình phải khớp chuẩn chung, và cuối cùng vẫn phải đạt TC-N3.

## 6. Cập nhật task khi bắt đầu làm

Mỗi task phải được cụ thể hóa bằng mẫu tại kế hoạch cộng tác: tên người thật được Anh giao, file sở hữu, quyết định áp dụng, bản contract dùng, checklist nghiệm thu và thời điểm bàn giao. Danh sách tên đã có, nhưng chưa suy ra ai làm gói A/B/C. Không giao bằng câu "làm phần Sinh viên" vì một role dùng nhiều nhóm API và các phần DTO/auth/phòng là dùng chung.

Trạng thái chuẩn theo `06-COLLABORATION-PLAN.md`: `BACKLOG → READY → IN_PROGRESS → READY_FOR_REVIEW → READY_FOR_OWNER → DONE`. Nhánh xử lý gồm `BLOCKED`, `CHANGES_REQUESTED`, `CANCELLED`; việc hoãn giữ ở BACKLOG kèm quyết định và mốc xem lại. DONE yêu cầu kiểm chứng phù hợp và bàn giao; không yêu cầu AI tự commit.

## 7. Rà soát nhịp làm việc

- Trước vòng làm việc: chọn task READY, kiểm tra file bị đụng nhau và quyết định mới.
- Khi thay đổi contract: thông báo nội dung qua chủ dự án/nhóm theo quy trình thống nhất; không tự gửi tin hoặc tạo tác vụ ngoài repo.
- Cuối vòng: ghi kết quả, NOT_RUN/FAIL/PASS, ảnh hưởng consumer và task tiếp theo.
- Khi tích hợp: Anh đối chiếu cùng phiên bản API/DDL/rules và nhận phần API riêng; thành viên/AI không merge code của người khác. Anh chạy luồng liên quan trên máy mình, thực hiện tích hợp và các thao tác Git thủ công.
