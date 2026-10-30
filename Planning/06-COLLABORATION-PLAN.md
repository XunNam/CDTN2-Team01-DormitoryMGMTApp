# Kế hoạch phối hợp 4 thành viên và các AI

**Ghi chú giai đoạn mới:** tài liệu này giữ nội dung kế hoạch lịch sử. Bộ đặc tả thực tế và các lựa chọn đã chốt xem [baseline revision 1.0.0](13-SPECIFICATION-BASELINE.md). Lệnh chờ tạo đặc tả trong kế hoạch cũ đã được prompt mới thay thế; không dùng các đề xuất cũ để ghi đè contract/schema hiện hành.

**Trạng thái: `PLAN_RECONCILED`.** Kế hoạch được cập nhật theo câu trả lời Q-01..Q-24 và xác nhận tiếp theo Q-25..Q-27. Danh tính, vai trò phối hợp và các mốc ngày đã được chủ dự án cung cấp; phân công từng gói API và lịch chi tiết bên dưới vẫn là `PROPOSED`. Lượt này chỉ hoàn thiện kế hoạch, chưa tạo contract, DDL hoặc ứng dụng.

**Điều đã xác nhận:** nhóm có 4 người; dùng chung repository; frontend dùng Next.js, API dùng Express.js và database dùng PostgreSQL 18.6 theo quyết định đã ghi. Bùi Thế Anh làm frontend, điều phối, giữ ownership, review và tích hợp thủ công. Ba thành viên còn lại làm API được giao trên máy riêng. Cuối dự án đóng gói bằng Docker; môi trường triển khai web/máy chủ ảo chưa xác định. Mọi AI tuân thủ giới hạn Git tại [AGENTS gốc](../AGENTS.md).

**Q-25..Q-27 đã được làm rõ:** giữ mật khẩu băm và đầy đủ FR-01/FR-02 theo SRS; sửa DB trực tiếp chỉ phục vụ khởi tạo/demo; BQL vẫn tạo/quản lý hồ sơ và Admin vẫn có thao tác cấp/quản lý tài khoản đúng quyền. Role `SV`/`BQL`/`ADMIN` bất biến sau tạo; backend kiểm tra role, ownership và trạng thái khóa tại mỗi request bảo vệ, tài khoản khóa bị từ chối ở request tiếp theo, không cần sự kiện đẩy. Xem nguồn xác nhận tại [rà soát câu trả lời](11-ANSWER-REVIEW.md) và chuẩn chung trong [sổ quyết định](10-DECISIONS-AND-HANDOFF.md). Không còn blocker ở ba câu này; điều đó chưa mở phạm vi viết code trong lượt này.

## 1. Mục tiêu và giới hạn

Mục tiêu là các phần do 4 người xây dựng có thể ghép thành một hệ thống thống nhất về dữ liệu, quyền, trạng thái và hành vi nghiệp vụ. Mỗi thành viên cần biết mình được sửa file nào, đang phụ thuộc quyết định nào và cần bàn giao gì.

Phạm vi tài liệu gồm phân việc, quyền sở hữu tài liệu, thứ tự phụ thuộc, quy trình thay đổi, kiểm tra chéo, bàn giao và cách cho AI đọc repo. Không phải lịch cam kết, API contract hay quy trình Git đã được áp dụng.

Đầu ra của bước thực hiện tiếp theo, nếu được chủ dự án yêu cầu, dự kiến gồm danh mục task, phân công gói API cho từng người, các quyết định kỹ thuật/nghiệp vụ đã chốt và checklist tích hợp. Đã có tên thật nhưng chưa có giao việc chi tiết. Việc người dùng điền file câu hỏi chưa tự động cho phép chuyển sang triển khai.

Đọc [sổ quyết định](10-DECISIONS-AND-HANDOFF.md), [rà soát/xác nhận tiếp theo](11-ANSWER-REVIEW.md) và [chuẩn kỹ thuật](12-SHARED-TECHNICAL-BASELINE.md) trước; [câu trả lời gốc](09-OWNER-QUESTIONS.md) dùng truy vết lịch sử. Phần xác nhận tiếp theo làm rõ hoặc thay thế câu trả lời cũ về mật khẩu, DB-only và khóa. Không dùng Q-05/Q-18 cũ để coi một dòng sinh viên tự có quyền đăng nhập; tài khoản phải được cấp theo QT-02. Deadline, stack và phạm vi SRS đã rõ; số giờ mỗi tuần và giao từng gói API còn do Anh bố trí.

## 2. Tại sao không chia thành 3 hệ thống theo 3 role

Không giao mỗi người tự xây một backend riêng cho Sinh viên, Ban quản lý ký túc xá và Quản trị viên. Một đơn đăng ký xuất hiện ở màn hình sinh viên và màn hình duyệt của Ban quản lý nhưng phải dùng cùng bản ghi, định nghĩa trạng thái và quy tắc chuyển trạng thái. Tương tự, sức chứa, hồ sơ lưu trú và phiếu thu phải nhất quán giữa các màn hình.

Các thư mục API theo role nhằm giúp người đọc tìm contract liên quan tới quyền của mình. Chúng không tạo ra ba bản định nghĩa độc lập cho cùng tài nguyên. Kiểu dùng chung, danh mục lỗi, enum và quy tắc dữ liệu có một nơi định nghĩa; các file role tham chiếu tới đó.

**Cách chia theo Q-04:** Anh làm frontend dựa trên API của ba thành viên còn lại. Các task API được chia theo nhóm nghiệp vụ; mỗi nhóm phải xem cả thao tác đầu vào lẫn tác động ở role còn lại. Anh nhận bàn giao và tích hợp phần tương ứng, không yêu cầu ba người làm thêm frontend. Những phần nền dùng chung được chốt trước khi nhiều người triển khai đồng thời.

