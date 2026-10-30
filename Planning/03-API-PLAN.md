# Kế hoạch xây dựng API contract

Trạng thái: **PLAN_RECONCILED / AWAITING_SPECIFICATION_TASK**. Đã đối chiếu Q-01 đến Q-24 và câu trả lời làm rõ Q-25 đến Q-27. Các mã `API-*` là mã đầu việc; chưa phải operationId hay route chính thức. Đợt này chỉ cập nhật kế hoạch, không tạo contract HTTP, DDL hoặc code.

Nguồn: SRS trang 4-17, 19-21; FR-01 đến FR-08, NFR-01 đến NFR-03; câu trả lời Q-01 đến Q-24 và nội dung Q-25 đến Q-27 tại [bản rà câu trả lời](11-ANSWER-REVIEW.md). Quyết định nằm trong [sổ quyết định](10-DECISIONS-AND-HANDOFF.md), lựa chọn kỹ thuật chung tại [baseline kỹ thuật](12-SHARED-TECHNICAL-BASELINE.md). Q-25 đến Q-27 giữ băm mật khẩu, đầy đủ FR-01/02 và kiểm tra role/ownership/khóa tại API; không sửa baseline SRS để làm biến mất xung đột.

## 1. Mục tiêu và phạm vi

Sau khi chốt câu hỏi, bộ contract phải đủ để người viết giao diện, người viết API, người thiết kế CSDL và người kiểm thử làm việc độc lập mà vẫn ghép được. Một nghiệp vụ phải thống nhất quyền, tên trường, trạng thái, lỗi, tác động dữ liệu và điều kiện hoàn tất.

- Ba vai trò và giá trị máy đã xác nhận: `SV` = Sinh viên, `BQL` = Ban quản lý ký túc xá, `ADMIN` = Quản trị viên hệ thống. Mỗi tài khoản có một role; role gán lúc tạo và không có API đổi role sau đó theo Q-07.
- Xác thực dùng chung cho ba vai trò; sinh viên không có API tự đăng ký tài khoản.
- Quản trị viên quản lý tài khoản, không có quyền duyệt đơn, xếp phòng hay thu phí chỉ vì là quản trị viên. Q-26 xác nhận nhập DB chỉ để khởi tạo demo; vẫn giữ đầy đủ chức năng tài khoản/hồ sơ FR-01/02 qua ứng dụng. Hồ sơ có trước tài khoản; bản ghi sinh viên không tự có quyền đăng nhập.
- UC-19 là kiểm tra điều kiện xếp phòng của hệ thống. Không mặc định tạo endpoint công khai riêng; kiểm tra có thể nằm trong thao tác duyệt và xếp phòng.
- Q-22 đã nhận FR-08 với đúng bốn chỉ số SRS, thực hiện sau phần MUST; không thêm báo cáo doanh thu/export/bộ lọc nhiều kỳ.
- Q-01 xác nhận Next.js cho frontend và ExpressJS cho backend API, PostgreSQL cho dữ liệu. Baseline số 12 chọn PostgreSQL 18.6; phiên bản Next.js/ExpressJS/Node.js và lockfile được chốt tại APP-01 sau kiểm tra tương thích, không tự cài/chọn riêng trong đợt kế hoạch.
- Các quy ước kỹ thuật do AI chọn trong phạm vi Q-20 được ghi `DELEGATED_SELECTION`: prefix `/api/v1`, JSON camelCase, cột SQL snake_case có mapping rõ, ID kỹ thuật UUID. Không đồng nghĩa đã đóng băng URL của từng operation.

### 1.1. Chuẩn xác thực và hồ sơ sau khi làm rõ

| Nội dung | Trạng thái và cách đưa vào kế hoạch |
|---|---|
| MSSV cho sinh viên, username cho BQL/Admin | OWNER_CONFIRMED Q-05. Lựa chọn kỹ thuật ở baseline số 12 dùng accountType STUDENT/STAFF + identifier + password; accountType chỉ chọn nguồn xác thực, không cấp role. Server kiểm tra nguồn/danh tính, role lấy từ DB; không suy role từ cú pháp mã hoặc tin role do client gửi |
| Hai nơi lưu thông tin đăng nhập | Giữ ý định hai nguồn Q-05 và tách lifecycle theo Q-26/QT-02: lựa chọn kỹ thuật `student_accounts` tham chiếu hồ sơ `student_profiles` có trước, `staff_accounts` chỉ BQL/ADMIN. Tồn tại hồ sơ chưa tự cấp login; không ép thành một bảng account |
| Session | DELEGATED_SELECTION trong phạm vi Q-05: session phía server, `express-session` với PostgreSQL session store; cookie chứa định danh phiên; hết hạn sau 30 phút không hoạt động. Chủ dự án trực tiếp yêu cầu idle 30 phút, không trực tiếp chọn thư viện/store |
| Mật khẩu | OWNER_CONFIRMED Q-25: băm theo NFR-01, không plaintext; Argon2id là DELEGATED_SELECTION ở baseline số 12. Không có password/hash trong response hoặc log; không lưu plaintext vào seed |
| Khởi tạo và quản lý hồ sơ/account | OWNER_CONFIRMED Q-26: DB trực tiếp chỉ khởi tạo demo; vẫn có Admin cấp/khóa/mở account và BQL tạo/cập nhật/tìm hồ sơ; giữ quyền SV sửa liên hệ theo FR-02 |
| Role sau khi tạo | OWNER_CONFIRMED Q-07: bất biến trong ứng dụng, không đa role/endpoint đổi role |
| Khóa tài khoản | OWNER_CONFIRMED Q-27: API kiểm tra role, ownership và trạng thái khóa tại mỗi request bảo vệ; từ chối request kế tiếp sau khóa, không cần push logout realtime. Q-17 cho Admin tự khóa, không yêu cầu bảo vệ Admin cuối |
| Ngày sinh/địa chỉ thường trú | OWNER_CONFIRMED bổ sung Q-18, vẫn giữ trường tối thiểu SRS. Không suy ra SV được tự sửa hai trường này; quyền sửa liên hệ vẫn chỉ điện thoại/email |

