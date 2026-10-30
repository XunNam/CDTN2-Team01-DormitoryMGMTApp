# Kế hoạch biên soạn Business Rules

Trạng thái: **PLAN_RECONCILED / AWAITING_SPECIFICATION_TASK**. Đã đối chiếu Q-01..Q-27, không còn câu hỏi chặn kế hoạch. Giữ đủ FR/QT/AC gốc của SRS; lựa chọn chủ dự án đã xác nhận ghi `OWNER_CONFIRMED`, lựa chọn kỹ thuật theo ủy quyền ghi `DELEGATED_SELECTION`. Cách tổ chức tài liệu và chi tiết chưa được baseline chốt vẫn là **PROPOSED**. Đây là kế hoạch biên soạn, chưa phải bộ contract/quy tắc thực thi đã tạo.

Nguồn chính: [SRS bản gốc](Source/SRS_v2.pdf), trang 7-17 và 20-21. Đọc cùng [kế hoạch API](03-API-PLAN.md), [kế hoạch dữ liệu](04-DATABASE-PLAN.md), [câu trả lời](09-OWNER-QUESTIONS.md), [sổ quyết định](10-DECISIONS-AND-HANDOFF.md) và [baseline kỹ thuật](12-SHARED-TECHNICAL-BASELINE.md).

## 0. Audit thay đổi yêu cầu sau khi nhận câu trả lời

- **Q-25 đã chốt:** mật khẩu phải băm theo NFR-01, dữ liệu demo có công cụ tạo hash. Đề nghị lưu plaintext tại Q-05/Q-18 là **SUPERSEDED**, không dùng làm đầu vào sinh schema/code.
- **Q-26 đã chốt:** nhập trực tiếp DB chỉ dùng cho demo; giữ đầy đủ FR-01/FR-02/QT-02. BQL tạo hồ sơ trước, Admin cấp tài khoản sau. Câu Q-18 "có hồ sơ là có tài khoản" là **SUPERSEDED**; không bỏ API cấp tài khoản/tạo hoặc cập nhật hồ sơ/sửa liên hệ.
- **Q-27 đã chốt:** mỗi request bảo vệ kiểm role, ownership và trạng thái khóa ở API; request tiếp theo của account bị khóa bị từ chối, không cần push logout tức thời. Việc hiển thị UI theo role không thay phân quyền backend.
- **Giữ lựa chọn không mâu thuẫn:** role `SV`/`BQL`/`ADMIN` bất biến sau tạo (Q-07); cho admin tự khóa, không last-admin guard (Q-17); hồ sơ thêm ngày sinh/địa chỉ (Q-18) bên cạnh dữ liệu tối thiểu SRS; sinh viên vẫn chỉ sửa liên hệ theo QT-03.
- **Không tự đổi ưu tiên physical storage:** Q-05 ưu tiên hai kho credentials. Baseline kỹ thuật tách `student_profiles` khỏi `student_accounts`, cộng `staff_accounts` cho BQL/Admin, để đáp ứng hồ sơ có trước account. Không chuyển thành một bảng account chung hoặc dùng actorKind như role thứ tư.

Ba điểm trên đã được hòa giải đầy đủ. Mọi đầu ra thực tế vẫn chỉ trong `Planning/`; các file quy tắc/API/DDL tương lai chỉ tạo khi có task thực hiện tương ứng.

## 1. Mục tiêu

Bộ quy tắc tương lai trong `Business Rules/` phải là nơi nhóm và AI tra cứu thống nhất về ai được làm gì, thao tác chỉ hợp lệ khi nào, dữ liệu thay đổi ra sao, khi nào từ chối và kết quả cần kiểm thử. Một quy tắc phải truy được sang API operation, ràng buộc/transaction dữ liệu, màn hình và test.

Giữ nguyên mã `QT-01` đến `QT-17` của SRS; không tạo bộ mã mới thay thế. Quy tắc mở rộng do chủ dự án duyệt cần có mã riêng, dẫn quyết định và ghi rõ tác động đến SRS. Ví dụ dữ liệu minh họa không trở thành giới hạn mặc định: mức 1.000.000 đồng là giá trong AC, không phải giá cố định cho mọi phòng.

## 2. Cấu trúc đầu ra dự kiến sau khi được yêu cầu thực hiện

