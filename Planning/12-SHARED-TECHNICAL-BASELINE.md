# Chuẩn kỹ thuật dùng chung cho bước tạo đặc tả

**Ghi chú giai đoạn mới:** tài liệu này giữ nội dung kế hoạch lịch sử. Bộ đặc tả thực tế và các lựa chọn đã chốt xem [baseline revision 1.0.0](13-SPECIFICATION-BASELINE.md). Lệnh chờ tạo đặc tả trong kế hoạch cũ đã được prompt mới thay thế; không dùng các đề xuất cũ để ghi đè contract/schema hiện hành.

Trạng thái: **DELEGATED_SELECTION** cho lựa chọn kỹ thuật của AI trong phạm vi Q-05/Q-20/Q-24; các giới hạn chủ dự án chọn có nhãn OWNER_CONFIRMED và nguồn tương ứng. Đây là chuẩn để hoàn thiện bộ kế hoạch và soạn đặc tả ở đợt sau, chưa phải contract operation/DDL/code đã tạo.

Không nói chủ dự án đã đích thân chọn UUID, Argon2id hay từng HTTP status. Các lựa chọn đó được AI ghi rõ để mọi thành viên không tự chọn khác nhau. Thay đổi chuẩn đi qua decision log và kiểm tra consumer.

## TECH-01 - Kiến trúc và phiên bản

| Phần | Quyết định kế hoạch | Nguồn |
|---|---|---|
| Frontend | Next.js; Bùi Thế Anh thực hiện dựa trên contract và API được bàn giao | OWNER_CONFIRMED Q-01/Q-04 |
| Backend | Express.js, một ứng dụng API chung; các thành viên sở hữu module riêng | Framework OWNER_CONFIRMED Q-01; bố cục module DELEGATED_SELECTION |
| Database | PostgreSQL **18.6**, pin tại thời điểm rà soát; không dùng RC/beta hay tag latest | "Mới nhất" theo Q-01; số phiên bản được xác minh từ nguồn chính thức |
| Môi trường phát triển | Mỗi người code trên máy riêng; Anh pull và kiểm tra trên máy của mình; không tự thay PostgreSQL đã cài | OWNER_CONFIRMED Q-01/Q-04 |
| Bàn giao | Docker/Compose frontend+API+DB, đạt NFR-03; địa chỉ hosting chốt sau | Q-01/Q-02 + SRS |
| Node/Next/Express/package manager | Chọn phiên bản tương thích khi tạo nền ứng dụng; ghi manifest/lockfile và dùng cùng phiên bản trong Docker | Task nền tảng tương lai; chưa cài dependency ở lượt này |