Với hai nguồn danh tính, session giữ actorKind STUDENT/STAFF và accountId để không nhầm bản ghi; đây là phân loại nguồn tài khoản, không phải role thứ tư. accountType ở bước login chọn namespace nên MSSV và staff username không gây chọn nhầm nguồn. Role được đọc từ dữ liệu đã xác thực, không từ lựa chọn giao diện. Session không được giữ quyền cũ để bỏ qua role/ownership/khóa ở mỗi request. Các lựa chọn chi tiết tiếp theo phải dẫn chiếu cùng baseline số 12 và decision log.

## 2. Cách chia tài liệu dự kiến

Cây dưới đây dùng đúng tên đích của `02-TARGET-STRUCTURE.md`; tài liệu đó là nguồn chuẩn cho cấu trúc. Phần API dự kiến:

```text
API Endpoint/
  AGENTS.md
  README.md
  Shared/
    AGENTS.md
    00-conventions.md
    01-authentication.md
    02-authorization.md
    03-data-contracts.md
    04-errors.md
    05-concurrency-and-retry.md
  Student/
    AGENTS.md
    README.md
    01-my-profile.md
    02-room-search.md
    03-my-applications.md
    04-my-residence.md
    05-my-receipts.md
  Dormitory Management/
    AGENTS.md
    README.md
    01-student-profiles.md
    02-buildings-and-rooms.md
    03-registration-period.md
    04-application-review.md
    05-residence-lifecycle.md
    06-receipts-and-payment.md
    07-statistics.md
  System Admin/
    AGENTS.md
    README.md
    01-account-provisioning.md
    02-lock-and-unlock.md
    03-role-assignment.md
  openapi.yaml  # Q-24 đồng ý bổ sung theo công cụ được chọn
```

Đây là đầu ra tương lai, chưa tạo trong giai đoạn hiện tại. Mỗi file theo nhóm nghiệp vụ, chứa các operation liên quan; chỉ tách thành file nhỏ hơn khi nhóm cần giao một operation cho người khác. Tránh một file cho mọi API hoặc hàng chục file chỉ có một dòng.

`API Endpoint/Shared/03-data-contracts.md` sở hữu định nghĩa dùng chung; file của từng vai trò chỉ dẫn chiếu schema và ghi khác biệt được phép. `API Endpoint/README.md` là danh mục duy nhất của method + URL + operationId + quyền + file sở hữu. README của role lọc/dẫn chiếu danh mục này, không định nghĩa lại operation. Nếu cùng một operation được dùng ở hai vai trò, chỉ có một định nghĩa chuẩn; bảng quyền và file vai trò dẫn chiếu về đó.

Q-24 đã nhận bộ tài liệu hỗ trợ: data dictionary, ERD, traceability, checklist, mẫu task/bàn giao; OpenAPI, seed và bộ request theo công cụ được chọn. Các đầu ra API bổ sung dẫn xuất từ cùng contract Markdown, có cách phát hiện lệch; không duy trì hai bộ định nghĩa độc lập hoặc dùng OpenAPI thay Markdown. Câu trả lời không tự cho phép viết ứng dụng.

## 3. Danh mục thao tác để lập contract

Danh mục dưới đây mô tả **hành vi cần đặc tả**, không ấn định số endpoint HTTP. Có thể ghép list/detail hoặc các thay đổi trạng thái theo quyết định thiết kế chung, miễn không mất kiểm soát quyền và chuyển trạng thái. Một số thao tác đọc hỗ trợ giao diện được ghi rõ là đề xuất bổ sung.

### 3.1. Dùng chung cho ba vai trò

| Mã kế hoạch | Thao tác | Nguồn | Nội dung phải làm rõ |
|---|---|---|---|
| API-P01 | Đăng nhập | FR-01, UC-01, QT-01, FR-01/AC01, FR-01/AC02; Q-05/Q-25/Q-27 | accountType STUDENT/STAFF chọn nguồn, identifier = MSSV/username; role lấy từ dữ liệu xác thực; Argon2id; session server idle 30 phút; tài khoản khóa không đăng nhập |
| API-P02 | Đăng xuất | FR-01, UC-02, FR-01/AC03 | Kết thúc session trên server; xử lý phiên hết hạn/retry; không tự thêm revoke mọi thiết bị khi chưa có chuẩn chung |
| API-P03 | Đổi mật khẩu | FR-01, UC-03, FR-01/AC03; Q-25/Q-26 | Kiểm tra mật khẩu hiện tại, ghi hash mới; thu hồi phiên khác và cấp lại phiên hiện tại theo baseline 12; không ghi log/response mật khẩu |
| API-P04 | Đọc danh tính/quyền hiện tại | Đề xuất kỹ thuật hỗ trợ NFR-01 | Chỉ bổ sung khi UI cần; dữ liệu tối thiểu; account id và role, không gộp toàn bộ hồ sơ sinh viên |

Baseline kỹ thuật chọn server session, không JWT/refresh-token flow; đổi mật khẩu thu hồi phiên khác và cấp lại phiên hiện tại. Quên mật khẩu, reset mật khẩu do Admin hoặc bắt buộc đổi mật khẩu lần đầu chưa có yêu cầu; không tự thêm. Độ dài mật khẩu và validation chi tiết được ghi ở contract auth khi tạo đặc tả, không để mỗi role chọn riêng.