| File/thư mục dự kiến | Nội dung | Người cần phối hợp |
|---|---|---|
| `Business Rules/AGENTS.md` | Đọc nguồn, giữ mã, phân biệt đã chốt/còn mở, cấm thay nghiệp vụ âm thầm | Điều phối, mọi AI |
| `Business Rules/README.md` | Mục lục, thứ tự đọc, trạng thái phê duyệt và liên kết nguồn | Điều phối |
| `Business Rules/00-glossary-and-statuses.md` | Thuật ngữ, công thức chỗ, nghĩa hồ sơ chưa kết thúc, tiền/kỳ và trạng thái/chuyển trạng thái chung | API, DB, UI, QA |
| `Business Rules/01-accounts-and-permissions.md` | QT-01, QT-02, QT-03; ma trận role x hành động x phạm vi dữ liệu; quyền bị cấm | API, UI, QA |
| `Business Rules/02-rooms-and-capacity.md` | QT-04, QT-05; công thức, điều kiện sửa phòng, biên và cạnh tranh sức chứa | DB, API, QA |
| `Business Rules/03-registration.md` | QT-06, QT-07, QT-08; kỳ, đơn chờ và nguyện vọng không giữ chỗ | API, DB, UI |
| `Business Rules/04-review-and-allocation.md` | QT-09, QT-10; bảng quyết định xét duyệt; dẫn chiếu QT-05/QT-08 | API, DB, QA |
| `Business Rules/05-residence-lifecycle.md` | QT-11, QT-12, QT-13; nhận/hủy xếp/trả; dẫn chiếu QT-16 về giữ lịch sử và phiếu | API, DB, UI, QA |
| `Business Rules/06-receipts-and-payment.md` | QT-14, QT-15, QT-16; chốt tiền, thanh toán thủ công, giữ khoản phải thu | API, DB, QA |
| `Business Rules/07-statistics.md` | QT-17; công thức/phạm vi các chỉ số, dữ liệu rỗng và ưu tiên SHOULD | API, UI, QA |
| `Business Rules/08-validation-matrix.md` | Ma trận liên phần, ví dụ biên/đồng thời, QT -> FR/UC -> operation -> DB -> test | Điều phối, QA, mọi thành viên |

Tên/thứ tự file tuân theo [cây thư mục chuẩn của kế hoạch](02-TARGET-STRUCTURE.md), hiện vẫn là cấu trúc đề xuất cần được duyệt. Mỗi QT có một heading ổn định như `## QT-01` với anchor `#qt-01` trong file nhóm sở hữu quy tắc, không tạo thêm `Rules/QT-xx.md`. QT-16 được định nghĩa chuẩn một lần tại `06-receipts-and-payment.md#qt-16`; file lưu trú dẫn chiếu tới đó. QT-05 và QT-08 cũng chỉ định nghĩa tại nhóm sở hữu, được nhóm xét duyệt dẫn chiếu. Không chia quy tắc thành ba bản trùng nhau theo role; dùng một danh mục chuẩn và ma trận quyền.

## 3. Đường biên vai trò đã có trong SRS

| Nhóm | Được làm | Giới hạn quan trọng |
|---|---|---|
| Sinh viên | Xem hồ sơ mình, sửa liên hệ mình; tra cứu/lọc phòng; gửi đơn và xem kết quả; xem thông tin lưu trú/khoản phí cá nhân theo phạm vi SRS | Không tự tạo tài khoản, sửa thông tin do Ban quản lý quản lý, truy cập sinh viên khác, tự hủy đơn, tự xếp/nhận/trả phòng hoặc xác nhận tiền |
| Ban quản lý KTX | Tạo/cập nhật/tìm hồ sơ; quản lý tòa/phòng; mở/đóng kỳ; duyệt/từ chối/xếp phòng; nhận/hủy xếp/trả; lịch sử; lập phiếu/xác nhận đủ tiền; thống kê SHOULD | Không cấp/khóa/mở tài khoản hoặc gán role; không được bỏ qua điều kiện phòng/hồ sơ vì thao tác quản lý |
| Quản trị viên hệ thống | Cấp tài khoản cho ba role, khóa/mở và gán role; dùng đăng nhập/đăng xuất/đổi mật khẩu của mình | Quyền tài khoản không bao gồm duyệt/xếp/nhận/trả/thu tiền hoặc quản lý nghiệp vụ |

Mã role chung là Sinh viên = `SV`, Ban quản lý = `BQL`, Quản trị viên = `ADMIN`; mỗi account một role và không đổi role sau tạo theo Q-07. UC-06 gán role vẫn có trong thao tác cấp tài khoản; không suy ra API đổi role của tài khoản đã tồn tại. Mọi người dùng dùng xác thực chung trong FR-01; API kiểm role/ownership/locked cho mỗi request bảo vệ theo Q-27, role không hợp lệ không được cấp quyền mặc định. Không chỉ ẩn nút trên UI. Quản trị viên không mặc định là superuser nghiệp vụ.

