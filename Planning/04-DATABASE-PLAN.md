# Kế hoạch thiết kế PostgreSQL

Trạng thái: **PLAN_RECONCILED / AWAITING_SPECIFICATION_TASK**. Đã đối chiếu Q-01..Q-27; không còn câu hỏi chặn kế hoạch. Các yêu cầu SRS gốc vẫn là **BASELINE**, không bị xóa bởi diễn giải câu trả lời. `OWNER_CONFIRMED` là lựa chọn chủ dự án đã xác nhận; `DELEGATED_SELECTION` là lựa chọn kỹ thuật chung theo ủy quyền, không phải chi tiết do chủ dự án đích thân chọn. Null/length và chi tiết chưa nằm trong baseline vẫn ghi **PROPOSED**. Chưa có schema/contract thực thi.

Đọc cùng [SRS baseline](01-SRS-BASELINE.md), [kế hoạch API](03-API-PLAN.md), [kế hoạch quy tắc](05-BUSINESS-RULES-PLAN.md), [file câu trả lời](09-OWNER-QUESTIONS.md) và [baseline kỹ thuật chung](12-SHARED-TECHNICAL-BASELINE.md). Chưa tạo `SQL/schema.sql` trong đợt này.

## 0. Đối chiếu câu trả lời và giới hạn áp dụng

| Chủ đề | Đã tiếp nhận | Cách dùng trong kế hoạch |
|---|---|---|
| Stack | Q-01: Next.js frontend, Express.js API, PostgreSQL; nhóm phát triển local, đóng gói Docker cuối đợt | `OWNER_CONFIRMED`; PostgreSQL **18.6** được freeze sau đối chiếu phiên bản stable, không dùng tag động `latest`; công cụ migration cụ thể theo baseline kỹ thuật, không để từng máy tự chọn |
| Đăng nhập và role | Q-05: sinh viên đăng nhập bằng mã sinh viên; ba mã `SV`, `BQL`, `ADMIN`; Q-07: role không thay đổi sau tạo | `OWNER_CONFIRMED`; không tạo API đổi role sau cấp hoặc mô hình đa role |
| Hai kho đăng nhập | Giữ ưu tiên hai kho credentials từ Q-05, với hồ sơ có trước tài khoản theo Q-26 | `DELEGATED_SELECTION`: `student_profiles` không chứa mật khẩu; hai kho đăng nhập là `student_accounts` và `staff_accounts`. Không tự đổi sang một bảng accounts chung |
| Mật khẩu | Q-25 xác nhận giữ băm theo SRS; nhập demo qua script tạo hash | `OWNER_CONFIRMED`; đề nghị plaintext Q-05/Q-18 đã **SUPERSEDED** về phần này, NFR-01/TC-N1 giữ nguyên |
| Nhập DB và hồ sơ-tài khoản | Q-26 xác nhận nhập trực tiếp chỉ cho demo; giữ đầy đủ FR-01/FR-02/QT-02 | `OWNER_CONFIRMED`; BQL tạo hồ sơ trước, Admin cấp tài khoản sau; câu Q-18 "có hồ sơ là có tài khoản" đã **SUPERSEDED** |
| Kiểm quyền và khóa | Q-27 xác nhận API kiểm tra role/ownership/locked trên mỗi request bảo vệ | `OWNER_CONFIRMED`; request bảo vệ tiếp theo của account khóa bị từ chối; không cần push logout tức thời. Không dùng UI làm nơi kiểm quyền duy nhất |
| Khóa quản trị | Q-17 cho admin tự khóa, không cần bảo vệ admin hoạt động cuối cùng, có thể sửa DB để khôi phục | `OWNER_CONFIRMED`; bỏ đề xuất last-admin guard trước đó, vẫn giữ dữ liệu và có trường khóa cho mọi loại tài khoản |
| Hồ sơ bổ sung | Q-18 nêu ngày sinh và địa chỉ thường trú; Q-08 chấp nhận phần tối thiểu | `OWNER_CONFIRMED` về sự có mặt hai trường bổ sung; giữ đầy đủ trường SRS, chưa coi nullability/length là đã được chủ dự án chọn |

Kết quả đối chiếu Q-25..Q-27 được giữ cùng [sổ quyết định](10-DECISIONS-AND-HANDOFF.md); đọc câu trả lời cũ phải kèm trạng thái bị thay thế, không tái đưa plaintext/DB-only vào thiết kế. Các lựa chọn kỹ thuật dùng chung nằm tại baseline 12. Mọi file thực tế vẫn chỉ là tài liệu kế hoạch, chưa có DDL, migration hoặc contract thực thi.

## 1. Mục tiêu và giới hạn

Luồng BASELINE của SRS được giữ theo Q-26: BQL tạo hồ sơ sinh viên -> Admin cấp tài khoản -> mở kỳ -> gửi đơn -> duyệt/xếp phòng hoặc từ chối -> nhận phòng/hủy xếp phòng -> lập phiếu/ghi nhận đủ tiền -> trả phòng -> tra cứu lịch sử. Nhập DB/seed là cách dựng dữ liệu demo, không thay các API quản lý tài khoản/hồ sơ bắt buộc. Thu phí có thể diễn ra khi đã xếp phòng hoặc đang ở, không bắt buộc phải sau nhận phòng.