### 3.2. Sinh viên

| Mã kế hoạch | Thao tác | Nguồn | Ràng buộc chính |
|---|---|---|---|
| API-S01 | Xem hồ sơ cá nhân | FR-02, UC-09, QT-03, FR-02/AC02; Q-08/Q-18 | Danh tính lấy từ phiên; không chọn sinh viên khác. Có ngày sinh/địa chỉ bổ sung, không trả password/hash |
| API-S02 | Cập nhật thông tin liên hệ | FR-02, UC-10, QT-03, FR-02/AC02; Q-26 | Vẫn giữ qua API; chỉ điện thoại/email, không MSSV/giới tính/role/ngày sinh/địa chỉ hoặc trường quản trị |
| API-S03 | Xem và lọc danh sách phòng | FR-03, UC-13, QT-05, FR-03/AC03 | Tòa nhà, giới tính tiếp nhận, còn chỗ; chỉ phòng đang sử dụng; không lộ danh sách người ở |
| API-S04 | Xem thông tin một phòng | Cách tổ chức đề xuất để đáp ứng FR-03 | Sức chứa, mức phí, số chỗ đã phân bổ/còn lại theo cùng công thức; có thể gộp với S03 |
| API-S05 | Xem trạng thái kỳ đăng ký | Đọc hỗ trợ FR-04, UC-15 | Có thể nằm trong response đăng ký; không cho sinh viên mở/đóng kỳ |
| API-S06 | Gửi đơn với một phòng nguyện vọng | FR-04, UC-15, QT-06/07/08, FR-04/AC01, FR-04/AC02 | Kỳ mở, phòng phù hợp/còn chỗ, không đơn chờ, không lưu trú chưa kết thúc; không giữ chỗ |
| API-S07 | Xem đơn/kết quả của mình | FR-04, UC-16, QT-07/09 | Chờ duyệt, đã duyệt hoặc bị từ chối; thấy lý do từ chối và kết quả phân phòng phù hợp quyền |
| API-S08 | Xem thông tin lưu trú cá nhân | Mô tả phạm vi/actor trang 4-7; Q-13 đã nhận đề xuất | Hồ sơ/phòng được xếp, ngày, trạng thái và lịch sử của mình; không danh sách/liên hệ người cùng phòng, không quyền tự nhận/trả/hủy xếp. Endpoint riêng hay gộp chọn khi thống nhất UI/contract |
| API-S09 | Xem phiếu thu/trạng thái của mình | FR-07, UC-26, QT-14/15/16 | Giữ phiếu sau trả phòng/hủy xếp; sinh viên không tạo phiếu hoặc xác nhận thanh toán |

S07-S09 cần chốt tổ chức list/detail và bộ lọc khi soạn contract; lịch sử lưu trú cá nhân đã được Q-13 đồng ý. Q-12 cho gửi đơn mới khi mọi điều kiện FR-04 đạt, không giới hạn thêm số lần và không sửa/hủy đơn cũ; đơn chờ không tự kết thúc khi phòng đầy/ngừng sử dụng. Tất cả truy vấn phải ràng buộc người sở hữu trên server. Không tạo endpoint hủy đơn đã gửi.

### 3.3. Ban quản lý ký túc xá