## 3. Vai trò điều phối và quyền sở hữu

### 3.1. Quyền sở hữu là trách nhiệm điều phối

- Mỗi task có đúng một người phụ trách chính và ít nhất một người rà soát khi liên quan phần dùng chung hoặc dữ liệu nhạy cảm.
- Người phụ trách chính chịu trách nhiệm trả lời câu hỏi, đồng bộ tài liệu và bàn giao kết quả; không có nghĩa các thành viên khác bị cấm đọc hoặc đề xuất sửa.
- Không sửa đồng thời cùng file dùng chung khi chưa thống nhất người đang giữ lượt chỉnh sửa. Ghi rõ phạm vi sửa và thời điểm bàn giao; không dựa vào AI tự nhận biết các thay đổi chưa được chia sẻ.
- Bùi Thế Anh là điều phối viên, người giữ ownership và review theo Q-04. Mọi thành viên đều có thể góp ý qua repo; câu hỏi nghiệp vụ còn OPEN vẫn cần chủ dự án giải quyết.
- AI hỗ trợ một người thực hiện task; AI không là người phê duyệt nghiệp vụ hoặc người tự thực hiện commit/push/merge.
- Các mã TV1-TV4 dưới đây chỉ là định danh thành viên, không phải mức năng lực hoặc tự động giao một mảng API cụ thể.

### 3.2. Thành viên đã xác nhận và gói API chưa giao

| Mã | Thành viên | Trách nhiệm theo Q-04 | Thông tin năng lực/thời gian |
|---|---|---|---|
| TV1 | Bùi Thế Anh | Frontend Next.js; điều phối; ownership; review; kiểm tra API; tích hợp thủ công; điều chỉnh API có truy vết khi cần cho frontend | Có thế mạnh frontend và sử dụng AI; chưa có số giờ/tuần |
| TV2 | Trần Quốc Vương | Phát triển phần API Express.js được Anh giao; tự kiểm tra và bàn giao phần riêng | Có khả năng sử dụng Claude; chưa có số giờ/tuần |
| TV3 | Nguyễn Đỗ Tuấn Kiệt | Phát triển phần API Express.js được Anh giao; tự kiểm tra và bàn giao phần riêng | Thế mạnh và số giờ/tuần chưa xác định |
| TV4 | Trần Tuấn Kiệt | Phát triển phần API Express.js được Anh giao; tự kiểm tra và bàn giao phần riêng | Thế mạnh và số giờ/tuần chưa xác định |

Q-04 đánh số “Thành viên 3” hai lần nhưng có bốn tên khác nhau. Tài liệu dùng TV4 cho người được liệt kê cuối, giữ nguyên câu trả lời gốc trong file 09.

**Đề xuất chia gói, chưa gán cho TV2/TV3/TV4:**

| Gói | Phạm vi dự kiến | Liên hệ giao diện do Anh thực hiện | Điểm phối hợp bắt buộc |
|---|---|---|---|
| API-A | Nền API, xác thực/phân quyền; đầy đủ FR-01/FR-02 theo SRS; dữ liệu tòa/phòng và tìm kiếm | Đăng nhập, quản lý tài khoản/hồ sơ đúng quyền, danh mục và tìm phòng | Auth/DTO dùng chung, sửa sức chứa và giới tính ảnh hưởng gói B |
| API-B | Kỳ đăng ký; gửi/theo dõi đơn; duyệt/từ chối; xếp/nhận/hủy/trả phòng và lịch sử | Luồng sinh viên gửi đơn và BQL xử lý/lưu trú | Sức chứa từ gói A; hồ sơ lưu trú cấp dữ liệu cho gói C; giao dịch/đồng thời |
| API-C | Phiếu thu, xác nhận đủ tiền, tra cứu khoản phí riêng; đúng bốn chỉ số thống kê đã nhận tại Q-22 | Các màn hình phiếu thu, khoản phí và thống kê | Giá phòng từ gói A; hồ sơ từ gói B; snapshot/không trùng phiếu/giữ lịch sử |

Anh sẽ gán từng gói hoặc tách nhỏ sau khi xem năng lực và khối lượng; không suy ra TV2=API-A, TV3=API-B hoặc TV4=API-C. Gói B có thể cần chia thêm task để cân tải. Một người điều phối schema và một người rà kiểm thử chung sẽ được Anh chỉ định trong task, chưa tự gán cho thành viên cụ thể.

Mỗi người làm kiểm thử và tài liệu cho phần API của mình. Anh review và tích hợp frontend/API; người được chỉ định kiểm thử chung không gánh toàn bộ kiểm thử của nhóm. Mỗi người gửi đề xuất dữ liệu cho phần mình để người điều phối schema và Anh kiểm tra trước khi tích hợp.

Khi khối lượng thực tế không đều, tách một task nhỏ có đầu ra và phụ thuộc rõ để đổi người. Không chuyển nguyên mảng lớn giữa chừng mà không bàn giao. Người thay thế đọc task và quyết định hiện hành trước khi sửa.

### 3.3. Quyền sở hữu các tài liệu dùng chung