Database cần bảo vệ dữ liệu khi nhiều request xảy ra đồng thời, không chỉ khi giao diện gọi đúng thứ tự. Cần chỉ rõ bất biến nào do ràng buộc SQL, bất biến nào cần transaction hoặc cơ chế ghi được kiểm soát, và trường hợp nào phải kiểm tra ở API. Frontend không phải nơi bảo vệ bất biến.

Không thiết kế thêm thanh toán trực tuyến, điện nước, nhiều đợt thanh toán, hoàn tiền, chuyển phòng, gia hạn, nhiều ký túc xá hoặc xử lý nhiều kỳ đồng thời. Không biến yêu cầu lưu lịch sử thành quyền xóa rồi tạo lại bản ghi.

## 2. Đầu ra của bước thiết kế sau khi được yêu cầu thực hiện

| Đầu ra dự kiến | Nội dung bắt buộc | Tiêu chí rà soát |
|---|---|---|
| `SQL/AGENTS.md` | Trách nhiệm phần dữ liệu; bất biến; quy trình thay đổi schema; giới hạn không commit | AI khác biết đọc gì, sửa gì và kiểm tra gì |
| `SQL/README.md` | Cách đọc bộ tài liệu, cách dựng DB, thứ tự chạy, nguồn schema chuẩn | Không có hai cách dựng cho ra hai schema khác nhau |
| `SQL/schema.sql` | DDL đầy đủ cho database mới: bảng, khóa, index, constraint và cơ chế SQL đã chốt | Dựng được DB trống, không kèm dữ liệu thật hay bí mật |
| `SQL/01-data-dictionary.md` | Mỗi trường: ý nghĩa, kiểu, null/default, quyền ghi, nguồn, validation, liên kết API | Không bỏ sót cột trong schema hoặc trường API ghi xuống DB |
| `SQL/02-relationships.md` | ERD, lực lượng liên kết, vòng đời và chính sách xóa | Một đơn được duyệt liên kết được đúng hồ sơ đã tạo |
| `SQL/03-constraints-and-indexes.md` | Bất biến, nơi thực thi, khóa, constraint, index và truy vấn liên quan | Có cơ chế DB bảo vệ các tính duy nhất và dữ liệu hợp lệ |
| `SQL/04-transactions-and-locking.md` | Ranh giới nguyên tử, thứ tự khóa, cạnh tranh, lỗi/rollback và retry | Có bằng chứng chống vượt chỗ và trùng phiếu khi đồng thời |
| `SQL/05-migration-policy.md` | Công cụ đã chọn, thứ tự migration, nguồn chuẩn, nâng cấp database có dữ liệu | Snapshot schema và migration không lệch nhau |
| `SQL/06-schema-verification.md` | Danh mục kiểm tra cấu trúc, dữ liệu, đồng thời, migration | Ghi rõ kiểm tra nào đã chạy, môi trường và kết quả |
| `SQL/seeds/` được nhận về phạm vi tài liệu tại Q-24 | Kịch bản dữ liệu giả, ba role, trạng thái, quy mô kiểm thử tải | Dùng hash theo Q-25, hồ sơ trước account theo Q-26; có thể tái tạo các AC/NFR mà không dùng dữ liệu thật |

Đây là danh sách đầu ra tương lai theo [cây thư mục chuẩn của kế hoạch](02-TARGET-STRUCTURE.md); việc ghi đường dẫn không có nghĩa các file đó đã tồn tại. Q-24 đã chấp nhận đề xuất đầu ra bổ sung; script/seed cụ thể chỉ tạo ở đợt được giao viết bộ đặc tả hoặc triển khai, sau khi công cụ/migration và các quyết định phạm vi liên quan được chốt. Ràng buộc/index thuộc `SQL/03-constraints-and-indexes.md`; protocol ghi/khóa thuộc `SQL/04-transactions-and-locking.md`, dẫn chiếu nhau thay vì định nghĩa trùng.

## 3. Mô hình khái niệm để rà soát

Các entity nghiệp vụ là mô hình cần đặc tả sau; ba tên `student_profiles`, `student_accounts`, `staff_accounts` là lựa chọn kỹ thuật chung để giữ hai kho đăng nhập mà vẫn tách hồ sơ/account theo Q-26. Không dùng bảng kế hoạch này như DDL hoàn chỉnh.