| Mã kế hoạch | Thao tác | Nguồn | Ràng buộc chính |
|---|---|---|---|
| API-M01 | Tạo hồ sơ sinh viên | FR-02, UC-07, QT-02/03, FR-02/AC01; Q-26 | BQL tạo qua API; mã sinh viên duy nhất; chưa tự tạo tài khoản/login. Seed trực tiếp DB không thay chức năng này |
| API-M02 | Tìm kiếm/xem hồ sơ sinh viên | FR-02, UC-08, FR-02/AC01 | Tìm mã hoặc tên; phân trang; trả trường đúng mục đích |
| API-M03 | Cập nhật hồ sơ sinh viên | FR-02, UC-07, QT-03; Q-09/Q-10/Q-26 | Vẫn có API sửa; chặn sửa giới tính làm vi phạm lưu trú; mã/quan hệ có tham chiếu theo chuẩn Q-10; không gộp sửa mật khẩu/role vào DTO hồ sơ |
| API-M04 | Xem danh sách/chi tiết tòa nhà | FR-03, UC-11 | Chốt trường tối thiểu và trạng thái nếu có |
| API-M05 | Tạo/cập nhật tòa nhà | FR-03, UC-11 | Không tự suy ra quyền xóa dây chuyền các phòng và lịch sử |
| API-M06 | Xem danh sách/chi tiết phòng | FR-03, UC-12, QT-04/05, FR-03/AC01 | Có thể xem phòng ngừng sử dụng; tính số chỗ thống nhất |
| API-M07 | Tạo phòng | FR-03, UC-12 | Mã phòng, tòa nhà, sức chứa, giới tính tiếp nhận, phí/kỳ, trạng thái |
| API-M08 | Cập nhật phòng/trạng thái sử dụng | FR-03, UC-12, QT-04, FR-03/AC02 | Không giảm sức chứa dưới số đã phân bổ; không ngừng phòng có lưu trú chưa kết thúc |
| API-M09 | Xem thông tin kỳ đăng ký | FR-04, UC-14 | Một kỳ theo QT-06; chưa tự thêm nhiều kỳ hoặc lịch tự động |
| API-M10 | Mở/đóng kỳ đăng ký | FR-04, UC-14, QT-06; Q-11 đã nhận đề xuất | Một kỳ, đóng/mở thủ công; được mở lại cùng kỳ, vẫn xử lý đơn chờ sau đóng; không lịch tự động/đa kỳ |
| API-M11 | Tra cứu danh sách/chi tiết đơn | FR-05, UC-17/18 | Lọc trạng thái, sinh viên, phòng nguyện vọng theo nhu cầu; đủ dữ liệu để xét duyệt |
| API-M12 | Duyệt đơn và xếp phòng | FR-05, UC-17/19, QT-05/08/09/10, FR-05/AC01, FR-05/AC02 | Một thao tác nguyên tử; được chọn phòng khác phù hợp; kiểm tra lại mọi điều kiện tại thời điểm ghi |
| API-M13 | Từ chối đơn | FR-05, UC-18, QT-09, FR-05/AC03 | Chỉ đơn chờ; bắt buộc lý do; không tạo lưu trú/giữ chỗ |
| API-M14 | Xem hồ sơ và lịch sử lưu trú | FR-06, UC-23, QT-16 | Bao gồm hồ sơ đã kết thúc/đã hủy; chốt bộ lọc, thứ tự và trường lịch sử |
| API-M15 | Xác nhận nhận phòng | FR-06, UC-20, QT-11, FR-06/AC01 | Chỉ “Đã xếp phòng”; lưu ngày nhận; không giảm thêm chỗ |
| API-M16 | Hủy xếp phòng vì không đến nhận | FR-06, UC-21, QT-12/16, FR-06/AC02; Q-16 | Thủ công, chỉ “Đã xếp phòng”; bắt buộc lý do, lưu người/thời điểm; giải phóng một chỗ, giữ phiếu/lịch sử; không job tự động |
| API-M17 | Ghi nhận trả phòng | FR-06, UC-22, QT-13/16, FR-06/AC03 | Chỉ “Đang ở”; không chặn chỉ vì chưa thanh toán; lưu ngày trả; không trả chỗ hai lần |
| API-M18 | Xem danh sách/chi tiết phiếu thu | FR-07, UC-24/25, QT-16 | Theo dõi cả phiếu chưa trả của lưu trú đã kết thúc/đã hủy |
| API-M19 | Lập phiếu thu tiền phòng | FR-07, UC-24, QT-14, FR-07/AC01 | Một phiếu/hồ sơ; chỉ lưu trú đã xếp hoặc đang ở; chốt giá phòng lúc lập |
| API-M20 | Xác nhận thanh toán toàn bộ | FR-07, UC-25, QT-15, FR-07/AC02 | Lưu ngày và người xác nhận; không thanh toán từng phần, hoàn tiền hoặc sửa số tiền tùy ý |
| API-M21 | Xem thống kê tổng hợp | FR-08, UC-27, QT-17, FR-08/AC01; SHOULD, Q-22 nhận sau MUST | Đúng bốn chỉ số SRS; số chỗ tổng hợp từ phòng đang sử dụng; rỗng trả 0; chưa thêm doanh thu/export/nhiều kỳ |

Các thao tác liệt kê/chi tiết hỗ trợ M11, M14, M18 cần contract đọc, dù không có UC riêng. Q-19 đã nhận đề xuất không cấp DELETE mặc định theo CRUD, không hard-delete đơn/lưu trú/phiếu, giữ quan hệ/lịch sử; không tự thêm soft-delete mọi bảng hoặc nhật ký bổ sung ngoài ngày/người bắt buộc. Xóa dữ liệu chưa dùng chỉ bổ sung khi được yêu cầu.

### 3.4. Quản trị viên hệ thống

| Mã kế hoạch | Thao tác | Nguồn | Ràng buộc chính |
|---|---|---|---|
| API-A01 | Tra cứu danh sách/chi tiết tài khoản | Đọc hỗ trợ FR-01 | Phạm vi tài khoản; không trả hash/mật khẩu; chưa mặc định trả dữ liệu lưu trú/thu phí |
| API-A02 | Cấp tài khoản | FR-01, UC-04, QT-01/02, FR-01/AC01; Q-26 | Vẫn có qua API Admin; `SV`/`BQL`/`ADMIN`; tài khoản SV gắn hồ sơ đã có, không gắn trùng; hash theo Q-25; seed không thay operation |
| API-A03 | Gán role lúc tạo | FR-01, UC-06, QT-01; Q-07 | Chỉ thuộc bước cấp tài khoản; không API đổi role sau tạo, không đa role |
| API-A04 | Khóa tài khoản | FR-01, UC-05, QT-02, FR-01/AC02; Q-17/Q-26/Q-27 | Qua API Admin; cho tự khóa, có trường trạng thái khóa cho mọi nguồn account; request bảo vệ kế tiếp bị từ chối, không push logout realtime; giữ dữ liệu |
| API-A05 | Mở khóa tài khoản | FR-01, UC-05, FR-01/AC02; Q-26 | Vẫn có qua API Admin; đăng nhập lại được, không mất dữ liệu; không cần bảo vệ Admin cuối theo Q-17 |

Q-17 đã cho Admin tự khóa và khôi phục bằng DB khi cần; không tự thêm bảo vệ Admin cuối hay role “super admin”. Q-26 giữ chức năng Admin trong ứng dụng, nhập DB chỉ để khởi tạo demo. Q-27 yêu cầu API check role/ownership/khóa ở mỗi protected request, giao diện reload sẽ phản ánh kết quả từ chối, không phải ranh giới bảo vệ duy nhất.

## 4. Quyết định đã tiếp nhận và phần kỹ thuật cần ghi chi tiết

Chỉ tiếp nhận đúng nội dung đề xuất đã được chủ dự án đồng ý hoặc lựa chọn AI thực hiện trong phạm vi ủy quyền. Không biến phần “nếu” trong đề xuất thành quyền đã được chốt:

| Chủ đề | Đã có căn cứ | Việc còn lại khi soạn đặc tả |
|---|---|---|
| Auth/account | Q-25 giữ hash; Q-26 giữ FR-01/02, DB chỉ seed; Q-27 guard mỗi request; role bất biến Q-07 | Viết contract cấp/login/đổi mật khẩu/khóa/mở, quy tắc cookie và phiên sau đổi mật khẩu, không bỏ operation gốc |
| Profile | Q-18 bổ sung ngày sinh/địa chỉ, Q-08 nhận trường tối thiểu và không tự thêm giấy tờ/ảnh/CCCD | Độ dài/bắt buộc, DTO theo quyền, khác biệt account với profile; không trả hash/mật khẩu |
| Giới tính/mã | Q-09 nhận nguyên tắc tương thích; Q-10 nhận tách ID/mã và chuẩn hóa; baseline 12 chọn domain prototype MALE/FEMALE, unique phòng theo tòa + mã, mã bất biến sau tạo | Áp lựa chọn DELEGATED_SELECTION chung; không gán thành giá trị do chủ dự án đích thân chọn; viết validation từng operation |
| Kỳ/đơn | Q-11 một kỳ thủ công, mở lại/xử lý đơn chờ sau đóng; Q-12 gửi lại khi đủ điều kiện, không tự kết thúc đơn vì phòng đầy | Request/response/list/detail chính thức và kiểm tra lại khi ghi |
| Lưu trú | Q-13 xem lịch sử cá nhân; Q-16 hủy thủ công có lý do/người/thời điểm | Không tự thêm quyền SV nhận/trả/hủy; tổ chức endpoint riêng hay gộp theo UI/contract |
| Ngày/tiền | Q-14 VND nguyên đồng, không phụ phí; Q-15 tách ngày nghiệp vụ/timestamp Việt Nam; baseline 12 chọn BIGINT VND trả chuỗi, ngày quá khứ/hôm nay, cấm tương lai, trả không trước nhận | Ghi request/response theo chuẩn đã chọn, không thêm API sửa lịch sử; chi tiết này là lựa chọn AI theo ủy quyền |
| Xóa/audit | Q-19 giữ lịch sử, không DELETE mặc định/hard-delete đơn-lưu trú-phiếu/soft-delete đại trà | Không tự tạo endpoint xóa hoặc audit log tổng quát; luôn giữ ngày/người bắt buộc SRS |
| Conventions/retry | Q-20 một chuẩn chung, mapping API/SQL và chống tác dụng phụ lặp; AI chọn chi tiết dùng chung | Dùng đúng revision conventions, không đặt route/field/status riêng theo người |
| UI/SHOULD/QA | Q-21 tiếng Việt/laptop/mobile web/loading-empty-error chung; Q-22 đúng bốn chỉ số sau MUST; Q-23 PostgreSQL thật/test theo stack | Chọn/ghi công cụ và test commands; không báo đã có CI hoặc đã chạy runtime |
| Đầu ra | Q-24 nhận tài liệu hỗ trợ và đầu ra theo công cụ | Bộ đặc tả là đợt được giao riêng; chưa tạo code/DDL/contract thật trong đợt cập nhật kế hoạch |

Các chi tiết kỹ thuật AI chọn phải ghi `DELEGATED_SELECTION` và dẫn tới một quyết định chung, không nói chủ dự án đã trực tiếp chọn chúng. Người nhận việc dùng cùng revision; không tự thêm phương án riêng chỉ vì làm khác vai trò.

## 5. Mẫu bắt buộc cho một operation contract ở bước tiếp theo

Mẫu nằm tại mục này trong giai đoạn lập kế hoạch. Khi tạo bộ contract, đưa nguyên tắc mẫu vào một mục của `API Endpoint/Shared/00-conventions.md`; chưa cần thêm file mẫu ngoài cây đã thống nhất.

Mỗi operation phải có đủ các mục sau, kể cả khi ghi “không áp dụng” có lý do:

1. **Định danh:** operationId duy nhất, tiêu đề, trạng thái draft/reviewed/frozen, người phụ trách và người rà soát, phiên bản contract.
2. **Truy vết:** FR, UC, QT, AC/TC liên quan; phân biệt thao tác nghiệp vụ với thao tác đọc hỗ trợ UI.
3. **Quyền:** vai trò được gọi, điều kiện đăng nhập/trạng thái tài khoản, phạm vi dữ liệu, quyền theo trường; không dựa vào việc UI đã ẩn nút.
4. **HTTP:** method, URL, path/query/header/cookie, content type, yêu cầu xác thực. Quy tắc version, trailing slash và tên tài nguyên phải dẫn chiếu quy ước chung.
5. **Đầu vào:** tên trường, kiểu, bắt buộc, nullable, độ dài/giới hạn, mặc định, trường do server sinh, trường bị cấm; xử lý thiếu/null/rỗng/khoảng trắng và thuộc tính lạ.
6. **Điều kiện trước:** trạng thái hiện tại được phép, dữ liệu liên quan phải tồn tại, các điều kiện thời gian, giới tính, sức chứa hoặc sở hữu.
7. **Xử lý:** từng bước kiểm tra và thứ tự ưu tiên lỗi khi nhiều điều kiện sai; nguồn dữ liệu chuẩn; phép tính, transaction và kiểm tra lại tại thời điểm ghi.
8. **Thay đổi dữ liệu:** đối tượng tạo/sửa, trạng thái trước/sau, trường thời gian/người thao tác, trường không được đổi, ảnh hưởng số chỗ/phiếu/lịch sử.
9. **Thành công:** status HTTP, schema dùng chung, ví dụ JSON nhất quán kiểu dữ liệu, trường có thể rỗng, quy tắc trả dữ liệu sau ghi.
10. **Thất bại:** status HTTP, mã lỗi nghiệp vụ ổn định, thông điệp người dùng, chi tiết theo trường và bảo đảm không để lại thay đổi một phần.
11. **Tính lặp lại và đồng thời:** bấm hai lần, retry sau mất kết nối, hai người sửa một đối tượng, trạng thái đã thay đổi; không giả định kiểm tra từ giao diện đủ bảo vệ.
12. **Kiểm chứng:** ít nhất luồng đúng, dữ liệu sai, sai quyền, sai chủ sở hữu và tình huống trùng/chuyển trạng thái cạnh tranh nếu operation có ghi.
13. **Phụ thuộc:** schema, mã quy tắc, bảng/cột dự kiến, operation trước/sau, dữ liệu thử cần có, câu hỏi/decision chưa đóng.