| Nhóm tài liệu/tài nguyên | Người điều phối đề xuất | Người rà soát bắt buộc hoặc theo ảnh hưởng | Quy tắc chỉnh sửa |
|---|---|---|---|
| Quyết định, glossary, danh mục enum/trạng thái, kiểu dùng chung của API | TV1 - Anh | Người phụ trách các API bị ảnh hưởng | Định nghĩa một lần; file role chỉ tham chiếu |
| `SQL/schema.sql`, danh mục ràng buộc và migration khi được yêu cầu | Anh điều phối; người soạn do Anh chỉ định | Người đề xuất thay đổi + ít nhất một người khác | Chốt bảng/cột/ràng buộc cùng contract trước khi tích hợp |
| `Business Rules/` | Chủ dự án quyết định nghiệp vụ; người đang làm luồng chuẩn bị đề xuất | Người làm luồng phía trước/phía sau | Không coi cách viết code hiện tại là nguồn thay thế SRS |
| Danh mục quyền | TV1 - Anh; người viết auth do Anh chỉ định | Người làm chức năng liên quan | Rà role, ownership và khóa tại mỗi request bảo vệ; role bất biến sau tạo |
| Thành phần UI chung | TV1 - Anh | Thành viên đọc contract hoặc thử giao diện | Một bộ trạng thái loading/empty/error và cách hiển thị lỗi |
| Bộ kiểm thử liên phần, dữ liệu mẫu | Anh điều phối; người thực hiện từng test được ghi trong task | Người viết API liên quan và một người khác | Dữ liệu giả; cùng enum và ngày giờ đã chốt |
| AGENTS và hướng dẫn chạy dự án | TV1 - Anh | Ít nhất một người mới đọc thử | Không nới quyền tự commit/push hoặc sửa ngoài repo |

Các đường dẫn đầu ra ngoài `Planning/` là vị trí dự kiến, không khẳng định file đã tồn tại ở đợt lập kế hoạch này.

### 3.4. Phần bàn giao riêng và một ứng dụng chung

- Theo Q-04, thành viên bàn giao phần riêng và không tự merge code của người khác; Anh kiểm tra và tích hợp. AI không tự thực hiện commit/push/merge dù người dùng sẽ tự dùng GitHub để trao đổi code.
- **Đề xuất cấu trúc:** các API là module/file có phạm vi rõ trong một backend Express.js. Dùng một app entrypoint, một cơ chế kết nối schema PostgreSQL và một lớp xác thực/phân quyền chung. Không tạo ba server, ba schema hoặc ba cơ chế auth độc lập theo người làm.
- Một file contract cho mỗi endpoint/operation là cách giúp người nhận đọc và giao việc rõ; phần Shared giữ DTO/enum/error chung. Quy ước file code sẽ được ghi trong kế hoạch cấu trúc, không hiểu “file riêng” thành cấm tách module cần thiết hoặc ép toàn bộ chương trình của một người vào một file lớn.
- Mỗi phần bàn giao cần ghi API export/router, file phụ thuộc, input/output, quyền, transaction và cách chạy thử. Thành viên không tự sửa module của người khác hoặc app entrypoint dùng chung nếu task chưa giao quyền sửa.
- Nếu cần thay đổi shared auth/schema, gửi đề xuất và tác động cho Anh; chỉ người được giao chỉnh sửa mới cập nhật nguồn chung. Không chép một bản auth/DB riêng vào module để tránh phụ thuộc.
- Khi Anh điều chỉnh API để frontend dùng được, cập nhật contract, mapping UI và test cùng bản ghi quyết định; các thành viên nhận lại chuẩn mới trước khi tiếp tục. Không giữ một contract cho người làm API và một contract khác cho frontend.

## 4. Những hợp đồng chung phải chốt trước khi chia code

Đề xuất có một checklist chung với trạng thái `OPEN`/`CONFIRMED` cho từng mục. Chưa chốt mục nào thì task phụ thuộc mục đó phải ghi rõ đang chờ; có thể tiếp tục các phần độc lập.

| Hợp đồng | Nội dung phải thống nhất | Tác động nếu mỗi AI tự chọn |
|---|---|---|
| Nền kỹ thuật | Next.js + Express.js + PostgreSQL 18.6; dùng phiên bản/công cụ/conventions đã ghi tại sổ quyết định, không chọn riêng theo người | Code khó ghép và không chạy cùng một môi trường |
| Tài khoản và phiên | Mật khẩu băm; đầy đủ chức năng SRS; server session 30 phút idle theo baseline 12; role/ownership/locked kiểm tra mỗi request bảo vệ theo Q-27 | UI/backend hiểu khác nhau về người đang thao tác |
| RBAC và phạm vi bản ghi | Ba role của SRS; thao tác được phép; sở hữu dữ liệu; dữ liệu được trả ra | Lộ dữ liệu hoặc sai quyền nghiệp vụ |
| API | Phiên bản, URL, method, request/response, status code, lỗi, trường bắt buộc, phân trang/lọc/sắp xếp | Các phần gọi nhau không khớp |
| Tên và kiểu dữ liệu | Tên trường API, cách ánh xạ DB, ID, enum, null, chuỗi rỗng, độ dài, chuẩn hóa | Dữ liệu mất nghĩa hoặc kiểm tra đầu vào không nhất quán |
| Trạng thái | Danh mục trạng thái, chuyển hợp lệ, quyền chuyển, sự kiện và tác dụng phụ | Một màn hình cho phép hành động mà phần khác từ chối |
| Thời gian | Múi giờ nghiệp vụ, cách lưu/trả timestamp, ngày không có giờ, mốc kỳ hạn | Sai hạn đăng ký hoặc sai báo cáo theo ngày |
| Tiền và báo cáo | Đơn vị tiền, độ chính xác, làm tròn, thời điểm chốt giá, công thức chỉ số | Phiếu thu và báo cáo không đối chiếu được |
| Nhất quán dữ liệu | Ranh giới giao dịch; xử lý cạnh tranh; dữ liệu duy nhất; lặp thao tác; rollback | Vượt chỗ, trùng hồ sơ hoặc ghi nhận tiền sai |
| Kiểm thử | Dữ liệu mẫu, tình huống đúng/sai quyền, đồng thời, chạy lại, lỗi giữa chừng | Mỗi người chứng minh một hành vi khác nhau |