Q-17 cho phép Admin tự khóa và không bảo vệ Admin hoạt động cuối cùng; điều này thay đề xuất vận hành trước đây, không xóa dữ liệu hay bỏ API khóa/mở. Không cần push logout tới UI đang mở; lần request bảo vệ tiếp theo, gồm khôi phục phiên khi reload, phải từ chối account đã khóa. Ngày sinh/địa chỉ bổ sung không mở thêm quyền sinh viên sửa ngoài liên hệ.

## 4. Danh mục 17 quy tắc phải được triển khai tài liệu đầy đủ

| QT | Căn cứ/ý chính đã xác nhận | Những gì file chi tiết phải làm rõ và kiểm thử |
|---|---|---|
| QT-01 | FR-01: admin cấp/gán role; sinh viên không tự đăng ký; chỉ thao tác đúng quyền; admin không có quyền nghiệp vụ BQL | Ma trận quyền đủ ba role, API chưa đăng nhập/sai role, cấm public signup; phân biệt xác thực và quyền dữ liệu |
| QT-02 | FR-01/02: BQL tạo hồ sơ trước; tài khoản sinh viên cấp theo mã có hồ sơ; một hồ sơ tối đa một tài khoản; khóa không mất dữ liệu | Q-26 giữ nguyên trình tự profile-account và API; Q-27 request bảo vệ tiếp theo kiểm khóa; test cấp trùng và giữ hồ sơ-lịch sử-phiếu |
| QT-03 | FR-02: mã sinh viên duy nhất; sinh viên chỉ xem mình và sửa liên hệ; BQL quản lý trường khác gồm giới tính | Danh sách trường theo quyền, chống gửi thêm trường cấm, đọc chéo ID, trùng mã; sửa mã/giới tính khi đã có lưu trú còn mở cần chính sách |
| QT-04 | FR-03: không giảm sức chứa dưới chỗ đã phân bổ; không ngừng phòng còn hồ sơ chưa kết thúc | Phòng chỉ có giữ chỗ vẫn không được tắt; capacity bằng số đã phân bổ là biên hợp lệ theo QT; chạy đua sửa phòng-xếp phòng |
| QT-05 | FR-03/05: đã phân bổ = đã xếp + đang ở; còn chỗ = sức chứa - đã phân bổ; không âm kể cả đồng thời | Công thức một nguồn; hồ sơ hủy/kết thúc không chiếm chỗ; hai duyệt chỗ cuối; giữ nhất quán API/DB/UI/thống kê |
| QT-06 | FR-04: hệ thống xử lý một kỳ; BQL mở/đóng; chỉ nhận đơn khi kỳ mở | Q-11 nhận một kỳ prototype, đóng/mở thủ công, xử lý đơn đã gửi sau đóng và mở lại cùng kỳ; không job tự động/đa kỳ; test race gửi-đóng |
| QT-07 | FR-04: một sinh viên tối đa một đơn chờ; sinh viên không tự hủy; chỉ duyệt/từ chối mới kết thúc đơn | Q-12 nhận gửi mới sau từ chối/hủy/kết thúc nếu mọi điều kiện FR-04 đạt, không giới hạn lần ngoài SRS; không sửa/hủy đơn cũ hoặc thêm trạng thái |
| QT-08 | FR-04/05: phòng trong đơn là nguyện vọng; gửi đơn không giữ chỗ; chỉ duyệt và xếp thành công mới giữ | Nhiều người cùng chọn một phòng được xét sau; BQL có thể chọn phòng khác phù hợp; đừng giảm chỗ ở bước gửi |
| QT-09 | FR-05: chỉ xét đơn chờ; từ chối cần lý do; từ chối không tạo lưu trú/giữ chỗ | Lý do không rỗng theo validation được chốt; duyệt-từ chối cạnh tranh; từ chối đơn đã xử lý phải không đổi dữ liệu |
| QT-10 | FR-05: phòng hoạt động, còn chỗ, đúng giới tính; sinh viên chưa có hồ sơ đã xếp/đang ở | Kiểm tra lại tại lúc xác nhận, không tin dữ liệu tra cứu cũ; sai một điều kiện phải rollback toàn bộ; không tạo hồ sơ rời đơn |
| QT-11 | FR-06: chỉ nhận cho đã xếp; chuyển đang ở, lưu ngày nhận; không giảm chỗ thêm | Nhận lặp/sau hủy; phân biệt ngày nghiệp vụ với timestamp server theo Q-15 và baseline 12; đang ở khác giữ chỗ |
| QT-12 | FR-06: chỉ hủy xếp khi đã xếp; chuyển đã hủy, trả một chỗ | Q-16 nhận hủy thủ công vì không đến nhận, bắt buộc lý do/người/thời điểm, không job tự động; test hủy lặp/nhận-hủy cạnh tranh và giữ phiếu theo QT-16 |
| QT-13 | FR-06: chỉ trả khi đang ở; chuyển đã kết thúc, lưu ngày trả, trả đúng một chỗ | Trả lặp, trả trước nhận, điều kiện thời gian; không thêm điều kiện phải trả hết phí vì FR-06 AC03 cho phép còn nợ |
| QT-14 | FR-07: mỗi hồ sơ một phiếu; chỉ lập khi đã xếp/đang ở; chốt giá lúc lập; giá đổi không sửa phiếu; không tính ngày | Lập đôi đồng thời; không tự lập mới sau kết thúc; Q-14 nhận VND nguyên đồng; baseline 12 cho phí 0 nhưng phiếu vẫn UNPAID, không tự xác nhận |
| QT-15 | FR-07: BQL xác nhận khi nhận đủ tiền; thủ công; không từng phần/hoàn | Không tự xác nhận từ client sinh viên; lưu ngày/người; request lặp không ghi nhận tiền hai lần; không thêm cổng thanh toán |
| QT-16 | FR-06/07: hủy/trả không xóa lịch sử/phiếu; phiếu chưa trả giữ nguyên để theo dõi | Giữ nợ sau hủy lẫn trả; sinh viên còn tra cứu phiếu; không tự void/xóa/hoàn tiền; thanh toán phiếu cũ không được buộc hồ sơ phải đang ở |
| QT-17 | FR-08: đang ở chỉ đếm đang ở; chưa trả chỉ đếm phiếu chưa xác nhận; số phòng chỉ đếm phòng hoạt động | Q-22 nhận đúng bốn chỉ số sau MUST; tổng chỗ còn lại trên phòng đang sử dụng, không doanh thu/export/đa kỳ; dữ liệu rỗng 0, giữ chỗ không tính đang ở |