Mọi ví dụ chỉ dùng dữ liệu giả. Không đưa mật khẩu thật, định danh cá nhân thật hoặc nội dung lỗi từ database vào contract.

## 6. Quy ước dùng chung phải soạn một lần

| Nội dung | Điều cần thống nhất và kiểm tra |
|---|---|
| Danh tính và role | `SV`/`BQL`/`ADMIN`; accountType/actorKind STUDENT/STAFF chỉ là nguồn danh tính. Quyền/ownership/khóa được kiểm tra mỗi request theo Q-27; không tin role từ client |
| URL và ID | Prefix `/api/v1`, UUID; chưa đóng băng URL từng operation. MSSV và mã tòa duy nhất toàn hệ thống; mã phòng duy nhất theo tòa + mã; mã nghiệp vụ bất biến sau tạo theo baseline 12 |
| Tên trường/mapping | JSON camelCase, SQL snake_case có mapping; enum request/response/DB/fixture cùng giá trị. Nguồn chuẩn là baseline số 12, không copy rồi đặt tên khác theo role |
| Enum nghiệp vụ | application PENDING/APPROVED/REJECTED; residence ALLOCATED/CHECKED_IN/ENDED/CANCELLED; receipt UNPAID/PAID; room ACTIVE/INACTIVE; period OPEN/CLOSED. Account dùng is_locked boolean ở SQL và isLocked ở JSON, không thêm enum role/trạng thái ngoài chuẩn |
| Ngày giờ | Ngày nghiệp vụ DATE, API YYYY-MM-DD Việt Nam; timestamp thao tác ISO 8601 UTC. Theo baseline 12 cho ngày quá khứ/hôm nay, không tương lai, ngày trả >= ngày nhận; không có endpoint sửa lịch sử |
| Tiền | BIGINT VND nguyên đồng, không âm; API trả chuỗi số thập phân để giữ chính xác. Một phiếu snapshot giá lúc lập; không floating point/phụ phí tự thêm |
| Danh sách | page/pageSize, mặc định pageSize 20, tối đa 100; sắp xếp ổn định; bộ lọc và tie-break ID ghi rõ ở từng operation |
| Cập nhật | PATCH allowlist; thiếu giữ nguyên, null chỉ cho trường nullable; thuộc tính lạ 422, không nhận entity DB làm request |
| Lỗi | 401 thiếu/sai/hết phiên hoặc khóa; 403 sai role; 404 không tồn tại/ngoài ownership SV; 409 xung đột; 422 input. Body `{ error: { code, message, details? } }`; thành công `{ data }`, list thêm meta; 204 không body |
| Bảo mật đối tượng | Trả 404 khi không thuộc dữ liệu của SV, không lộ nội dung/tồn tại tài nguyên qua message hoặc list/filter; 403 cho chức năng ngoài role |
| Giao diện tích hợp | Cấu hình origin, base URL, credential, giới hạn request phù hợp cơ chế xác thực; không hard-code cấu hình riêng từng máy |
| Phiên bản contract | Cách nhận diện revision và thay đổi phá vỡ tương thích; cập nhật cùng quyết định, UI và test |

Các giá trị kỹ thuật ở bảng này là DELEGATED_SELECTION theo Q-05/Q-20, thống nhất tại baseline số 12; không phải lựa chọn trực tiếp từng chi tiết của chủ dự án. Envelope đã chọn; mã lỗi nghiệp vụ từng tình huống, ví dụ JSON đầy đủ và operation cụ thể sẽ soạn ở đợt đặc tả. Không coi bảng kế hoạch là contract response hoàn chỉnh.

## 7. Danh mục tình huống lỗi nghiệp vụ cần phủ

Các tên dưới đây là **nhãn tình huống**, chưa phải errorCode chính thức:

- Tài khoản bị khóa; sai thông tin đăng nhập; phiên hết hạn; role không được thao tác.
- Hồ sơ sinh viên không tồn tại khi cấp tài khoản; mã sinh viên trùng; hồ sơ đã gắn tài khoản.
- Sinh viên gửi trường ngoài quyền cập nhật hoặc đọc tài nguyên của người khác.
- Kỳ đóng; đã có đơn chờ; đã có lưu trú chưa kết thúc.
- Phòng không tồn tại, ngừng sử dụng, hết chỗ hoặc không phù hợp giới tính.
- Đơn đã được người khác duyệt/từ chối; từ chối không có lý do.
- Giảm sức chứa dưới số phân bổ; ngừng sử dụng phòng còn hồ sơ đang chiếm chỗ.
- Nhận phòng/hủy xếp/trả phòng ở sai trạng thái; yêu cầu lặp sau khi đã thành công.
- Lập phiếu cho hồ sơ không đủ điều kiện; hồ sơ đã có phiếu; thanh toán phiếu đã thanh toán.
- Dữ liệu phụ thuộc đã thay đổi trong khoảng người dùng xem và xác nhận.

Với mỗi tình huống: ghi operation liên quan, QT áp dụng, status/mã lỗi, nội dung được trả và dữ liệu phải giữ nguyên. Không đưa tên constraint, SQL hoặc stack trace ra response người dùng.