Mọi mục đang đề xuất cần gắn nguồn SRS hoặc mã quyết định. Không tự điền lựa chọn kỹ thuật vào checklist rồi gắn nhãn đã chốt. Chi tiết cần chủ dự án trả lời được giữ trong [file câu hỏi](09-OWNER-QUESTIONS.md).

## 5. Thứ tự triển khai đề xuất và điều kiện chuyển bước

| Bước | Công việc | Có thể song song | Điều kiện đầu ra |
|---|---|---|---|
| 0. Hoàn thiện kế hoạch hiện tại | Kết hợp Q-01..Q-24 và xác nhận Q-25..Q-27, cập nhật người/lịch/stack/phạm vi | Các kế hoạch API/DB/nghiệp vụ/cộng tác được rà chéo | `PLAN_RECONCILED`; không còn blocker Q-25..Q-27; chưa sinh contract/code |
| 1. Chốt phạm vi đợt tiếp theo | Đọc câu trả lời; ghi quyết định; xác định việc nào được thực hiện trong prompt tiếp theo | Hoàn thiện thuật ngữ và ma trận truy vết không phụ thuộc câu hỏi mở | Có danh sách quyết định, việc được phép làm và điểm còn chờ |
| 2. Chốt mô hình chung | Quyền, trạng thái, quan hệ dữ liệu, quy tắc tiền/sức chứa, hợp đồng nền | Các luồng có thể chuẩn bị bản nháp; phần chung được rà tập trung | Không còn mâu thuẫn nền ảnh hưởng task sắp bắt đầu |
| 3. Tạo bộ contract/DDL/nghiệp vụ | Chỉ khi có yêu cầu tiếp theo; API theo role dùng định nghĩa chung; schema; quy tắc và ca nghiệm thu liên kết | TV2-TV4 góp phần API được giao; Anh review/tích hợp tài liệu | API, SQL và quy tắc khớp tên/enum/quyền/ràng buộc; có rà soát chéo |
| 4. Dựng nền ứng dụng | Chỉ làm nếu được chủ dự án yêu cầu; cấu trúc source, truy cập DB, xác thực và thành phần dùng chung | Chuẩn bị dữ liệu giả và mock từ contract đã chốt | Một luồng thử đi qua giao diện/API/DB chạy được; hướng dẫn chạy dùng được |
| 5. Xây API và frontend | TV2-TV4 làm gói API được Anh giao; Anh nhận bàn giao và làm frontend tương ứng | Các API độc lập có thể làm song song khi contract ổn định | Mỗi task có kiểm chứng, tài liệu và bàn giao; UI/API được thử cùng nhau |
| 6. Tích hợp từng phần | Chủ dự án tích hợp thủ công theo phụ thuộc; nhóm kiểm tra luồng đầu-cuối | Rà tài liệu và các luồng chưa đụng cùng file | Không có sai khác contract; tình huống lỗi quan trọng đã kiểm tra |
| 7. Nghiệm thu | Đối chiếu FR/QT/UC/AC/TC; chạy kịch bản; ghi hạn chế và kết quả | Chuẩn bị minh chứng và tài liệu hướng dẫn | Chủ dự án xác nhận kết quả; AI không tự phát hành |

Luồng phụ thuộc cốt lõi: **quyền + dữ liệu phòng → gửi đơn → duyệt và tạo hồ sơ lưu trú nhất quán → nhận/kết thúc lưu trú → phiếu thu/báo cáo theo đúng dữ liệu nguồn**. Đây là thứ tự kiểm tra tích hợp; thao tác lập phiếu thu cụ thể phải tuân theo SRS và quyết định của chủ dự án.

Các mốc Q-03 đã có: mục tiêu hoàn tất tính năng **28/11/2026**, hoàn tất trước **20/12/2026**, nộp **23/12/2026**. Kế hoạch dùng **19/12/2026** làm hết đệm nội bộ; lịch chi tiết tại [08-WORK-BREAKDOWN.md](08-WORK-BREAKDOWN.md) vẫn là đề xuất vì chưa có số giờ/tuần và phân công gói API. Không kéo dài thêm mười tuần kể từ ngày 30/10.

## 6. Quy trình một task từ nhận việc đến hoàn tất

### 6.1. Điều kiện sẵn sàng

Một task chỉ đủ điều kiện bắt đầu phần phụ thuộc nghiệp vụ/kỹ thuật khi có:

1. Mã task ổn định, mục tiêu và FR/QT/UC/AC/TC liên quan đã đối chiếu nguồn.
2. Người phụ trách, người rà soát và danh sách file dự kiến sửa.
3. Danh sách đầu ra cụ thể, tiêu chí kiểm chứng và phạm vi không làm.
4. Phụ thuộc đã có đầu ra hoặc kế hoạch mock được cả bên cung cấp và bên sử dụng thống nhất.
5. Quyết định cần dùng đã được ghi lại; câu hỏi còn mở không bị thay bằng giả định ẩn.
6. Kiểm tra trạng thái Git chỉ đọc, nhận diện thay đổi đang có và tránh ghi đè công việc khác.

### 6.2. Mẫu task đề xuất