Các quyết định bổ sung trong cột cuối có nguồn Q hoặc baseline 12; không gán chúng thành nguyên văn SRS. HTTP status, error code, constraint và lock protocol chi tiết được viết khi tạo bộ đặc tả theo cùng baseline, không để từng thành viên tự chọn chuẩn khác nhau.

## 5. Trạng thái và chuyển trạng thái phải được mô tả

### 5.1. Đơn đăng ký

| Trạng thái nguồn | Hành động | Trạng thái đích | Tác động đã có trong SRS |
|---|---|---|---|
| Chưa có đơn mới | Sinh viên gửi khi đủ điều kiện FR-04 | Chờ duyệt | Tạo đơn, không giữ chỗ |
| Chờ duyệt | BQL duyệt + xếp thành công | Đã duyệt | Tạo một hồ sơ đã xếp, giữ một chỗ |
| Chờ duyệt | BQL từ chối kèm lý do | Bị từ chối | Không tạo hồ sơ, không đổi chỗ |

Không có chuyển từ đã duyệt/bị từ chối về chờ duyệt trong SRS. Không có trạng thái đơn "đã hủy". Hồ sơ lưu trú bị hủy là đối tượng khác; không tự đổi đơn đã duyệt sang bị từ chối khi hủy xếp phòng.

### 5.2. Hồ sơ lưu trú

| Nguồn | Hành động BQL | Đích | Chỗ đã phân bổ | Dữ liệu cần giữ |
|---|---|---|---|---|
| Chưa có | Duyệt đơn/xếp phòng thành công | Đã xếp phòng | Tăng 1 | Đơn nguồn, sinh viên, phòng thực tế |
| Đã xếp phòng | Xác nhận nhận | Đang ở | Không đổi | Ngày nhận |
| Đã xếp phòng | Hủy xếp vì không đến nhận | Đã hủy | Giảm 1 | Lịch sử và mọi phiếu đã có |
| Đang ở | Ghi nhận trả | Đã kết thúc | Giảm 1 | Ngày trả, lịch sử và mọi phiếu đã có |

"Hồ sơ lưu trú chưa kết thúc" trong điều kiện xếp/sửa phòng là tập **Đã xếp phòng hoặc Đang ở**, không chỉ "Đang ở". Hai trạng thái cuối không quay lại trạng thái mở. Theo Q-12 đã nhận đề xuất, một lần lưu trú mới có thể qua đơn/hồ sơ mới nếu kỳ mở và mọi điều kiện FR-04 đạt; không tái kích hoạt hồ sơ cũ hoặc sửa trạng thái đơn cũ.

### 5.3. Phiếu thu và các đối tượng còn lại