## 8. Kế hoạch cho nguyên tử, retry và thao tác đồng thời

Chọn cơ chế kỹ thuật cùng thiết kế SQL; các yêu cầu kết quả sau đã được SRS xác định hoặc là kiểm chứng cần thiết cho chúng:

| Tình huống | Kết quả phải bảo đảm | Contract phải mô tả |
|---|---|---|
| Hai đơn cùng lấy chỗ cuối | Tối đa một thao tác xếp phòng thành công; không âm chỗ | Một thành công, một lỗi phù hợp; đơn thất bại không bị duyệt dở |
| Duyệt và từ chối cùng một đơn | Chỉ một chuyển trạng thái kết thúc được ghi | Operation thua cuộc đọc trạng thái mới và trả lỗi thống nhất |
| Gửi hai đơn đồng thời cho một sinh viên | Tối đa một đơn chờ duyệt | Không chỉ kiểm tra trước rồi insert; lỗi trùng được đổi sang lỗi nghiệp vụ |
| Xếp phòng đồng thời với giảm sức chứa/ngừng phòng | Trạng thái cuối không vi phạm QT-04/05/10 | Các bước ghi dùng cùng nguyên tắc khóa/kiểm tra; response không báo thành công sai |
| Duyệt đơn | Đơn đã duyệt và hồ sơ đã xếp phòng cùng tồn tại hoặc cùng không thay đổi | Một transaction; không chia thành API duyệt trước rồi tạo lưu trú sau |
| Lập phiếu hai lần | Một hồ sơ chỉ có một phiếu; lần lập thêm bị từ chối theo FR-07/AC01 | Không silently tạo phiếu mới; không đổi giá phiếu cũ |
| Nhận phòng hai lần | Chỉ chuyển trạng thái đúng một lần; không trừ chỗ thêm | Mutation lặp trả 409 theo baseline số 12; không replay thành công hoặc trừ thêm chỗ |
| Hủy xếp/trả phòng hai lần | Giải phóng chỗ đúng một lần | Không tăng bộ đếm qua mỗi lần gọi; giữ ngày/người thao tác theo chính sách |
| Xác nhận thanh toán hai lần | Chỉ một lần xác nhận có hiệu lực | Không ghi đè ngày/người xác nhận lần đầu nếu chưa có chính sách sửa |
| Mất response sau ghi thành công | Người dùng tra được kết quả đã ghi; retry không làm trùng | Tải lại trạng thái; mutation trùng trả 409. Logout lặp là ngoại lệ trả 204; chưa thêm idempotency key |

Baseline số 12 chọn mutation lặp trả 409, riêng logout lặp trả 204; lần tạo phiếu thứ hai trả 409, giữ nguyên FR-07/AC01. Idempotency key chưa thuộc chuẩn hiện tại. Chỉ bổ sung bằng quyết định mới khi cần; khi đó phải ghi phạm vi/thời hạn/khác payload/đang xử lý và phân biệt replay của cùng request với lần tạo phiếu thứ hai độc lập.

Không kết luận “frontend disable nút” hoặc “đã SELECT số chỗ” là hoàn thành chống cạnh tranh. Kiểm chứng bằng hai giao dịch/yêu cầu thực sự chồng lấp tại lớp lưu trữ và API sau khi triển khai.

## 9. Phạm vi dữ liệu và DTO theo vai trò

| Nhóm dữ liệu | Sinh viên | Ban quản lý | Quản trị viên |
|---|---|---|---|
| Hồ sơ sinh viên | Hồ sơ mình; chỉ sửa liên hệ | Tạo/tìm/cập nhật theo FR-02 | Chỉ thông tin tối thiểu cần liên kết cấp tài khoản, chi tiết phải chốt; không mặc định có quyền hồ sơ nghiệp vụ |
| Phòng | Thông tin phòng đang sử dụng, không danh sách người ở | Quản lý phòng, sức chứa và trạng thái | Không mặc định có quyền phòng |
| Đơn/lưu trú | Đơn/thông tin lưu trú của mình theo phạm vi đã chốt | Xử lý và tra cứu lịch sử | Không mặc định có quyền nghiệp vụ |
| Phiếu thu | Phiếu của mình | Lập và xác nhận thủ công | Không mặc định có quyền thu phí |
| Tài khoản | Danh tính tối thiểu của mình; không quản trị account | Danh tính tối thiểu của mình; không cấp tài khoản | Quản lý account theo FR-01 |

Tách request cập nhật liên hệ, request quản lý hồ sơ, response hồ sơ cá nhân và response tài khoản. Không nhận passwordHash, số chỗ còn lại, người xác nhận/người sở hữu hay trạng thái thanh toán từ client khi server phải tự xác định. Role chỉ được chọn ở chức năng cấp tài khoản bởi Admin đã được xác thực; role trong login/profile request không cấp quyền. Sinh viên không được gửi thêm trường ngày sinh/địa chỉ vào cập nhật liên hệ chỉ vì response có hai trường này.

## 10. Thứ tự thực hiện và bàn giao