```text
Task: TASK-<số ổn định>
Tiêu đề:
Trạng thái công việc:
Người phụ trách:
Người rà soát:
Phạm vi được chủ dự án yêu cầu trong đợt này:
Nguồn: FR-..., QT-..., UC-..., AC-.../TC-... (chép đúng mã trong SRS)
Quyết định đang áp dụng:
Mục tiêu và hành vi đầu ra:
Đầu ra/file được sửa:
Phần dùng chung cần phối hợp:
Phụ thuộc và ai cung cấp:
Câu hỏi còn mở + mục nào đang bị chặn:
Tiêu chí chấp nhận:
Kiểm chứng dự kiến:
Rủi ro quyền/dữ liệu/đồng thời/tiền:
Kết quả bàn giao:
```

Mã nguồn trong mẫu chỉ minh họa cách ghi; không tự tạo thêm mã yêu cầu rồi trình bày như mã SRS. Nếu task là tài liệu thì tiêu chí kiểm chứng có thể là đối chiếu nguồn và kiểm tra liên kết; không báo đã chạy ứng dụng.

### 6.3. Trạng thái công việc

Các trạng thái bên dưới chỉ dùng cho task, không phải enum nghiệp vụ hay enum database:

| Trạng thái đề xuất | Khi dùng | Điều kiện chuyển tiếp |
|---|---|---|
| `BACKLOG` | Đã nhận diện việc nhưng chưa đủ ưu tiên/phụ thuộc | Chủ dự án hoặc điều phối viên làm rõ phạm vi |
| `READY` | Đủ điều kiện sẵn sàng và chưa ai đang làm | Anh gán người phụ trách cụ thể, xác nhận file sở hữu |
| `IN_PROGRESS` | Đang thực hiện một đầu ra đã xác định | Có bàn giao hoặc xác định trở ngại cụ thể |
| `BLOCKED` | Không thể làm tiếp phần phụ thuộc một quyết định/đầu ra | Ghi điều bị chặn, người có thể giải quyết; tiếp tục phần độc lập nếu có |
| `READY_FOR_REVIEW` | Đã tự kiểm tra; có thay đổi và bằng chứng để người khác xem | Người rà soát nhận xét và ghi kết luận |
| `CHANGES_REQUESTED` | Có vấn đề cần sửa trước tích hợp | Sửa và kiểm chứng lại đúng phạm vi ảnh hưởng |
| `READY_FOR_OWNER` | Rà soát xong; chờ chủ dự án kiểm tra/tích hợp thủ công | Chủ dự án quyết định tích hợp hoặc trả lại |
| `DONE` | Đầu ra trong phạm vi task đã được xác nhận hoàn tất | Nếu là code liên phần, cần xác minh trên bản đã tích hợp; không đồng nghĩa đã phát hành |
| `CANCELLED` | Chủ dự án hủy hoặc thay thế việc | Ghi lý do và task thay thế nếu có |

Không đánh dấu `DONE` chỉ vì AI kết thúc câu trả lời, có file tồn tại hoặc đã chạy một kiểm tra cục bộ. Task bị chặn cần ghi rõ phần nào bị chặn, không làm cả nhóm dừng nếu các phần khác vẫn độc lập.

### 6.4. Mẫu bàn giao

```text
Task và người bàn giao:
Trạng thái:
Đã hoàn thành:
File đã thay đổi:
Contract/SQL/quy tắc liên quan và phiên bản quyết định:
Kiểm chứng đã thực hiện + kết quả thực tế:
Kiểm chứng chưa thực hiện + lý do:
Tình huống còn lỗi hoặc giới hạn:
Điểm tác động tới task/người khác:
Thao tác chủ dự án cần thực hiện thủ công:
Bước tiếp theo và người nhận:
Xác nhận: chưa tự commit/push/merge/phát hành/triển khai.
```

Người nhận đọc file thực tế và quyết định được tham chiếu. Bản tóm tắt từ AI trước là chỉ dẫn tìm hiểu, không thay thế contract hoặc bằng chứng kiểm chứng.

## 7. Quy trình thay đổi hợp đồng và tương thích

### 7.1. Khi nào cần bản ghi thay đổi

Đề xuất lập bản ghi thay đổi khi sửa request/response, tên trường, enum, quyền, trạng thái, ràng buộc SQL, cách tính tiền, cách xác định còn chỗ, dữ liệu seed dùng chung hoặc hành vi mà phần khác đang dựa vào. Sửa chính tả không đổi nghĩa có thể ghi trực tiếp trong bàn giao.

Mỗi thay đổi có mã ổn định và tham chiếu [sổ quyết định](10-DECISIONS-AND-HANDOFF.md). Không tự đánh số trùng khi nhiều người làm cùng lúc; điều phối viên cấp mã hoặc xác nhận mã trước khi hợp nhất.

### 7.2. Chu trình đề xuất

1. Người phát hiện ghi vấn đề cụ thể: hành vi hiện tại, nguồn yêu cầu, phần không khớp và ví dụ bị ảnh hưởng.
2. Xác định người sử dụng hợp đồng: UI, backend, database, báo cáo, seed và test.
3. Soạn phương án thay đổi kèm các lựa chọn, tác động và cách kiểm chứng. Thay đổi nghiệp vụ cần chủ dự án quyết định.
4. Người phụ trách bên cung cấp và bên sử dụng rà cùng một đề xuất. Nếu chưa thống nhất, giữ `OPEN`; không âm thầm viết code cho một phương án.
5. Sau khi được quyết định, cập nhật nguồn định nghĩa chung trước hoặc cùng lượt thay đổi với các phần phụ thuộc.
6. Thực hiện theo thứ tự bảo đảm mọi bên biết thời điểm chuyển đổi; chủ dự án tự thực hiện tích hợp Git.
7. Chạy lại kiểm chứng bị ảnh hưởng và ghi thay đổi đã thay thế quyết định nào. Giữ lịch sử bằng trạng thái `SUPERSEDED`, không xóa mất căn cứ cũ.