| Thực thể đề xuất | Trách nhiệm | Quan hệ dự kiến | Căn cứ |
|---|---|---|---|
| `student_profiles` | Danh tính, liên hệ, ngày sinh và địa chỉ sinh viên; **không chứa mật khẩu** | Hồ sơ có trước; 0..1 account SV; nhiều đơn/lịch sử | FR-02, QT-02/03; Q-18/Q-26 |
| `student_accounts` | Credentials băm và trạng thái khóa của tài khoản sinh viên | Trỏ một hồ sơ có trước bằng `student_id` duy nhất; role cố định `SV` | FR-01, QT-02; Q-25/Q-26; DELEGATED_SELECTION |
| `staff_accounts` | Kho credentials BQL/Admin theo ưu tiên hai kho; role và trạng thái khóa | Role cố định `BQL` hoặc `ADMIN`; không cần hồ sơ SV | FR-01; Q-05/Q-07/Q-17; DELEGATED_SELECTION |
| `buildings` | Danh mục tòa nhà thuộc một KTX | Một tòa có nhiều phòng | FR-03 |
| `rooms` | Sức chứa, giới tính tiếp nhận, mức phí/kỳ/người, trạng thái | Thuộc một tòa; nhiều nguyện vọng và hồ sơ theo thời gian | FR-03, QT-04/05 |
| `registration_period` | Trạng thái mở/đóng của kỳ hệ thống đang xử lý | Liên kết đơn nếu mô hình đã chốt cần lưu định danh kỳ | FR-04, QT-06 |
| `applications` | Đơn của sinh viên và phòng nguyện vọng | Nhiều đơn theo lịch sử; tối đa một đơn chờ/sinh viên | FR-04/05, QT-07/09 |
| `residence_records` | Một lần xếp phòng/lưu trú của sinh viên | Một đơn được duyệt tạo tối đa một hồ sơ; phòng thực tế có thể khác nguyện vọng | FR-05/06, QT-10..13 |
| `room_fee_receipts` | Khoản tiền phòng đã chốt và tình trạng thanh toán | Tối đa một phiếu trên một hồ sơ, dù hồ sơ đã hủy/kết thúc | FR-07, QT-14..16 |
| Session store theo baseline kỹ thuật | Hết hạn/thu hồi và gắn đúng identity từ một trong hai kho, không JWT/refresh token | Principal dùng `actorKind` STUDENT/STAFF + `accountId`; session không hoạt động 30 phút; kiểm tra khóa trên mỗi request bảo vệ | NFR-01; Q-05/Q-17/Q-27; baseline 12 |
| Trường ngày/người thao tác tối thiểu | Giữ ngày nhận/trả và ngày/người xác nhận tiền theo SRS | Q-19 nhận mức tối thiểu; chưa thêm bảng audit riêng hay lưu mọi request | SRS; Q-19 |

Q-11 đã nhận đề xuất **một kỳ trong prototype**, mở/đóng thủ công, được duyệt đơn đã gửi sau đóng và mở lại cùng kỳ; không đa kỳ, không tự mở/đóng theo lịch. **PROPOSED kỹ thuật:** một bản ghi cấu hình kỳ duy nhất, có định danh nội bộ cố định để đơn tham chiếu; tên hiển thị nếu cần không biến thành quản lý nhiều kỳ.

Mã sinh viên là business key duy nhất, không dùng tên sinh viên làm khóa; Q-10 đã nhận nguyên tắc tách ID kỹ thuật và mã nghiệp vụ. Theo lựa chọn kỹ thuật được ủy quyền tại baseline 12: ID nội bộ dùng UUID; mã SV là chuỗi trim + uppercase duy nhất; mã tòa duy nhất; mã phòng duy nhất theo cặp `(building_id, code)`; mã nghiệp vụ bất biến sau tạo. Đây là **DELEGATED_SELECTION**, không ghi chủ dự án đích thân chọn phạm vi unique từng mã.

## 4. Kế hoạch từ điển dữ liệu và quyền ghi

### 4.1. Hồ sơ và tài khoản

| Nhóm dữ liệu | Tối thiểu phải đặc tả | Quyền tạo/sửa theo SRS | Điều cần chốt |
|---|---|---|---|
| Hồ sơ sinh viên | Mã sinh viên, họ tên, giới tính, lớp, khoa, điện thoại, email; thêm ngày sinh/địa chỉ thường trú theo Q-18 | BQL tạo/sửa; SV chỉ sửa liên hệ mình; nhập DB demo không thay API theo Q-26 | Null/length còn là đề xuất dictionary; không thêm quyền SV sửa ngày sinh/địa chỉ |
| Liên kết tài khoản | Hồ sơ có trước; một hồ sơ tối đa một student account | Admin cấp account theo hồ sơ có sẵn; không tự cấp khi thêm hồ sơ | `student_accounts.student_id` duy nhất; principal phân biệt hai kho, không coi actorKind là role thứ tư |
| Đăng nhập | SV dùng mã sinh viên; BQL/Admin có username; hash, role `SV`/`BQL`/`ADMIN`, trạng thái khóa | Role chỉ gán khi tạo; admin được tự khóa, không last-admin guard | Giữ API đổi mật khẩu/cấp/khóa/mở theo FR-01; role/ownership/locked kiểm tại API mỗi request bảo vệ |
| Truy vết | Các ngày/người thao tác SRS bắt buộc; lý do/người/thời điểm hủy theo Q-16 | Server ghi actor/thời điểm, không tin actor ID tự khai từ client | Không thêm bảng audit riêng hoặc soft-delete đại trà theo Q-19 |

Q-08 nhận đề xuất tách lớp/khoa, điện thoại dạng chuỗi, không mặc định email duy nhất; chưa thêm CCCD/ảnh/giấy tờ. Q-18 cụ thể thêm ngày sinh và địa chỉ, được ưu tiên hơn phần "chỉ tối thiểu" chung tại Q-08. **PROPOSED dictionary để rà soát:** mã SV chuỗi tối đa 32, họ tên 150, lớp 64, khoa 150, điện thoại 32, email 254, địa chỉ 500; ngày sinh dạng ngày. Điện thoại/email/ngày sinh/địa chỉ có thể nullable trong phương án đề xuất; chưa coi nullability hoặc độ dài nào là owner-confirmed. Giới tính theo **DELEGATED_SELECTION** dùng `MALE`/`FEMALE` cho prototype, từ ví dụ SRS; không nói đây là domain đầy đủ do chủ dự án chọn, không tự thêm MIXED. Q-09 giữ kiểm tra tương thích khi sửa dữ liệu và lúc duyệt.