- Phiếu: tạo ở Chưa thanh toán -> BQL xác nhận đủ tiền -> Đã thanh toán. Không có trả một phần, hoàn, hủy/void hoặc quay về chưa trả trong SRS.
- Tài khoản: Hoạt động <-> Bị khóa do admin; khóa không xóa dữ liệu. Q-17/Q-27: admin được tự khóa, không last-admin guard; request bảo vệ tiếp theo kiểm tra khóa, không push logout tức thời; role bất biến sau tạo.
- Phòng: Đang sử dụng <-> Ngừng sử dụng, kiểm tra QT-04 khi ngừng/đổi sức chứa. Q-09 nhận chặn sửa giới tính gây không tương thích cho hồ sơ mở; đơn chờ được kiểm lại khi duyệt. Mã nghiệp vụ bất biến; không tự chuyển tòa của phòng đã có tham chiếu theo Q-10/baseline 12.
- Kỳ: Đang mở <-> Đã đóng do BQL; nhận đơn chỉ khi mở. Q-11 nhận mở/đóng thủ công cùng một kỳ, cho duyệt đơn đã gửi sau đóng và mở lại; không lịch tự động hoặc nhiều kỳ.

Mã kỹ thuật dùng chung theo baseline 12: đơn `PENDING`/`APPROVED`/`REJECTED`; lưu trú `ALLOCATED`/`CHECKED_IN`/`ENDED`/`CANCELLED`; phiếu `UNPAID`/`PAID`; phòng `ACTIVE`/`INACTIVE`; kỳ `OPEN`/`CLOSED`. Account có `is_locked` boolean; ACTIVE/LOCKED nếu hiển thị chỉ là nhãn suy ra. Domain giới tính prototype `MALE`/`FEMALE` là **DELEGATED_SELECTION** theo ví dụ SRS, không tuyên bố chủ dự án đích thân chọn domain đầy đủ hoặc tự thêm MIXED.

File chính thức phải bổ sung cho mỗi chuyển: actor, scope dữ liệu, điều kiện nguồn, dữ liệu đầu vào, thay đổi nguyên tử, tác động lên đối tượng khác, cách báo lỗi và hành vi khi lặp. Enum không được định nghĩa lại theo từng role/module.

## 6. Bảng quyết định cần viết và đối chiếu

### 6.1. Duyệt và xếp phòng

Mỗi điều kiện độc lập phải có ít nhất một ví dụ thất bại. Điều kiện cần kiểm: role BQL, đơn đang chờ, phòng hoạt động, còn chỗ tại thời điểm ghi, phù hợp giới tính, sinh viên không có hồ sơ mở. Nếu tất cả đúng, tạo hồ sơ và duyệt đơn trong cùng transaction; nếu có điều kiện sai, không tạo hồ sơ và không đổi chỗ.

Không dùng thứ tự lỗi tình cờ của code như quy tắc chung. Nếu nhiều điều kiện cùng sai, API cần quy ước báo lỗi nhất quán sau khi đã bảo vệ thông tin. Kiểm tra quyền phải ngăn lộ dữ liệu trước khi cung cấp chi tiết nghiệp vụ.

### 6.2. Lập phiếu và giữ khoản phải thu

| Trạng thái hồ sơ | Đã có phiếu? | Lập phiếu mới theo QT-14 | Phiếu cũ theo QT-16 |
|---|---|---|---|
| Đã xếp phòng | Chưa | Có nếu BQL và dữ liệu hợp lệ | Không áp dụng |
| Đang ở | Chưa | Có nếu BQL và dữ liệu hợp lệ | Không áp dụng |
| Đã xếp phòng/Đang ở | Có | Không lập thêm | Giữ phiếu và số tiền đã chốt |
| Đã hủy/Đã kết thúc | Chưa | Không tự cho phép trong phạm vi SRS | Không áp dụng |
| Đã hủy/Đã kết thúc | Có | Không lập thêm | Giữ nguyên; phiếu chưa trả vẫn là khoản phải thu |

FR-06 AC03 đã xác định trả phòng khi còn phiếu chưa trả vẫn thành công. Không cần hỏi chủ dự án "còn nợ có được trả phòng không" rồi tạo ra hai phương án trái SRS. Nếu chủ dự án chủ động thay đổi, ghi quyết định và các AC bị ảnh hưởng.

### 6.3. Ma trận thao tác đồng thời