### 7.3. Mẫu quyết định/ADR đề xuất

```text
Mã quyết định:
Trạng thái: PROPOSED / OPEN / OWNER_CONFIRMED / DELEGATED_SELECTION / SUPERSEDED
Vấn đề và nguồn SRS/câu hỏi liên quan:
Phương án được xem xét:
Quyết định + người xác nhận + thời điểm:
Lý do và đánh đổi:
API operation/file bị ảnh hưởng:
SQL bảng/cột/ràng buộc bị ảnh hưởng:
Quy tắc nghiệp vụ/quyền/trạng thái bị ảnh hưởng:
UI, seed và kiểm thử cần cập nhật:
Tương thích với phần đang có:
Kế hoạch chuyển đổi và xử lý lỗi:
Tiêu chí xác minh:
Quyết định thay thế/bị thay thế:
```

Quyết định kỹ thuật trong phạm vi ủy quyền Q-05/Q-20/Q-24 dùng `DELEGATED_SELECTION`, đã ghi tại file 12 và sổ quyết định. Không gắn `OWNER_CONFIRMED` giả cho chi tiết AI tự chọn; không tạo thêm một bộ chuẩn ngoài baseline. Quyết định nghiệp vụ mới ngoài ủy quyền cần chủ dự án xác nhận.

### 7.4. Tương thích trước và sau khi có dữ liệu

- Trước khi có bên sử dụng contract: vẫn ghi thay đổi để các AI đọc bản mới nhất; chưa cần duy trì hành vi chưa ai dùng.
- Khi UI hoặc phần khác đã dùng contract: sửa đồng bộ hoặc có giai đoạn chuyển đổi được ghi rõ. Không cho rằng thêm trường luôn an toàn; trường mới bắt buộc, quyền mới hay thay đổi ngữ nghĩa vẫn có thể làm hỏng luồng.
- Khi có database dùng chung hoặc dữ liệu cần giữ: không sửa file DDL rồi xem như database đã được nâng cấp. Cần kế hoạch migration và kiểm chứng dữ liệu, nằm trong phạm vi được chủ dự án yêu cầu.
- Đổi enum/trạng thái phải kiểm tra dữ liệu cũ, điều kiện UI, báo cáo, seed và test; đổi cột phải xét khả năng ánh xạ và chuyển dữ liệu.
- Không dùng xóa database/reset dữ liệu làm cách mặc định để giải quyết bất tương thích. Mọi tác vụ mất dữ liệu cần phạm vi và quyết định riêng của chủ dự án.

## 8. Ma trận rà soát trước tích hợp

| Nhóm thay đổi | Người viết tự kiểm tra | Người rà soát chéo cần kiểm tra | Bằng chứng tối thiểu đề xuất |
|---|---|---|---|
| API và UI gọi API | Request/response, validation, lỗi, trạng thái rỗng/loading, tên trường | Contract dùng chung và phía sử dụng khớp; dữ liệu nhạy cảm không bị trả thừa | Ví dụ hoặc kiểm thử đúng/sai input và lỗi nghiệp vụ chính |
| Database | Khóa, null, duy nhất, quan hệ, kiểu dữ liệu, chỉ mục phục vụ truy vấn | Schema khớp API và nghiệp vụ; hành vi xóa/cập nhật không mất lịch sử | Áp dụng được trên DB kiểm thử khi được yêu cầu; kiểm tra ràng buộc quan trọng |
| RBAC, sở hữu dữ liệu và khóa | Mọi operation có quyền rõ; API bảo vệ kiểm tra mỗi request | Sinh viên không đọc/sửa dữ liệu người khác; BQL không cấp tài khoản; Admin không tự có quyền nghiệp vụ; khóa từ chối request bảo vệ tiếp theo | Ca đúng/sai role, chưa đăng nhập, bản ghi người khác, phiên đang có bị khóa; không cần sự kiện đẩy |
| Sức chứa/duyệt đơn | Gửi đơn không giữ chỗ; duyệt và tạo hồ sơ nhất quán | Không vượt sức chứa khi hai thao tác cạnh tranh; lỗi giữa chừng rollback đúng | Kịch bản đồng thời cho chỗ cuối; thao tác lặp; thất bại giữa giao dịch |
| Lưu trú/kết thúc/hủy xếp phòng | Chuyển trạng thái và điều kiện hợp lệ | Nhận phòng không trừ thêm chỗ; giải phóng chỗ đúng một lần; giữ lịch sử | Thử hành động hợp lệ, lặp lại, sai trạng thái và thao tác cạnh tranh liên quan |
| Phiếu thu/tiền | Một hồ sơ tối đa một phiếu thu; tiền chốt theo giá khi lập | Không làm thay đổi phiếu cũ khi giá hiện tại thay đổi; không tạo trùng khi cạnh tranh | Ca giá thay đổi, lập lặp/lập đồng thời và kiểm tra độ chính xác tiền |
| Báo cáo | Bộ lọc, khoảng thời gian, công thức và dữ liệu nguồn | Chỉ số đối chiếu được với bản ghi gốc; đúng quyền | Tập dữ liệu giả nhỏ có kết quả tính tay theo định nghĩa đã chốt |
| Migration và dữ liệu mẫu | Thứ tự áp dụng, điều kiện môi trường, dữ liệu giả | Không phá ràng buộc/lịch sử; không chứa thông tin thật hoặc bí mật | Kế hoạch áp dụng và kết quả kiểm chứng phù hợp phạm vi |
| Tài liệu và AGENTS | Mã nguồn yêu cầu, liên kết, trạng thái đề xuất/xác nhận | Không có quy tắc mâu thuẫn; người khác xác định được bước tiếp theo | Rà nguồn và kiểm tra liên kết/file đích |