Mật khẩu, hash và credential nội bộ không xuất trong DTO hồ sơ, response danh sách/chi tiết hoặc log. Không đưa credential thật vào seed chia sẻ. NFR-01 và Q-25 cùng yêu cầu băm; công cụ nhập/seed demo dùng cơ chế tạo hash của ứng dụng được ghi rõ, không lưu plaintext. Hash giả cho tài khoản demo được phép tạo qua cơ chế seed an toàn.

### 4.2. Tòa nhà, phòng, kỳ

| Nhóm | Dữ liệu cần đặc tả | Quyền ghi | Điều chưa chốt |
|---|---|---|---|
| Tòa nhà | UUID, mã duy nhất, tên | Ban quản lý | Độ dài/tên trường dictionary còn đề xuất; không mặc định DELETE theo Q-19 |
| Phòng | UUID, mã duy nhất trong tòa, sức chứa, giới tính tiếp nhận, phí VND, trạng thái | Ban quản lý | Chặn sửa gây không tương thích khi có hồ sơ mở; capacity không dưới chỗ đã phân bổ; mã bất biến |
| Sức chứa/chỗ | Sức chứa là dữ liệu ghi; đã phân bổ và còn chỗ là giá trị tính hoặc được duy trì có kiểm soát | Server kiểm soát | Chọn cách tính, hiệu năng và cách đồng bộ; không cho client ghi `remaining_slots` |
| Kỳ đăng ký | Một kỳ; mở/đóng thủ công, được mở lại; vẫn xử lý đơn chờ sau đóng | Ban quản lý | Tên/ID kỹ thuật/mốc lưu dữ liệu là đề xuất; không tự thêm lịch hoặc nhiều kỳ |

Q-15 nhận nguyên tắc tách ngày nghiệp vụ khỏi timestamp thao tác server và thống nhất múi giờ Việt Nam. Theo **DELEGATED_SELECTION** tại baseline 12: ngày nghiệp vụ dùng `DATE` theo `Asia/Ho_Chi_Minh`; server audit dùng `TIMESTAMPTZ`, trao đổi/lưu thời điểm chuẩn UTC. Mặc định ngày nghiệp vụ là hôm nay; cho nhập quá khứ, không nhập tương lai, ngày trả >= ngày nhận; không có endpoint sửa lịch sử. Giữ actor và timestamp server ngay cả khi ngày nghiệp vụ nhập lùi. Ngày sinh cũng là ngày, không chuyển qua timestamp theo múi giờ.

### 4.3. Đơn, hồ sơ lưu trú, phiếu thu

| Nhóm | Trường cần được xem xét | Trường bất biến/nguồn | Điểm cần rà soát |
|---|---|---|---|
| Đơn | Sinh viên, nguyện vọng phòng, một kỳ, trạng thái, lúc gửi, người/lúc xử lý, lý do từ chối | Sinh viên sở hữu từ phiên đăng nhập; không tin `student_id` tùy ý từ client | Không tự sửa/hủy đơn đã gửi; Q-12 gửi lại phải tạo đơn mới; không tự đổi đơn khi nguyện vọng hết chỗ |
| Hồ sơ lưu trú | Đơn nguồn, sinh viên, phòng xếp thực tế, trạng thái, lúc xếp, ngày nhận, ngày trả, lý do/người/thời điểm hủy | Duyệt thành công tạo hồ sơ; phòng xếp không nhất thiết bằng nguyện vọng | Ngày nghiệp vụ nhập quá khứ được, không tương lai, trả không trước nhận; giữ timestamp server và lịch sử |
| Phiếu thu | Hồ sơ nguồn, ID, số tiền chốt, trạng thái, ngày lập, ngày thanh toán, người xác nhận | Số tiền lấy từ giá phòng tại lúc lập phiếu, server tính | BIGINT VND >= 0, JSON decimal string; phí 0 vẫn UNPAID; không tự thêm mã phiếu/hạn/ghi chú/phí phụ |

Không bắt buộc tạo bảng thanh toán nhiều dòng nếu nghiệp vụ chỉ ghi nhận đủ tiền một lần. Q-14 đã nhận **VND nguyên đồng, chính xác, không dùng số thực**; chưa thêm hạn/phí phạt/khoản phụ hay mã phiếu dễ đọc khi chưa có nhu cầu cụ thể. Theo **DELEGATED_SELECTION** tại baseline 12: phí/số tiền dùng `BIGINT` VND >= 0, JSON là chuỗi số nguyên thập phân để giữ chính xác; phí 0 được phép nhưng phiếu mới vẫn `UNPAID`, không tự chuyển `PAID`. Không tính tiền theo ngày hoặc sửa phiếu đã chốt khi giá phòng đổi.

Q-16 đã nhận hủy xếp **thủ công**, chỉ từ Đã xếp phòng, bắt buộc lý do, lưu người/thời điểm; không job tự động. Q-13 đã nhận sinh viên xem hồ sơ lưu trú/lịch sử của chính mình, phòng được xếp, ngày và trạng thái; không danh sách/liên hệ bạn cùng phòng. Q-19 nhận không hard-delete đơn/lưu trú/phiếu, không DELETE mặc định cho CRUD hoặc soft-delete đại trà; vẫn giữ trường lịch sử SRS và không thêm audit riêng khi chưa có nhu cầu.

## 5. Bất biến và nơi thực thi dự kiến

Các cơ chế constraint/index/transaction trong cột cuối là **PROPOSED chi tiết đặc tả**. Bất biến nghiệp vụ, bảng identity và mã kỹ thuật đã được chốt trong baseline phải được giữ; cơ chế SQL sẽ được viết và kiểm chứng ở đợt được giao tạo bộ đặc tả, không phải một câu hỏi chặn kế hoạch mới.