| Cặp thao tác | Kết quả cần bảo đảm | Việc nhóm phải chốt |
|---|---|---|
| Hai duyệt cho chỗ cuối | Tối đa một hồ sơ mới chiếm chỗ đó, không âm | Lỗi domain và phản hồi người thua |
| Duyệt và từ chối cùng đơn | Chỉ một kết quả cuối, không hồ sơ mồ côi | Ghi có điều kiện/khóa và retry |
| Nhận và hủy cùng hồ sơ | Chỉ một chuyển hợp lệ | Kết quả khi UI dùng dữ liệu cũ |
| Hai trả/hủy | Chỉ giải phóng một lần | Lần ghi mới sau hoàn thành trả 409, không tác động thêm; UI tải lại trạng thái |
| Hai lập phiếu cùng hồ sơ | Một phiếu, một khoản phải thu | Phản hồi trùng, tra lại phiếu hiện có |
| Hai xác nhận trả tiền | Một lần chuyển, ngày/người không bị ghi đè tùy ý | Lần xác nhận mới sau hoàn thành trả 409, giữ lần đầu; không replay thành khoản thu mới |
| Sửa phòng và xếp phòng | Capacity/giới tính/trạng thái không mâu thuẫn | Chính sách sửa + protocol transaction |
| Đóng kỳ và gửi đơn | Đơn chỉ nhận khi kỳ được coi là mở tại điểm kiểm soát chung | Điểm hiệu lực và thông báo nhất quán |

## 7. Mẫu bắt buộc cho mỗi mục QT chính thức

Mỗi mục QT trong file nhóm cần các phần sau; heading `QT-xx` là đích liên kết chuẩn để nhóm khác tham chiếu:

1. **Định danh và trạng thái**: QT gốc `SRS_CONFIRMED`; bổ sung `OWNER_CONFIRMED` hoặc `DELEGATED_SELECTION` theo đúng nguồn; FR/UC/AC, trang SRS, quyết định liên quan.
2. **Phát biểu**: điều kiện và kết quả bằng ngôn ngữ nghiệp vụ, không trộn framework hoặc tên class.
3. **Thuật ngữ**: liên kết tới định nghĩa chung; không định nghĩa riêng "chỗ còn lại" theo module.
4. **Quyền và phạm vi**: actor được làm, dữ liệu cá nhân/toàn KTX, role bị cấm, các trường được ghi.
5. **Tiền điều kiện**: trạng thái nguồn, dữ liệu cần có, ngày giờ/tiền nếu liên quan.
6. **Kết quả thành công**: trạng thái, dữ liệu tạo/sửa, tác động lên chỗ/tiền và phần phải giữ.
7. **Từ chối và tính nguyên tử**: từng trường hợp lỗi, dữ liệu phải giữ nguyên; liên kết error code API đã chốt.
8. **Đồng thời và thao tác lặp**: tình huống cạnh tranh, invariant cần giữ, liên kết transaction DB.
9. **Ví dụ**: ít nhất một hợp lệ và một không hợp lệ; thêm biên/concurrency nếu liên quan.
10. **Kiểm chứng**: Given-When-Then, test ID, kết quả mong đợi và traceability tới operation/schema.
11. **Điểm còn mở và lịch sử đổi**: không trộn câu trả lời chưa có với quy tắc bắt buộc.

Chỉ cần tài liệu ở bước được phép, không viết test tự động giả để minh họa rồi báo là đã kiểm chứng. Các test chính thức sẽ được thực hiện với code/schema ở giai đoạn tương ứng.

## 8. Các ví dụ kiểm chứng nhất quán cần đưa vào bộ quy tắc

- **Chỗ:** phòng 6 chỗ, 2 đã xếp + 3 đang ở -> còn 1. Chuyển một hồ sơ đã xếp sang đang ở vẫn còn 1. Trả một hồ sơ đang ở -> còn 2. Lặp trả không tăng thêm.
- **Không giữ nguyện vọng:** hai sinh viên gửi đơn cho phòng còn 1 chỗ -> gửi đơn không làm còn 0. Khi duyệt cạnh tranh chỉ một xếp thành công; đơn còn lại không tự bị từ chối nếu thao tác duyệt lỗi và chưa có hành động từ chối hợp lệ.
- **Giá:** xếp phòng ở giá A, trước lúc lập phiếu giá đổi thành B -> phiếu lấy B; sau lập giá đổi C -> phiếu giữ B. Không dùng giá lúc xếp nếu khác lúc lập.
- **Giữ nợ:** hồ sơ đang ở có phiếu chưa trả, BQL ghi nhận trả -> hồ sơ kết thúc, chỗ tăng một, phiếu vẫn chưa trả và có thể được theo dõi/xác nhận sau khi nhận đủ tiền.
- **Hủy xếp:** hồ sơ đã xếp có phiếu chưa trả, BQL hủy vì không đến -> chỗ trả một, hồ sơ và phiếu giữ; không thêm nghiệp vụ tự xóa nợ/hoàn tiền.
- **Phân quyền:** admin gọi duyệt đơn -> bị từ chối; BQL gọi cấp tài khoản -> bị từ chối; sinh viên A đọc phiếu sinh viên B -> không lộ dữ liệu.
- **Hồ sơ và tài khoản:** BQL tạo hồ sơ trước, admin cấp tài khoản theo mã; cấp lần hai bị chặn. Khóa tài khoản không làm mất hồ sơ/phiếu/lịch sử.
- **Profile chưa có account:** tạo hồ sơ demo hoặc qua API không tự tạo quyền đăng nhập. Chỉ khi Admin cấp `student_accounts` cho hồ sơ có trước mới có account SV; mật khẩu băm theo Q-25. DTO hồ sơ không chứa mật khẩu/hash.
- **Khóa:** Admin tự khóa được; không cần đẩy UI đăng xuất ngay nhưng mọi request bảo vệ tiếp theo, kể cả khôi phục phiên khi reload, bị từ chối theo Q-27. Không sửa role để giả lập khóa và không xóa lịch sử.
- **Phí 0:** được cấu hình theo baseline kỹ thuật; lập phiếu số tiền 0 vẫn `UNPAID`, chỉ chuyển `PAID` bằng thao tác xác nhận hợp lệ, không tự thêm điều kiện yêu cầu phí dương.
- **Ngày:** ngày trả nhập quá khứ hợp lệ khi không trước ngày nhận; ngày tương lai bị từ chối. Timestamp server và người ghi nhận vẫn phản ánh lúc thao tác, không bị thay bằng ngày nghiệp vụ nhập lùi.
- **Không có dữ liệu:** thống kê SHOULD trả các chỉ số 0 đúng phạm vi, không lỗi chia cho 0 hoặc null không thống nhất.