Các hành vi cụ thể trong bảng tuân theo các nguyên tắc đã ghi ở AGENTS gốc; contract chi tiết vẫn phải đối chiếu SRS và câu trả lời. Không chọn cơ chế khóa hay thiết kế SQL chỉ từ tên ca kiểm thử.

Một người có thể rà nhiều nhóm nhưng không tự coi việc tự kiểm tra là rà soát chéo. Với thay đổi chạm cả sức chứa và phiếu thu, cần người hiểu hai luồng cùng kiểm tra tác động.

## 9. Tích hợp theo lát nhỏ

Đề xuất mỗi đợt tích hợp chỉ gồm một thay đổi có thể giải thích và kiểm chứng được, kèm tài liệu liên quan. Bùi Thế Anh xem xét và tích hợp thủ công; mỗi người/AI chỉ bàn giao phần riêng, không merge code của thành viên khác. AI cung cấp thay đổi trong working tree và hướng dẫn kiểm chứng, không tự thực hiện Git ghi.

Trình tự kiểm tra khi nhận thay đổi:

1. Đọc task, danh sách file và quyết định đang áp dụng.
2. Kiểm tra xung đột về ý nghĩa: cùng tên nhưng khác quyền, khác enum, khác công thức hoặc khác trách nhiệm giữ chỗ. Không chỉ xử lý xung đột dòng văn bản.
3. Rà theo ma trận ở mục 8; yêu cầu người phụ trách giải thích các thay đổi dùng chung chưa ghi.
4. Chủ dự án tích hợp theo thứ tự phụ thuộc đã xác định.
5. Chạy kiểm chứng liên phần trên kết quả đã tích hợp, đặc biệt luồng đi qua nhiều người.
6. Ghi kết quả và cập nhật task. Nếu còn lỗi thì chỉ rõ task sửa; không báo toàn bộ luồng đã hoàn tất.

Đề xuất một điểm đồng bộ ngắn khi đổi contract hoặc bắt đầu ghép luồng. Nội dung gồm quyết định mới, task đang chặn, file dùng chung sắp sửa và đầu ra cần bên khác nhận. Tần suất cụ thể chờ lịch nhóm; không mặc định yêu cầu họp mỗi ngày.

## 10. Xử lý phát hiện lỗi nghiêm trọng hoặc thay đổi gấp

Lỗi sai quyền, vượt sức chứa, trùng hồ sơ/phiếu thu hoặc làm mất lịch sử cần ưu tiên rà soát. Quy trình này không cho phép AI tự triển khai bản sửa hoặc tự thay dữ liệu đang dùng.

1. Ghi tình huống tái hiện bằng dữ liệu giả, mức ảnh hưởng và các luồng có thể bị sai.
2. Báo cho chủ dự án qua kênh mà người dùng trực tiếp sử dụng/cho phép. Không tự gửi tin cho người khác bằng công cụ nếu chưa được phép.
3. Đánh dấu các task bị ảnh hưởng; dừng riêng phần có nguy cơ tiếp tục làm sai dữ liệu, vẫn làm phần độc lập.
4. Đề xuất bản sửa nhỏ có thể rà được, phân biệt sửa code với xử lý dữ liệu đã phát sinh.
5. Ghi quyết định tạm nếu có; thời hạn xem xét lại và người có quyền xác nhận phải rõ.
6. Kiểm tra lại tình huống lỗi và các luồng liên quan; người khác rà kết quả trước khi chủ dự án tích hợp/áp dụng.
7. Cập nhật contract, quy tắc, schema/migration và kiểm thử nếu chúng bị ảnh hưởng. Không để bản sửa gấp tạo một hợp đồng thứ hai không có tài liệu.

Nếu có xung đột giữa cách code hiện tại và SRS, cần xác định code sai hay yêu cầu được thay đổi. Không mặc định sửa tài liệu theo code để hợp thức hóa.

## 11. Hướng dẫn cho thành viên mới và AI của họ

### 11.1. Chủ động chuẩn bị bản làm việc

- Thành viên tự lấy repo về theo hướng dẫn GitHub của nhóm và xác nhận đang ở đúng bản mà chủ dự án muốn sử dụng. Chưa có URL repo được xác minh trong bộ kế hoạch nên không ghi lệnh clone với địa chỉ đoán.
- Chủ dự án hoặc thành viên được giao tự thực hiện tạo nhánh/commit/push/merge theo quy trình nhóm. AI không tự thực hiện các thao tác này. Tên nhánh có thể đề xuất dạng `task/<ma-task>-<mo-ta-ngan>` để người dùng tự áp dụng nếu nhóm chọn.
- Sau khi clone, đọc AGENTS gốc và README; tiếp tục thứ tự đọc được AGENTS quy định. Khi đường dẫn máy khác, giới hạn ghi là root bản clone tương ứng, không phải đường dẫn tuyệt đối của máy chủ dự án.
- Chưa cài dependency/chạy ứng dụng theo suy đoán nếu hướng dẫn nền chưa được chốt. Không sửa cấu hình Git hoặc thay đổi source để ép khớp stack AI tự chọn.
- Trước khi nhờ AI làm, cung cấp mã task, file được sửa, tiêu chí bàn giao và phạm vi được chủ dự án cho phép. Không giao chung chung “xây phần của role này” rồi để AI tự định nghĩa API.

### 11.2. Prompt khởi động đề xuất để người dùng sao chép