| Bất biến SRS | Bảo vệ cần có | Hướng thực hiện cần đánh giá |
|---|---|---|
| Một mã sinh viên duy nhất | Duy nhất ở DB, kể cả hai request tạo đồng thời | Unique key trên giá trị đã chuẩn hóa; API chuyển lỗi DB thành lỗi contract |
| Một hồ sơ gắn tối đa một tài khoản sinh viên | FK và duy nhất liên kết; role/link hợp lệ | Unique `student_accounts.student_id`; hồ sơ tồn tại trước account; `SV` cố định, role staff chỉ `BQL`/`ADMIN` |
| Một sinh viên tối đa một đơn chờ | Không dựa vào kiểm tra trước rồi insert | Unique index có điều kiện theo trạng thái đã chốt; transaction phối hợp với hồ sơ đang mở |
| Một sinh viên tối đa một hồ sơ chưa kết thúc | Chặn trùng giữa trạng thái đã xếp/đang ở | Unique index có điều kiện trên sinh viên cho tập trạng thái mở |
| Một đơn được duyệt tạo tối đa một hồ sơ | Duy nhất quan hệ đơn -> hồ sơ | Unique khóa đơn nguồn và transaction duyệt/tạo hồ sơ |
| Một hồ sơ tối đa một phiếu | Chặn tạo trùng ngay cả khi request đồng thời | Unique FK hồ sơ trên phiếu |
| FK luôn hợp lệ, lịch sử không mất | Không để tài khoản/phòng bị xóa kéo theo lịch sử | Chính sách xóa hạn chế; dùng khóa/ngừng sử dụng theo SRS, không cascade xóa lịch sử |
| Không quá sức chứa | Tổng các hồ sơ mở của phòng <= sức chứa | Transaction khóa cùng một tài nguyên phòng trước tính và ghi; kiểm tra chung với sửa phòng |
| Không giảm capacity dưới chỗ đã phân bổ hoặc tắt phòng đang có người/giữ chỗ | Kiểm tra trạng thái nhiều dòng trong cùng điểm đồng bộ | Sửa phòng và xếp phòng dùng cùng cơ chế khóa; không kiểm tra ở màn hình rồi ghi đơn lẻ |
| Duyệt hợp lệ về giới tính, phòng hoạt động, sinh viên chưa có hồ sơ mở | Đọc lại dữ liệu có hiệu lực trong transaction | Khóa/kiểm soát thay đổi đồng thời profile/phòng; chặn sửa gây không tương thích cho hồ sơ mở theo Q-09 |
| Từ chối có lý do; phiếu đã trả có ngày/người xác nhận | Quan hệ các cột trong cùng bản ghi | `CHECK`/nullability kết hợp validation; chốt độ dài và thời điểm |
| Trạng thái chỉ chuyển theo SRS | Kiểm tra trạng thái nguồn và ghi có điều kiện | Service transaction hoặc SQL function/trigger đã chọn; DB constraint giá trị enum không tự bảo vệ lịch sử chuyển |
| Tiền phiếu chốt tại lúc lập | Đọc giá và tạo phiếu nhất quán; không cập nhật dây chuyền | Snapshot tiền trên phiếu, kiểm soát đường ghi; không tính lại từ giá phòng hiện hành khi đọc |

**Điểm kỹ thuật phải giải thích trong tài liệu chính thức:** một `CHECK` trên một dòng không bảo đảm tổng chỗ của nhiều hồ sơ; khóa duy nhất đơn chờ và hồ sơ mở riêng lẻ cũng không đủ để ngăn một giao dịch gửi đơn chạy đua với giao dịch tạo hồ sơ lưu trú. Cần protocol transaction thống nhất và không có đường ghi tắt bỏ qua nó.

Mã trạng thái kỹ thuật theo [baseline chung](12-SHARED-TECHNICAL-BASELINE.md): đơn `PENDING`/`APPROVED`/`REJECTED`; hồ sơ `ALLOCATED`/`CHECKED_IN`/`ENDED`/`CANCELLED`; phiếu `UNPAID`/`PAID`; phòng `ACTIVE`/`INACTIVE`; kỳ `OPEN`/`CLOSED`. Khóa account dùng `is_locked` boolean; nếu DTO có nhãn ACTIVE/LOCKED thì đó là giá trị suy ra, không tạo thêm hai nguồn trạng thái độc lập. Cách thực thi bằng enum PostgreSQL hay text có constraint sẽ ghi trong đặc tả; không đổi danh mục giá trị đã chọn khi chọn kiểu SQL.

API dùng `/api/v1` và JSON camelCase; SQL dùng snake_case, mapping ghi trong dictionary. `actorKind` STUDENT/STAFF cùng `accountId` phân biệt principal giữa hai kho, không phải một role thứ tư và không thay kiểm tra `SV`/`BQL`/`ADMIN`. Người xác nhận tiền luôn là account staff có quyền BQL, không cho client gửi tùy ý người xác nhận.

## 6. Kế hoạch thiết kế transaction và khóa

### 6.1. Công việc bắt buộc trước khi viết SQL