## 9. Chính sách đã tiếp nhận và chi tiết phải biên soạn ở đợt sau

Không còn câu hỏi chặn kế hoạch. Không hỏi lại các chủ đề đã được trả lời; dùng nguồn tại [file câu trả lời](09-OWNER-QUESTIONS.md), [sổ quyết định](10-DECISIONS-AND-HANDOFF.md) và [baseline kỹ thuật](12-SHARED-TECHNICAL-BASELINE.md).

| Chủ đề | Quyết định đủ để lập kế hoạch | Chi tiết đặc tả/kiểm chứng tương lai |
|---|---|---|
| Hồ sơ và account | Giữ toàn bộ FR-01/02/QT-02, hồ sơ có trước account; demo không thay API; mật khẩu băm | DTO/validation, null/length dictionary; test profile chưa có account, cấp trùng và không lộ credentials |
| Dữ liệu hồ sơ | Tối thiểu SRS + ngày sinh/địa chỉ; lớp/khoa tách, không thêm ảnh/CCCD; SV chỉ sửa liên hệ | Dẫn từng trường sang schema và quyền theo trường, không tự mở rộng dữ liệu |
| Role và khóa | `SV`/`BQL`/`ADMIN`, role bất biến; check role/ownership/locked mỗi request; tự khóa admin được, không last-admin guard | Kết quả lỗi và khôi phục phiên/reload; không push logout, không bỏ API guard |
| Phòng và giới tính | Chặn sửa gây sai tương thích với hồ sơ mở; MALE/FEMALE prototype và mã bất biến theo lựa chọn kỹ thuật | Bảng quyết định sửa/duyệt đồng thời; unique mã phòng trong tòa, không MIXED hoặc chuyển phòng |
| Kỳ và gửi lại | Một kỳ thủ công, mở lại được, duyệt đơn đã gửi sau đóng; gửi mới khi mọi FR-04 đạt | Decision table và test gửi-đóng; đơn cũ không tự hủy/hết hạn hoặc đổi trạng thái khi nguyện vọng đầy |
| Lưu trú riêng | Q-13: SV xem phòng được xếp/ngày/trạng thái/lịch sử của mình, không bạn cùng phòng | Operation đọc, privacy và mapping hồ sơ thực tế khác nguyện vọng |
| Hủy no-show | Thủ công từ Đã xếp phòng, lý do/người/thời điểm bắt buộc, không job tự động | Validation và retry, giữ lịch sử/phiếu theo QT-16 |
| Tiền và ngày | VND nguyên đồng chính xác, phí 0 vẫn UNPAID; ngày nghiệp vụ DATE/Việt Nam, server UTC, cho quá khứ không tương lai, checkout >= checkin | Mẫu request/response theo BIGINT + decimal string, test biên thời gian và snapshot tiền |
| Lịch sử và thống kê | Không hard-delete đơn/lưu trú/phiếu hoặc audit chung; FR-08 bốn chỉ số sau MUST, tổng chỗ trên phòng đang sử dụng | Cross-rule matrix, FK/query và test dữ liệu rỗng; không thêm doanh thu/export/đa kỳ |