| Bước | Việc thực hiện | Đầu ra / điều kiện qua bước |
|---|---|---|
| API-01 | Tiếp nhận Q-25 đến Q-27 và baseline số 12; kiểm tra phạm vi đợt được giao | Không còn mâu thuẫn plaintext/loại FR-01/02/khóa chỉ theo UI; chi tiết còn cần thiết kế được ghi task, không hỏi lại quyết định đã có |
| API-02 | Chuyển chuẩn thuật ngữ, trạng thái, quyền và conventions đã chọn thành đặc tả dùng chung khi được giao | Các file `Shared/00-conventions.md` đến `Shared/05-concurrency-and-retry.md` có cùng revision, đúng baseline số 12 |
| API-03 | Chốt danh mục operation và file sở hữu | Không trùng method+URL/operationId; phủ các UC trong phạm vi |
| API-04 | Soạn nhóm tài khoản, hồ sơ, phòng và kỳ | Đủ nguồn cho bước cấp account, gửi đơn và mock giao diện |
| API-05 | Soạn đăng ký, duyệt/xếp, nhận/trả, thu phí | Đủ chuyển trạng thái, transaction, lỗi và cạnh tranh |
| API-06 | Soạn bốn thống kê đã được Q-22 nhận, sau các MUST | Công thức và ví dụ đúng QT-17, không thêm chỉ số ngoài phạm vi |
| API-07 | Rà soát với người làm SQL, nghiệp vụ, UI, QA | Tên trường/enum/ID đồng nhất; không có thao tác yêu cầu dữ liệu schema không lưu |
| API-08 | Đóng băng revision contract cho đợt triển khai | Danh sách operation và quyết định được xác nhận; thay đổi sau đó đi qua ghi tác động |
| API-09 | Khi được giao triển khai: tạo mock/kiểm thử và bàn giao | UI có dữ liệu mẫu, API có acceptance, QA có ca sai quyền và cạnh tranh |

Mỗi nhóm file có một người phụ trách và một người rà soát theo `06-COLLABORATION-PLAN.md`. Bùi Thế Anh điều phối, review và phụ trách frontend; các thành viên API bàn giao module/file theo quy ước tích hợp chung, không tự tạo server/auth/DB connection khác nhau. Có thể soạn nhóm vai trò song song sau khi Shared được chốt. Nhóm nghiệp vụ và SQL phải rà M12, M16, M17, M19, M20 trước khi đóng băng. Điều chỉnh API khi làm frontend phải cập nhật contract/consumer/test, không sửa âm thầm một phía.

## 11. Tiêu chí hoàn tất bộ contract

- Có `AGENTS.md` cho phần API và các nhóm việc, nhắc phạm vi repo, không tự commit, nguồn chuẩn và giới hạn sửa file.
- Mọi UC thuộc phạm vi đều được ánh xạ tới operation hoặc kiểm tra nội bộ; UC-19 không bị quên chỉ vì không có endpoint riêng.
- Mỗi operation có đủ template, quyền, schema, ví dụ, status/lỗi, điều kiện trước/sau và liên kết QT/AC/TC.
- Sinh viên không thể đọc dữ liệu người khác qua list, detail, bộ lọc hoặc ID đoán được; request cập nhật không mở quyền qua trường thừa.
- Quyền của ba vai trò được kiểm tra tại API, đúng NFR-01; Admin không được coi là role bao trùm nghiệp vụ.
- Q-25 đến Q-27 được bảo toàn: Argon2id theo lựa chọn kỹ thuật chung, đủ FR-01/02, hồ sơ không tự có account, mọi request bảo vệ kiểm tra role/ownership/khóa. Không dùng việc đổi giao diện theo role làm bằng chứng phân quyền API.
- MSSV và staff username dùng nguồn danh tính phân biệt; session server idle 30 phút, không JWT/refresh flow, không trộn ID của hai nguồn account hoặc lộ password/hash qua DTO.
- Trạng thái “Đã xếp phòng” và “Đang ở” cùng chiếm chỗ; nhận phòng không giảm thêm; hủy/trả giải phóng một lần; thu phí không mất khi lưu trú kết thúc.
- Một schema, một giá trị enum và một mã lỗi có một nguồn định nghĩa; không có bản sao mâu thuẫn giữa các role.
- Không có API ngoài phạm vi được đưa vào MUST mà chưa có quyết định của chủ dự án.
- Mọi câu hỏi ảnh hưởng operation đã đóng hoặc operation được đánh dấu chưa được triển khai; người nhận biết rõ revision nào được phép dùng.
- Kiểm tra liên kết tài liệu và đối chiếu schema/API/business rules đã hoàn tất. Nếu chưa có code, ghi “chưa kiểm thử runtime”, không báo API hoạt động.

## 12. Rủi ro tích hợp cần theo dõi

| Rủi ro | Cách kiểm soát trong kế hoạch |
|---|---|
| Mỗi người tự đặt tên route/field | Chốt Shared trước, danh mục operation trong `API Endpoint/README.md` sở hữu duy nhất, review liên phần |
| Chia role thành ba server/ba kiểu response | Chia tài liệu theo trách nhiệm; thống nhất cùng contract và cùng quy ước hệ thống |
| Trộn tài khoản với hồ sơ sinh viên | Tách mô hình, giữ điều kiện hồ sơ có trước và liên kết một tài khoản |
| UI gửi trạng thái tùy ý | Contract theo hành động được phép, server kiểm tra chuyển trạng thái |
| API và SQL chỉ kiểm tra sức chứa trước ghi | Cùng thiết kế transaction/constraint và kiểm thử hai thao tác đồng thời |
| Phiếu thu tự đổi theo giá hiện tại | Contract trả số tiền đã chốt của phiếu, không tính lại từ giá phòng |
| Gắn xóa dữ liệu vào CRUD chung | Không tạo DELETE khi chưa có quyết định; bảo toàn lịch sử theo QT-16 |
| Contract sửa xong nhưng mock/UI/test dùng bản cũ | Ghi revision, danh sách ảnh hưởng và người nhận bàn giao trong mỗi thay đổi |

Bàn giao phần API phải kèm: danh sách file, operation đã đặc tả, quyết định sử dụng, operation bị chặn, người nhận ảnh hưởng, kiểm tra đã chạy và điều chưa kiểm chứng.