1. Liệt kê toàn bộ thao tác ghi lên cùng dữ liệu, gồm cả đường quản trị/công cụ seed; không chỉ liệt kê endpoint chính.
2. Vẽ tài nguyên bị đọc/ghi cho từng thao tác: account, profile sinh viên, kỳ, đơn, phòng, hồ sơ, phiếu.
3. Chọn một thứ tự khóa chung cho mọi transaction nhiều tài nguyên. Với nhiều bản ghi cùng loại, khóa theo khóa tăng dần hoặc một thứ tự ổn định đã thống nhất.
4. Chốt ranh giới transaction, mức cô lập và cách retry lỗi serialization/deadlock nếu sử dụng. Không giữ transaction trong lúc chờ người dùng, gọi mạng hoặc xử lý giao diện.
5. Định nghĩa lỗi domain trả cho API khi không còn chỗ, đơn đã xử lý, kỳ đóng, hồ sơ đã kết thúc hoặc phiếu đã trả. Lỗi DB thô không là hợp đồng bên ngoài.
6. Viết kịch bản kiểm chứng có hai kết nối DB độc lập; chỉ chấp nhận thiết kế sau khi kết quả cuối thỏa bất biến.

Thứ tự khóa cụ thể là **DESIGN_TODO cho bộ đặc tả SQL**, không phải câu hỏi nghiệp vụ đang chặn kế hoạch. Trước khi giao code, phải ghi một thứ tự chung và kiểm chứng bằng PostgreSQL 18.6 với cách truy cập DB đã chọn. Không để mỗi người tự khóa theo module. Dùng khóa dòng, ghi có điều kiện, mức cô lập mạnh hơn hoặc hàm SQL phải thống nhất trong `SQL/04-transactions-and-locking.md`.

### 6.2. Ranh giới nghiệp vụ cần nguyên tử

| Thao tác | Đọc lại điều kiện trước ghi | Ghi phải cùng transaction | Đối thủ đồng thời phải kiểm tra |
|---|---|---|---|
| Gửi đơn | Kỳ mở; sinh viên chưa có đơn chờ/hồ sơ mở; phòng nguyện vọng hợp lệ theo FR-04 AC01 | Tạo đơn chờ; không ghi giữ chỗ | Gửi đôi; đóng kỳ; duyệt tạo hồ sơ cho cùng sinh viên |
| Duyệt và xếp phòng | Đơn còn chờ; phòng hoạt động/còn chỗ/đúng giới tính; sinh viên chưa có hồ sơ mở | Đơn đã duyệt + một hồ sơ đã xếp phòng; chỗ hiển thị phản ánh cùng kết quả | Hai người duyệt chỗ cuối; duyệt cùng đơn; từ chối cùng đơn; giảm capacity/tắt phòng/sửa giới tính |
| Từ chối | Đơn còn chờ và lý do hợp lệ | Đơn bị từ chối + dữ liệu xử lý; không tạo hồ sơ | Duyệt cùng đơn; từ chối hai lần |
| Nhận phòng | Hồ sơ còn đã xếp phòng | Đang ở + ngày nhận; không phân bổ thêm chỗ | Hủy xếp phòng cùng hồ sơ; nhận lặp |
| Hủy xếp phòng | Hồ sơ còn đã xếp phòng; có lý do | Đã hủy + lý do/người/thời điểm theo Q-16; giữ phiếu/lịch sử | Nhận phòng cùng hồ sơ; hủy lặp; tạo phiếu cùng lúc |
| Trả phòng | Hồ sơ còn đang ở | Đã kết thúc + ngày trả; giải phóng đúng một chỗ; giữ khoản nợ | Trả lặp; lập phiếu khi hồ sơ sắp kết thúc |
| Lập phiếu | Hồ sơ đã xếp/đang ở, chưa có phiếu; đọc giá phòng nhất quán | Một phiếu với snapshot tiền và chưa thanh toán | Lập đôi; sửa giá phòng; hủy/trả phòng cùng lúc |
| Xác nhận đủ tiền | Phiếu chưa thanh toán, người thực hiện đúng quyền | Đã thanh toán + ngày/người xác nhận | Hai người xác nhận; request retry |
| Sửa sức chứa/trạng thái phòng | Đếm hồ sơ mở tại thời điểm được bảo vệ | Ghi cấu hình phòng nếu còn thỏa QT-04/05 | Xếp phòng và kết thúc/hủy hồ sơ |
| Khóa/mở tài khoản | Quyền admin; đúng account ở đúng kho | Ghi `is_locked`; giữ hồ sơ/lịch sử/phiếu, không đổi role | Request bảo vệ tiếp theo phải thấy khóa theo Q-27; request đã được nhận trước đó không cần push logout |

SRS yêu cầu chỗ không âm, không trùng, không giải phóng nhiều lần. Baseline 12 đã chọn thao tác ghi mới sau khi hoàn thành trả 409, không tạo tác động thêm; logout lặp trả 204. Không dùng Idempotency-Key/store riêng trong prototype; mất response thì UI tải lại trạng thái. Đây là lựa chọn kỹ thuật theo ủy quyền, không phải yêu cầu SRS chỉ định một cơ chế cụ thể.

## 7. Chiến lược index và truy vấn dự kiến