Một số độ dài/null/default dictionary vẫn là **PROPOSED** để người tạo đặc tả rà soát, không phải câu hỏi nghiệp vụ chưa được giải quyết. Không để bốn AI tự chọn riêng quy tắc kỹ thuật đã có baseline chung.

## 10. Thứ tự làm và cơ chế kiểm soát thay đổi

1. Đọc các quyết định đã hòa giải Q-25..Q-27 và baseline 12; giữ nguồn câu trả lời cũ cùng trạng thái SUPERSEDED cần thiết, không sửa PDF nguồn.
2. Biên soạn glossary, ma trận quyền và state machine trước các chi tiết endpoint/schema.
3. Viết từng mục QT theo mẫu trong file nhóm sở hữu; với mỗi QT đánh dấu tình huống đã có AC và tình huống bổ sung cần test.
4. Người phụ trách API và DB cùng đối chiếu từng quy tắc; mọi bên dùng một nghĩa cho enum, chỗ, tiền và thời gian.
5. Lập traceability QT -> FR/UC/AC -> operation -> ràng buộc/transaction -> test. UC-19 kiểm tra điều kiện xếp phòng có thể là hành vi nội bộ, không bắt buộc endpoint độc lập.
6. Rà soát chéo bởi người không soạn phần đó, tập trung quyền/đồng thời/tiền/lịch sử; kiểm việc các câu trả lời cũ về plaintext/DB-only không xuất hiện lại như yêu cầu còn hiệu lực.
7. Freeze một baseline tài liệu có phiên bản nội bộ sau khi chủ dự án yêu cầu/chấp nhận; không tự commit/tag để freeze.
8. Khi đổi quy tắc: ghi lý do, nguồn quyết định, file API/DB/UI/test bị ảnh hưởng, cách tương thích và người rà soát; cập nhật đồng bộ trước tích hợp thủ công.

Nếu một câu trả lời mới mâu thuẫn SRS, phải ghi rõ "thay đổi QT/AC nào" và nội dung thay thế; không tự kết hợp hai quy tắc trái nhau. Phần độc lập vẫn có thể tiếp tục biên soạn trong phạm vi được phép.

## 11. Tiêu chí hoàn tất bộ quy tắc ở giai đoạn thực hiện

- Có đủ 17 mục QT với anchor ổn định trong các file nhóm 01-07 của cây chuẩn; giữ mã gốc và truy vết đầy đủ, không có file QT định nghĩa trùng.
- Có ma trận quyền ba role và kiểm tra dữ liệu cá nhân; không có quyền được cấp ngầm.
- State machine đúng sáu nhóm đối tượng; không có chuyển mới chưa được chủ dự án quyết định.
- Công thức chỗ, giá lúc lập phiếu, giữ nợ sau hủy/trả và một phiếu/hồ sơ thống nhất API/DB/test.
- Mỗi rule có điều kiện thành công/thất bại, hậu quả dữ liệu và ví dụ; nhóm rủi ro có tình huống đồng thời/lặp.
- Mọi chính sách còn mở ảnh hưởng phần đã freeze được giải quyết hoặc phần liên quan được ghi chưa sẵn sàng, không đánh dấu xong chung chung.
- Có người khác rà soát và kết quả kiểm tra tài liệu; kiểm thử thực tế chỉ được báo đạt sau khi đã chạy trên triển khai tương ứng.
- `Business Rules/AGENTS.md` hướng dẫn AI khác giữ nguồn chung, cập nhật traceability và không tự commit.

## 12. Rủi ro tích hợp cần quản lý

| Dấu hiệu lệch | Hậu quả | Hành động trong kế hoạch |
|---|---|---|
| Frontend gọi "đã duyệt" như "đang ở" | Nhận phòng trừ thêm chỗ, thống kê sai | Glossary và trạng thái tách đơn/hồ sơ |
| Mỗi role có định nghĩa phiếu riêng | Mất nợ sau trả, lệch tiền | Một QT-14/15/16 chuẩn, link từ role API |
| Backend thêm yêu cầu trả hết tiền trước trả phòng | Trái FR-06 AC03 | Truy vết và kiểm thử nợ khi checkout |
| Sửa giá phòng cập nhật phiếu cũ | Sai số tiền đã chốt | Quy tắc snapshot được review cùng schema |
| Chỉ kiểm tra quyền trên UI | Lộ dữ liệu qua API | NFR-01 và ma trận request sai quyền |
| Thêm trạng thái "hủy đơn" vì nhầm với hủy xếp | Mở rộng scope và sai vòng đời | State machine chuẩn cùng một bộ enum |
| AI tự bổ sung policy ở một phần | Tích hợp không tương thích | Câu hỏi tập trung, quyết định ghi một nơi, review ảnh hưởng |