Ngày 30/10/2026, [bảng phiên bản PostgreSQL chính thức](https://www.postgresql.org/support/versioning/) liệt kê 18.6 là bản ổn định mới nhất; 19 RC là bản tiền phát hành. Khi thực sự tạo môi trường, kiểm tra lại patch còn được hỗ trợ rồi ghi quyết định nâng nếu cần, không để mỗi máy tự chọn một bản "latest" khác. Không tự nâng cấp DB người dùng hoặc truy cập dữ liệu thật.

## TECH-02 - Danh tính và vai trò

- Role duy nhất tại một thời điểm: `SV`, `BQL`, `ADMIN` theo Q-05/Q-07. Không tạo super-admin hoặc role kế thừa.
- Role gán lúc tạo, không có API đổi role sau tạo; UC-06 được thực hiện trong cấp tài khoản. Không thêm ma trận đa role.
- Admin cho phép tự khóa; không có guard cấm khóa tài khoản Admin hoạt động cuối (Q-17). Giữ mô tả khôi phục bằng DB cho người vận hành; AI không tự thực hiện khôi phục.
- Mọi endpoint bảo vệ kiểm tra tài khoản, khóa, role và phạm vi bản ghi theo Q-27. Giá trị role lạ bị từ chối, không nhận role mặc định.
- UI chuyển màn hình theo role đã xác thực; role trong request hoặc thông tin lưu ở trình duyệt không cấp quyền.

## TECH-03 - Hồ sơ và hai nhóm tài khoản

Q-26 thay thế ý cũ "có hồ sơ là có tài khoản". Thiết kế kế hoạch giữ ưu tiên tách thông tin đăng nhập sinh viên với nhân sự của Q-05 nhưng bảo toàn vòng đời SRS:

| Nhóm dữ liệu đề xuất | Trách nhiệm | Quan hệ cần giữ |
|---|---|---|
| `student_profiles` | Mã sinh viên, họ tên, giới tính, lớp, khoa, liên hệ, ngày sinh, địa chỉ thường trú | BQL tạo trước; không có password hoặc quyền đăng nhập chỉ nhờ tồn tại |
| `student_accounts` | Password hash, khóa, role SV cố định, thông tin đăng nhập liên kết mã sinh viên | Admin cấp sau; FK tới một hồ sơ có trước; unique một account/hồ sơ |
| `staff_accounts` | Username, password hash, khóa, role BQL hoặc ADMIN | Quản lý tài khoản nhân sự, không trộn dữ liệu lưu trú vào account |

Tên bảng và việc đặt thông tin xác thực SV trong bảng con là lựa chọn kỹ thuật để dung hòa Q-05 với Q-26, không phải tên bảng SRS bắt buộc. Không giữ cột mật khẩu rõ trong hồ sơ chỉ để bám câu trả lời đã bị thay thế.

- Dùng UUID kỹ thuật cho entity; mã sinh viên/mã tòa/mã phòng vẫn là business key, không dùng kiểu số để tránh mất 0 đầu.
- Identity của phiên là `(actorKind, accountId)`; actorKind `STUDENT` hoặc `STAFF` phân biệt kho tài khoản, **không là role thứ tư**.
- Đăng nhập chung có discriminator kỹ thuật accountType `STUDENT/STAFF`, identifier và password: SV nhập mã sinh viên, nhân sự nhập username. Discriminator chỉ chọn kho kiểm tra, server lấy role thực từ DB. Như vậy username nhân sự trùng chuỗi MSSV không tạo quyền sai.
- Các actor quản trị ghi trong lịch sử nghiệp vụ là staff account; mọi FK/người xác nhận phải xác định rõ kho, không có FK mơ hồ tới "một trong hai bảng".
- Schema/migration/fixture dùng một mô hình thống nhất; không để mỗi module tự tạo bảng user riêng.

## TECH-04 - Mật khẩu và phiên

**OWNER_CONFIRMED:** băm mật khẩu theo Q-25, không hoạt động 30 phút theo Q-05, kiểm tra khóa ở request tiếp theo theo Q-27.

**DELEGATED_SELECTION:**

- Dùng Argon2id cho password hash; cách khởi tạo tài khoản demo sinh hash bằng công cụ chung. Mật khẩu demo giả được mô tả cách thay đổi; không lưu mật khẩu thật trong repo.
- Dùng server-side session cho ứng dụng web; cookie chỉ chứa định danh phiên, trạng thái lưu ở phía server với store PostgreSQL. Không dùng JWT/refresh token cho prototype này.
- Idle timeout là 30 phút kể từ request đã xác thực hợp lệ gần nhất; browser reload không vượt qua giới hạn. Đồng hồ/expiry do server quyết định. Không mặc định có polling nền kéo dài phiên khi người dùng không thao tác.
- Đăng nhập đổi session ID; đăng xuất hủy phiên hiện tại; đổi mật khẩu kiểm tra mật khẩu cũ và thu hồi các phiên khác, phiên hiện tại được cấp lại. Không tự bổ sung quên mật khẩu/email/reset UI ngoài phạm vi.
- Cookie HttpOnly; Secure khi HTTPS; cấu hình local HTTP tách khỏi triển khai HTTPS. Ưu tiên cùng origin qua proxy để frontend gọi API; xác thực thay đổi dữ liệu cần cơ chế chống CSRF phù hợp, ghi chi tiết khi tạo contract.
- Không yêu cầu sự kiện logout tức thời: UI xử lý 401 của request tiếp theo và đưa về đăng nhập. Khóa có hiệu lực ở API dù trang hiện tại chưa reload.

[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) là căn cứ chọn password hashing; [tài liệu express-session](https://expressjs.com/en/resources/middleware/session/) xác nhận cookie lưu ID và session ở server, store mặc định trong bộ nhớ dành cho phát triển. Tài liệu đặc tả sẽ chỉ rõ store và timeout; không chỉ đặt thời gian cookie rồi coi là hết hạn phía server.

## TECH-05 - Ngôn ngữ API và SQL

| Chủ đề | Chuẩn chung |
|---|---|
| Prefix API | `/api/v1`; route từng operation được tạo ở đợt đặc tả |
| JSON | camelCase; không trả entity DB trực tiếp |
| SQL | snake_case cho bảng/cột; mapping trong data dictionary |
| ID kỹ thuật | UUID dạng chuỗi JSON |
| Chuỗi đầu vào | Trim các mã/tên/liên hệ phù hợp; không trim hoặc biến đổi password |
| Required/null | Phân biệt thiếu, null và rỗng; request ghi có allowlist, thuộc tính lạ bị từ chối 422 |
| Cập nhật | PATCH với field allowlist; thiếu = giữ, null chỉ cho trường nullable; không gửi toàn bộ entity |
| Tài nguyên cá nhân | Suy ra sinh viên từ phiên ở server; không nhận studentId tùy ý để đổi chủ thể |
| Source chuẩn | Markdown contract và Shared DTO chuẩn; OpenAPI/request mẫu là dẫn xuất được đối chiếu |

## TECH-06 - Enum nghiệp vụ

| Đối tượng | Giá trị máy | Nhãn Việt |
|---|---|---|
| Đơn | PENDING / APPROVED / REJECTED | Chờ duyệt / Đã duyệt / Bị từ chối |
| Hồ sơ lưu trú | ALLOCATED / CHECKED_IN / ENDED / CANCELLED | Đã xếp phòng / Đang ở / Đã kết thúc / Đã hủy |
| Phiếu thu | UNPAID / PAID | Chưa thanh toán / Đã thanh toán |
| Phòng | ACTIVE / INACTIVE | Đang sử dụng / Ngừng sử dụng |
| Kỳ | OPEN / CLOSED | Đang mở / Đã đóng |
| Tài khoản | is_locked ở DB, isLocked ở DTO phù hợp | false = Hoạt động, true = Bị khóa |
| Giới tính trong prototype | MALE / FEMALE | Nam / Nữ; cùng domain cho sinh viên và phòng |

Tên enum tiếng Anh là lựa chọn kỹ thuật; chuyển trạng thái giữ SRS. Domain giới tính MALE/FEMALE là lựa chọn giới hạn cho prototype dựa trên ví dụ SRS; không tự thêm phòng MIXED hoặc diễn giải thành danh mục cho mọi hệ thống thực tế. Nếu dữ liệu cần domain khác, thay quyết định chung trước khi nhập, không tự mở rộng riêng một module.

## TECH-07 - Tiền, ngày và dữ liệu nền

- VND nguyên đồng; cột tiền chính xác đề xuất BIGINT, JSON số tiền là chuỗi thập phân như `"1000000"`, không dùng dấu chấm phân cách hoặc số thực. UI định dạng theo tiếng Việt.
- Phí không âm; cho 0 trong prototype; phiếu 0 vẫn khởi tạo UNPAID, không tự xác nhận thanh toán. Không thêm thu từng phần, hoàn tiền, phạt hoặc hạn trả tiền.
- Không áp một mức phí cố định từ ví dụ SRS; snapshot tại lúc lập phiếu, không phải tại lúc xếp phòng.
- Ngày nghiệp vụ là DATE `YYYY-MM-DD`, múi giờ Việt Nam `Asia/Ho_Chi_Minh`; timestamp kỹ thuật lưu TIMESTAMPTZ và trả ISO 8601 UTC.
- BQL có thể nhập ngày nghiệp vụ quá khứ hoặc hôm nay, không ngày tương lai; ngày trả không trước ngày nhận. Server vẫn ghi riêng người và thời điểm thao tác. Không có endpoint sửa lịch sử sau xác nhận trong phạm vi prototype.
- Mã sinh viên và mã tòa trim/viết hoa; mã sinh viên duy nhất toàn hệ thống, mã tòa duy nhất; mã phòng duy nhất theo cặp tòa + mã phòng. Mã nghiệp vụ bất biến sau tạo trong API prototype.
- Lớp và khoa là hai trường riêng; điện thoại/email là chuỗi và có thể chưa điền khi tạo hồ sơ, khi có phải hợp lệ; thêm ngày sinh và địa chỉ thường trú theo Q-18. Required/null/độ dài chi tiết được hoàn thiện trong data dictionary, không lấy ngày sinh giả hoặc chuỗi rỗng để lấp dữ liệu thiếu.
- Không thêm hard-delete đơn/lưu trú/phiếu, không soft-delete tất cả bảng. Danh mục đang được tham chiếu giữ quan hệ. Không thêm nhật ký tổng quát ngoài trường actor/time và lịch sử SRS cần.

Những giới hạn nhập ngày, phí 0 và scope mã phòng là lựa chọn chi tiết được ghi công khai trong kế hoạch để nhóm rà khi tạo đặc tả, không nói đây là câu chữ của SRS.

## TECH-08 - Response, lỗi và danh sách

- Thành công có body: `{ data: ... }`; danh sách bổ sung `meta` gồm page, pageSize, totalItems, totalPages. Response 204 không có body.
- Lỗi có `{ error: { code, message, details? } }`; code nghiệp vụ ổn định, message tiếng Việt, details theo trường khi phù hợp. Không lộ SQL/stack trace/hash.
- 401: chưa có phiên hợp lệ, hết hạn hoặc account đã khóa; 403: role không được phép; 404: không tồn tại hoặc tài nguyên ngoài ownership của sinh viên; 409: trùng/xung đột/trạng thái không còn hợp lệ; 422: input sai; 500: lỗi chưa dự kiến không lộ nội bộ.
- Phân trang page từ 1, pageSize mặc định 20, tối đa 100; sort có khóa phụ ID để ổn định. Trang vượt cuối trả danh sách rỗng; bộ lọc sai bị 422. Cùng định nghĩa search/filter cho UI và backend.
- Không HTTP-200 hóa lỗi để frontend đoán. Danh mục code từng tình huống sẽ viết ở Shared/04-errors.md, không mỗi owner đặt riêng.

## TECH-09 - Request lặp và cạnh tranh

- Thao tác ghi nghiệp vụ đã hoàn thành, gọi lại như một lần tạo/chuyển trạng thái mới trả 409 và không sửa dữ liệu thêm. Logout lặp là ngoại lệ an toàn trả 204.
- Không thêm Idempotency-Key/store riêng trong prototype. Khi mất response, UI tải trạng thái hiện tại; không gửi bù bằng thao tác ghi mù.
- Phiếu thứ hai cho cùng hồ sơ bị từ chối đúng FR-07/AC01; không biến request tạo mới thành trả thành công giả.
- Duyệt/xếp phòng phải atomic; unique/FK/transaction phải bảo vệ đồng thời. Một CHECK một dòng không thay kiểm soát sức chứa liên dòng.
- Mọi thao tác chạm phòng/sinh viên/đơn/hồ sơ/phiếu dùng cùng protocol transaction và thứ tự khóa; protocol cụ thể sẽ thiết kế trong tài liệu SQL, không tự chọn theo module.

## TECH-10 - Các chính sách đã nhận theo đề xuất cũ

- Một kỳ đăng ký, mở/đóng thủ công; đóng vẫn xét đơn cũ; có thể mở lại cùng kỳ, không job tự mở/đóng.
- Được gửi đơn mới khi không còn đơn chờ/hồ sơ mở và các điều kiện FR-04 đạt; không giới hạn số lần ngoài SRS, không sửa/hủy đơn cũ.
- Phòng nguyện vọng đầy sau gửi không tự từ chối đơn; BQL có thể xếp phòng khác phù hợp hoặc từ chối có lý do.
- Sinh viên xem phòng được xếp, trạng thái/ngày và lịch sử cá nhân; không thấy danh sách/liên hệ bạn cùng phòng.
- Hủy xếp phòng do không đến nhận là thủ công, chỉ ALLOCATED, có lý do/người/thời điểm, không job tự hủy.
- Trả/hủy không mất phiếu hay lịch sử, không chặn trả chỉ vì còn nợ. Thống kê gồm đúng bốn chỉ số, sau MUST; không thêm doanh thu/export.

## TECH-11 - Chưa nằm trong quyết định kỹ thuật hiện tại

Thông số môi trường thật, domain/hosting, năng lực/giờ làm mỗi người, owner cụ thể từng nhóm API và exact dependency versions không được suy đoán. Chúng là đầu vào của task tương lai; không làm các quyết định 24+3 câu trả lời trở lại trạng thái chưa có.

Framework/gói PostgreSQL driver, công cụ migration, TypeScript hay JavaScript phải chốt ở task nền tảng trước khi viết code; đặc tả transport và dữ liệu trong file này không phụ thuộc việc mỗi người quen ngôn ngữ nào. Đề xuất thống nhất TypeScript khi triển khai, nhưng chưa có manifest hoặc mã ứng dụng trong đợt này.