- Ưu tiên index từ truy vấn thực tế: tìm sinh viên theo mã/tên; lọc phòng theo tòa/giới tính/trạng thái; đơn theo trạng thái; lịch sử của sinh viên/phòng; phiếu chưa thanh toán; liên kết FK hay join thường dùng.
- Phân biệt index phục vụ tính đúng với index phục vụ tốc độ. Index duy nhất có điều kiện không được bỏ chỉ vì dữ liệu thử ít.
- Chốt tìm tên có bỏ dấu/không phân biệt hoa thường hay không, quy tắc sắp xếp và phân trang trước khi chọn expression index hoặc extension. Không tự cài extension chỉ để tối ưu giả định.
- Chỗ đã phân bổ phải luôn được tính từ đúng hai trạng thái đã xếp phòng và đang ở. Nếu chọn cache/counter, phải mô tả cập nhật nguyên tử, kiểm tra lệch và cách khôi phục; chưa có nhu cầu để mặc định thêm cache.
- FR-08 được nhận theo Q-22 sau các MUST: đúng bốn chỉ số SRS, tổng phòng/chỗ còn lại trong phòng đang sử dụng, sinh viên đang ở riêng với giữ chỗ, phiếu chưa trả kể cả lưu trú đã kết thúc/hủy; không thêm báo cáo doanh thu/export hoặc nhiều kỳ.
- Kế hoạch NFR-02 giữ đúng 100 sinh viên, 100 phòng, 20 người đồng thời, tổng 100 API tra cứu, ít nhất 95 phản hồi dưới 2 giây. DB plan phải hỗ trợ đo từ API; thời gian query đơn lẻ không thay thế chỉ tiêu SRS.

## 8. Vòng đời schema, migration và seed

### 8.1. Không có hai nguồn schema tự mâu thuẫn

Sau khi công cụ được chọn, ghi rõ một trong các cách được duyệt: migration là nguồn chuẩn và `schema.sql` là snapshot có kiểm tra đồng bộ; hoặc DDL chuẩn sinh migration theo quy trình được chốt. Không để ORM tự đổi schema trong một môi trường trong khi người khác chạy file SQL khác.

Yêu cầu đối với chính sách:

1. Đánh số/thứ tự migration xác định; không sửa migration đã được chia sẻ và chạy trên môi trường chung mà không có quy trình thay thế.
2. Mỗi thay đổi cột/constraint cập nhật dictionary, quan hệ, API và fixture liên quan.
3. Kiểm tra hai đường: dựng database mới và nâng cấp database có dữ liệu giả. Kết quả schema phải tương đương.
4. Thay đổi phá dữ liệu phải ghi tác động và kế hoạch sao lưu/khôi phục trước khi chủ dự án quyết định thực hiện; không tự chạy xóa dữ liệu để làm test xanh.
5. Tách DDL, dữ liệu seed và kiểm tra. Không cho script reset database chạy ngầm trong khởi động bình thường.
6. Chốt quyền của tài khoản DB ứng dụng và tài khoản migration; không dùng mật khẩu thật hoặc tài khoản cá nhân trong repo.

### 8.2. Bộ seed giả cần chuẩn bị

| Bộ dữ liệu dự kiến | Mục đích |
|---|---|
| Ba tài khoản role và hai sinh viên khác nhau | Kiểm tra phân quyền/đọc chéo dữ liệu |
| Hồ sơ có và chưa có tài khoản | Cấp tài khoản theo QT-02; từ chối cấp trùng |
| Hai tòa/phòng khác giới tính, phòng hết chỗ, phòng ngừng dùng | Tra cứu, lọc và điều kiện xếp phòng |
| Phòng sức chứa 6 có 2 đã xếp + 3 đang ở | FR-03 AC01: còn đúng 1 chỗ |
| Đơn chờ/duyệt/từ chối và hồ sơ đủ bốn trạng thái | Chuyển trạng thái, lịch sử, retry |
| Phiếu chưa trả/đã trả, gồm hồ sơ đã hủy/kết thúc còn nợ | Giữ lịch sử và khoản phải thu theo QT-16 |
| Hai người cạnh tranh chỗ cuối, một hồ sơ chưa có phiếu | Kiểm tra concurrency không phụ thuộc thao tác thủ công |
| 100 sinh viên, 100 phòng với dữ liệu phân bố xác định | Kiểm tra NFR-02 có thể tái tạo |

Thông tin đăng nhập thử phải dùng cho môi trường demo tách biệt và được ghi cách thay đổi; không dùng mật khẩu thật hoặc hash lấy từ hệ thống thật. Q-25/Q-26 cho nhập DB/seed demo dùng script tạo hash, không thay API cấp tài khoản/hồ sơ. Bootstrap admin đầu tiên là ngoại lệ khởi tạo được hướng dẫn, không dùng nó làm lý do bỏ FR-01. Theo Q-17, admin được tự khóa và không có last-admin guard; khôi phục demo bằng thao tác DB được hướng dẫn, không tự xóa dữ liệu.

## 9. Quyết định đã tiếp nhận và việc thiết kế ở đợt sau

Không còn câu hỏi chặn kế hoạch. Đọc [câu trả lời](09-OWNER-QUESTIONS.md), [sổ quyết định](10-DECISIONS-AND-HANDOFF.md) và [baseline kỹ thuật](12-SHARED-TECHNICAL-BASELINE.md), không dùng lại danh sách OPEN cũ để hỏi chủ dự án những điều đã chốt.