```text
Bạn đang hỗ trợ tôi trong repository ứng dụng quản lý ký túc xá của nhóm.
Hãy đọc AGENTS.md ở root và mọi AGENTS.md áp dụng cho file sẽ sửa.
Đọc README.md, Planning/00-PLAN-INDEX.md, Planning/01-SRS-BASELINE.md,
Planning/10-DECISIONS-AND-HANDOFF.md, Planning/11-ANSWER-REVIEW.md và
Planning/12-SHARED-TECHNICAL-BASELINE.md trước; file09 để truy vết,
không áp phần mật khẩu rõ/DB-only đã được Q-25/Q-26 thay thế.

Task được giao: <mã và tiêu đề task>
Phạm vi được chủ dự án yêu cầu trong đợt này: <ghi rõ>
File/thư mục được sửa: <danh sách>
Đầu ra và tiêu chí chấp nhận: <nội dung task đã thống nhất>
Người phụ trách/rà soát: <tên do nhóm chỉ định>

Chỉ sửa trong repo. Không tự commit, push, merge, tạo tag, phát hành,
triển khai hoặc ghi đè thay đổi của người khác. Không tự chọn thay câu hỏi
nghiệp vụ/kỹ thuật đang mở. Đừng tạo API/enum/schema riêng khác định nghĩa chung.
Nếu task phụ thuộc quyết định chưa có, chỉ rõ phần bị chặn và làm tiếp phần
độc lập trong phạm vi. Kết thúc bằng bản bàn giao: file đã sửa, quyết định
áp dụng, kiểm chứng thực tế, điều còn thiếu và tác động tới phần khác.
```

Các chỗ trong `<...>` phải được thành viên điền trước khi giao việc; không phải yêu cầu AI tự đoán. Ở giai đoạn `PLAN_RECONCILED` hiện tại, phạm vi vẫn là hoàn thiện kế hoạch; cần yêu cầu tiếp theo để tạo bộ đặc tả và yêu cầu triển khai tương ứng trước khi viết ứng dụng.

### 11.3. Khi chuyển sang AI mới hoặc mất ngữ cảnh

AI mới cần đọc lại nguồn quyết định và trạng thái task trên đĩa. Người giao việc cung cấp bản bàn giao gần nhất, các file đang thay đổi và việc chưa kiểm chứng. Không yêu cầu AI tiếp tục chỉ từ một câu “làm tiếp phần trước” khi chưa xác định task và trạng thái hiện tại.

Nếu bản tóm tắt cũ khác file hiện hành, kiểm tra quyết định và thời điểm cập nhật trước khi sửa. Không tự khôi phục nội dung cũ hoặc xóa thay đổi mới của người khác.

## 12. Tiêu chí hoàn tất kế hoạch phối hợp

- Có ranh giới giữa yêu cầu đã xác nhận và phương án tổ chức đề xuất.
- Danh sách TV1-TV4 và trách nhiệm frontend/API đã khớp Q-04; mỗi task khi giao có đúng một người phụ trách cụ thể, phụ thuộc và người rà soát. Không suy từ tên thành viên thành phân công API đã chốt.
- Đã xác định nguồn duy nhất cho contract dùng chung, quy tắc nghiệp vụ và schema.
- Có mẫu task, bàn giao, quyết định, trạng thái công việc và điều kiện tích hợp.
- Những điểm có nguy cơ sai quyền, sức chứa, lưu trú và tiền được đưa vào rà soát chéo.
- Người mới có thể đọc tài liệu và xác định việc được làm, việc còn chờ mà không phải hỏi lại toàn bộ dự án.
- Các câu hỏi cần chủ dự án quyết định được theo dõi tại [09-OWNER-QUESTIONS.md](09-OWNER-QUESTIONS.md); quyết định và bước tiếp theo tại [10-DECISIONS-AND-HANDOFF.md](10-DECISIONS-AND-HANDOFF.md).
- Không có thao tác Git ngoài phạm vi; không sinh code, migration, schema hoặc contract chính thức trong đợt lập kế hoạch.

## 13. Rủi ro tích hợp và cách phát hiện sớm

| Rủi ro | Dấu hiệu | Cách xử lý trong kế hoạch |
|---|---|---|
| Mỗi AI đặt tên/enum riêng | Cùng khái niệm xuất hiện nhiều định nghĩa | Rà nguồn chung; cập nhật cùng quyết định, không thêm ánh xạ tạm không có tài liệu |
| Chia role làm mất luồng đầu-cuối | Màn hình riêng chạy nhưng sinh viên không thấy kết quả duyệt | Giao việc theo luồng và kiểm tra bên cung cấp/bên sử dụng |
| Anh hoặc người giữ file chung trở thành nút thắt | Nhiều task chờ cùng một lượt review/tích hợp | Chốt nền sớm; gom đề xuất; giữ lượt sửa ngắn; người khác chuẩn bị bản rà |
| Sửa contract sau khi người khác đã code | UI/backend bắt đầu nhận lỗi hoặc thiếu dữ liệu | Dùng bản ghi thay đổi và danh sách nơi sử dụng trước khi sửa |
| Kiểm thử cục bộ tạo cảm giác đã xong | Không có bằng chứng chạy luồng đã ghép | Tách tự kiểm tra, rà soát và xác minh sau tích hợp |
| Giả định nghiệp vụ bị xem như yêu cầu | Không tìm được nguồn hoặc câu trả lời | Gắn `PROPOSED`/`OPEN`; chuyển câu hỏi tới chủ dự án |
| Chỉ giải quyết xung đột văn bản | File ghép được nhưng dữ liệu/quyền sai | Rà mâu thuẫn ý nghĩa theo ma trận ở mục 8 |
| AI tự commit hoặc vượt phạm vi | Bàn giao có thao tác Git/triển khai chưa được yêu cầu | Duy trì giới hạn AGENTS; người dùng tự thực hiện các thao tác bị giới hạn |