| Đã đủ cơ sở lập kế hoạch | Việc còn phải viết/kiểm chứng khi được giao bộ đặc tả |
|---|---|
| PostgreSQL 18.6; Express API; Next.js UI; hai kho account và profile có trước | Chọn/ghi công cụ truy cập DB và migration một lần; ERD/cột/FK đầy đủ, không ORM tự chọn riêng |
| UUID, mã SV chuẩn hóa, unique mã phòng trong tòa, enum/status/role chung | Viết constraints/index cụ thể, mapping camelCase-snake_case và dictionary null/length |
| Argon2id; role bất biến; server session 30 phút idle; check role/ownership/locked mỗi protected request | Chốt parameters Argon2id, DDL/store session và config cookie theo baseline; kiểm chứng expiry 30 phút, hai kho account và request kế tiếp sau khóa |
| Một kỳ thủ công, được xử lý đơn chờ sau đóng, mở lại; được gửi lại đơn nếu đủ điều kiện | Ghi transaction gửi/đóng/duyệt để không race; không tự sửa trạng thái đơn cũ |
| Lưu trú riêng/cá nhân; hủy thủ công có lý do; chốt tiền và giữ nợ | Ghi đúng ngày/người/timestamp; test state/retry/phiếu còn nợ và phí 0 |
| VND BIGINT không âm, JSON decimal string; DATE nghiệp vụ, UTC TIMESTAMPTZ server | Mẫu request/response và kiểm chứng giới hạn số/ngày, nhập quá khứ, không ngày tương lai |
| Không hard-delete đơn/lưu trú/phiếu; không audit/soft-delete chung; FR-08 bốn chỉ số | FK policies; query thống kê; snapshot tên/mã nếu thực sự cần trong dictionary, không mở scope tùy ý |

Thiết kế null/length ở mục 4 vẫn là đề xuất để người soạn đặc tả rà soát; việc ghi **DESIGN_TODO** không có nghĩa còn một quyết định nghiệp vụ bị bỏ trống hoặc tự cho phép viết code trong đợt hiện tại.

Những điều **không cần hỏi lại**: sinh viên không tự cấp tài khoản; không tự hủy đơn; gửi đơn không giữ chỗ; được xếp phòng khác nguyện vọng nếu phù hợp; phiếu còn nợ không bị xóa khi hủy/trả; không tính theo ngày; không thanh toán từng phần/hoàn tiền.

## 10. Thứ tự thực hiện và tiêu chí hoàn tất

1. Đọc các quyết định đã hòa giải Q-25..Q-27 và baseline 12; giữ nguyên SRS/password hash/quyền tại API.
2. Mở task đặc tả riêng theo phạm vi được chủ dự án giao; dùng từ điển trạng thái/quyền chung đã chọn, không tự chọn lại.
3. Vẽ ERD + cardinality + dictionary trước; kiểm tra không có dữ liệu cần lưu mà chưa có chỗ, hoặc cột không có lý do tồn tại.
4. Thiết kế constraint/index/transaction cùng ma trận cạnh tranh đồng thời; một người khác rà soát.
5. Viết DDL và chính sách migration theo quyết định chung; chưa đưa nghiệp vụ chưa chốt vào default/trigger.
6. Dựng DB sạch, chạy seed giả, kiểm tra ràng buộc và concurrency; cập nhật API/error mapping.
7. Kiểm tra nâng cấp, đồng bộ schema/migration và khởi động qua Docker Compose cùng nhóm.
8. Ghi kết quả bàn giao và việc còn mở; chủ dự án kiểm tra và tự commit.

Definition of Done cho bộ thiết kế sau này:

- Mọi cột/bảng/index có mục đích và nguồn FR/QT hoặc quyết định đã duyệt.
- Không có enum/kiểu ID/trường tiền/ngày giờ lệch API.
- Không tạo trùng mã sinh viên, đơn chờ, hồ sơ mở, hồ sơ từ cùng đơn hoặc phiếu cùng hồ sơ khi đồng thời.
- Duyệt chỗ cuối, sửa capacity, nhận/hủy/trả lặp đều giữ chỗ đúng; không có ghi dở dang nếu giao dịch lỗi.
- Lịch sử và phiếu chưa thanh toán tồn tại sau hủy/trả/khóa tài khoản; việc sửa giá không sửa tiền phiếu cũ.
- Script dựng mới và migration được kiểm chứng, có đầu ra ghi nhận; chưa chạy kiểm tra thì không đánh dấu đạt.
- `SQL/AGENTS.md` hướng dẫn AI tiếp theo giữ cùng protocol ghi/khóa; không có đường ghi bỏ qua bất biến được mô tả.

## 11. Rủi ro cần theo dõi khi tích hợp

| Rủi ro | Hệ quả | Cách phòng trong kế hoạch |
|---|---|---|
| Mỗi module tự quản lý counter chỗ | Số chỗ lệch, nhận phòng trừ hai lần | Một định nghĩa chỗ, một protocol ghi, kiểm tra song song |
| API tự đặt enum riêng | Gửi/đọc trạng thái sai | Từ điển chung và rà soát API-DB-test |
| Kiểm tra trùng chỉ tại API | Hai request đồng thời vượt kiểm tra | Constraint DB + transaction + test hai kết nối |
| ORM tự đổi DB | Máy từng người có schema khác nhau | Một chính sách migration, kiểm tra schema snapshot |
| Xóa cascade hoặc reset seed nhầm | Mất lịch sử/phiếu | Chính sách vòng đời rõ; seed tách khỏi startup thường |
| Thêm quyền admin vào mọi nghiệp vụ | Vi phạm SRS dù schema đúng | Review phân quyền ba role trong API và dữ liệu |
| Biến dữ liệu tối thiểu thành yêu cầu tự suy đoán | Thu thập thiếu/thừa dữ liệu, phải sửa schema muộn | Câu hỏi được trả lời trước freeze; gắn nhãn đề xuất |
