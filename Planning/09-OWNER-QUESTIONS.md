# Câu hỏi để chủ dự án trả lời trực tiếp

**Trạng thái: ĐÃ TRẢ LỜI VÀ RÀ SOÁT.** Giữ nguyên 24 phần trả lời của chủ dự án. Q-25..Q-27 được trả lời bổ sung trong chat và lưu ở [11-ANSWER-REVIEW.md](11-ANSWER-REVIEW.md); dùng [sổ quyết định hiện hành](10-DECISIONS-AND-HANDOFF.md) thay vì áp phần Q-05/Q-06/Q-18 đã bị thay thế. Không có câu trả lời nào được AI điền thay chủ dự án.

File này giữ mẫu câu hỏi và câu trả lời gốc để truy vết. Các hướng dẫn điền bên dưới là hướng dẫn của đợt đầu, không có nghĩa chủ dự án cần trả lời lại. Phạm vi hiện tại là hoàn thiện kế hoạch, không tự kích hoạt viết ứng dụng.

## Cách trả lời

- Có thể ghi ngắn: **"Đồng ý đề xuất"**, hoặc ghi phương án khác và giới hạn cụ thể. Đề xuất chỉ có hiệu lực khi cậu đồng ý hoặc giao rõ quyền quyết định.
- Nếu chưa biết công nghệ, có thể ghi **"Giao cậu đề xuất và chọn trong giới hạn ..."**; ghi thêm yêu cầu môn học, công nghệ nhóm đã biết và điều cần tránh. AI phải ghi lại quyết định chung trước khi áp dụng cho mọi phần.
- `CHƯA TRẢ LỜI`, bỏ trống, "để sau" hoặc hết thời gian chờ **không phải** chấp thuận đề xuất.
- `P0`: phải giải quyết trước khi chốt phần đặc tả phụ thuộc. `P1`: cần trước khi hoàn tất phần liên quan; vẫn làm được các phần độc lập. `P2`: tùy chọn/bổ sung.
- Không cần ghi mật khẩu thật, số điện thoại/email thật hoặc thông tin cá nhân thực vào file này.

## Các điều đã rõ, không cần xác nhận lại

PostgreSQL; ba role của SRS; admin không có quyền nghiệp vụ BQL; sinh viên không tự đăng ký tài khoản/hủy đơn; không thanh toán online/từng phần/hoàn tiền; gửi đơn chưa giữ chỗ; duyệt phải chống quá chỗ; một hồ sơ lưu trú một phiếu; snapshot giá lúc lập phiếu; trả/hủy vẫn giữ lịch sử và phiếu chưa thanh toán; AI chỉ sửa trong repo và không tự commit. Chỉ ghi thay đổi nếu cậu muốn **chủ động sửa SRS**.

## A. Công nghệ, lịch và nhóm

### Q-01 [P0] Công nghệ và ràng buộc môn học

**Cần biết:** Backend, frontend, ngôn ngữ, công cụ truy cập PostgreSQL/migration nhóm muốn dùng; giảng viên có bắt buộc kiến trúc hoặc framework nào không? Nếu đã có source ngoài repo hiện tại, cho đường dẫn trong vùng được phép đọc. Có yêu cầu phiên bản PostgreSQL hoặc môi trường lab không?

**Đề xuất cách quyết định:** chỉ chọn một bộ stack chung theo năng lực nhóm; chốt phiên bản và nguồn schema/migration một lần. Không tự thêm nhiều service. Nếu chưa có lựa chọn, giao AI đề xuất có ràng buộc và ghi quyết định trước khi viết tài liệu kỹ thuật phụ thuộc.

**Ảnh hưởng:** cấu trúc source tương lai, auth, Docker, migrations, công cụ kiểm thử; không ảnh hưởng ba role hay QT gốc.

**Trả lời Q-01:** Tớ sẽ sử dụng NextJS cho phía Front-end và ExpressJS cho API phía Back-end. Giảng viên không bắt buộc sử dụng một framework cụ thể và không có source ngoài repo hiện tại. Về phiên bản PostgreSQL, hãy sử dụng phiên bản PostgreSQL mới nhất. Về truy cập vào dự án, mọi người sẽ thực hiện code trên máy của họ và tớ sẽ chạy code trên máy của tớ và điều chỉnh lại nếu cần thiết. Máy tớ đã cài sẵn PostgreSQL để kiểm thử. Sau khi mọi người làm và đẩy code lên Github tớ sẽ pull về để kiểm tra. Cuối dự án, tất cả sẽ được đưa vào một môi trường Docker để đóng gói.

### Q-02 [P1] Môi trường chạy và giới hạn hạ tầng

**Cần biết:** Chỉ demo Docker trên máy cá nhân hay còn cần triển khai lên máy chủ? Nếu có, môi trường/OS, domain/HTTPS, cổng hoặc giới hạn máy nào đã có? Có giới hạn dùng dịch vụ trả phí hoặc tải image/dependency từ internet không?

**Đề xuất:** ưu tiên prototype chạy bằng Docker Compose theo NFR-03; hosting công khai là phần tùy nhu cầu, không mặc định mua dịch vụ hay triển khai internet.

**Ảnh hưởng:** cấu hình origin/cookie, URL API, network/port, tài liệu chạy và kế hoạch triển khai tương lai.

**Trả lời Q-02:** Sau khi hoàn thành sẽ đóng gói lại trên Docker để chạy thử, nhưng dự án sẽ được deploy lên trên Web hoặc chạy Docker trên một máy chủ ảo, tớ chưa xác định được ở thời điểm hiện tại.

### Q-03 [P0 cho lịch] Mốc thời gian thực tế

**Cần biết:** Ngày bắt đầu/kết thúc, deadline bộ tài liệu, deadline prototype/báo cáo/demo, số tuần còn lại và các mốc phải nộp. SRS ghi đồ án 10 tuần nhưng chưa biết nhóm đang ở tuần nào.

**Đề xuất:** dùng mốc tương đối trong kế hoạch cho tới khi có lịch thật; dành thời gian tích hợp và sửa lỗi ở mỗi mốc, có đệm cuối kỳ.

**Ảnh hưởng:** chuyển bảng 10 tuần tham chiếu thành lịch có ngày; ưu tiên MUST/SHOULD.

**Trả lời Q-03:** Thời gian thực hiện bắt đầu từ tuần 03 - ngày 26/09/2026 - đến tuần 12 - ngày 28/11/2026. Deadline bắt buộc phải xong trước ngày 20/12/2026, báo cáo và nộp đồ án vào ngày 23/12/2026. Nhóm hiện tại đang ở tuần 8.

### Q-04 [P0 cho phân công] Thành viên và cách phối hợp

**Cần biết:** Bốn thành viên (tên hoặc bí danh), thế mạnh backend/frontend/database/QA, số giờ dự kiến mỗi tuần; ai điều phối và ai review được phần dữ liệu/quyền? Có muốn mỗi người làm cả giao diện lẫn API cho luồng mình hay phân chuyên môn khác?

**Đề xuất:** phân theo luồng nghiệp vụ với một owner/task và reviewer khác; người điều phối contract/schema giúp kiểm soát chuẩn chung. P1-P4 hiện chỉ là phương án, chưa gán ai. Mỗi người dùng một bản clone; chủ dự án tự kiểm tra/tích hợp Git.

**Ảnh hưởng:** ownership, thứ tự giao task và tránh nhiều người sửa cùng file chung.

**Trả lời Q-04:** Nhóm gồm 4 thành viên. Thành viên 1: Bùi Thế Anh, thế mạnh ở lập trình front-end, có khả năng sử dụng AI thuần thục (prompt engeneering, lập kế hoạch, gỡ lỗi bằng AI). Thành viên 2: Trần Quốc Vương, thế mạnh có khả năng sử dụng AI Calude tốt. Thành viên 3: Nguyễn Đỗ Tuấn Kiệt, thế mạnh chưa biết. Thành viên 3: Trần Tuấn Kiệt, thế mạnh chưa biết. Số giờ làm dự kiến cho mỗi tuần chưa có. Bùi Thế Anh sẽ là người điều phối (đồng thời là ownership) và review code (mọi người đều có thể review chung thông qua Repo Github). Mỗi người sẽ làm phần API mình được giao và Bùi Thế Anh sẽ sử dụng OpenAI Codex để thực hiện front-end dựa trên API mà những người khác đã làm. Mỗi người sau khi thực hiện sẽ để vào 1 file riêng, không merge code của những thành viên khác chung với nhau, Bùi Thế Anh sau cùng sẽ sử dụng code đó để tạo front-end (có thể điều chỉnh lại API một chút để phù hợp với front-end nhưng đảm bảo mọi người/AI Agents đều tuần theo quy định chung)

## B. Tài khoản, xác thực và quyền

### Q-05 [P0] Đăng nhập, phiên và mật khẩu

**Cần biết:** Muốn đăng nhập bằng username, mã sinh viên hay email; với BQL/Admin dùng định danh nào? Có yêu cầu sẵn về cookie/session hoặc token không, hay giao AI chọn? Thời lượng phiên, đăng nhập nhiều thiết bị, yêu cầu mật khẩu tối thiểu, hiệu lực đăng xuất/đổi mật khẩu lên phiên khác cần thế nào?

**Đề xuất:** một cơ chế thống nhất cho ứng dụng web; backend kiểm tra quyền. Quy tắc độ dài/mật khẩu, phiên và thu hồi phải ghi vào contract chung; không tự thêm refresh/reset flow khi chưa cần.

**Ảnh hưởng:** auth endpoints, bảng session nếu cần, cấu hình frontend, bảo vệ logout và kiểm thử NFR-01.

**Trả lời Q-05:** Đăng nhập bằng mã sinh viên, về thông tin sinh viên sẽ chỉnh sửa trực tiếp lên Database vì thêm sinh viên không thuộc luồng của Quản lý ký túc xá, chỉ cần tạo một table thông tin sinh viên với thông tin chi tiết, sau đó nhóm sẽ thêm sinh viên mới thủ công qua điều chỉnh trực tiếp. Với BQL và Admin không có định danh cụ thể, nhưng có phân quyền khi tạo tài khoản BQL và Admin (tương tự nhuwg thông tin sinh viên cũng sẽ điều chỉnh trực tiếp trong Database), sẽ có một cột quyền với 3 quyền sau "SV": tương đương với quyền dành cho sinh viên, "BQL": Tương đương với quyền dành cho ban quản lý và "ADMIN" tương ứng với quyền admin. Tất cả đều được lưu trũ trong database. Với BQL và ADMIN tớ có thể tự thêm tên khoản và mật khẩu (không mã hóa chỉ cần so sánh chuỗi) vào thẳng database cộng thêm với thông tin ROLE (hoặc tùy cậu chọn tên) là "ADMIN" hay "BQL" để xác định quyền. Còn với sinh viên cũng sẽ có một trường thông tin y chang vậy nhưng mặc định sẽ là SV. Thông tin đăng nhập của BQL và ADMIN sẽ được lưu chung vào một table còn mật khẩu đăng nhập của sinh viên sẽ được lưu trực tiếp và table thông tin sinh viên (mật khẩu cũng không mã hóa và chỉ thực hiện so sánh chuỗi). Về cookie/session/token sẽ giao cho AI chọn (nếu có session, yêu cầu session 30p nếu không hoạt động).

### Q-06 [P0] Cấp tài khoản đầu tiên và mật khẩu khởi tạo

**Cần biết:** Admin đầu tiên được tạo qua bước init/seed hay thao tác khác? Tài khoản demo ba role có cần đi kèm không? Admin cấp mật khẩu tạm thế nào; có bắt buộc đổi lần đầu không? Chức năng reset mật khẩu do admin có cần trong đồ án, hay giữ ngoài phạm vi hiện tại?

**Đề xuất:** có cách khởi tạo admin bằng cấu hình môi trường được hướng dẫn; dữ liệu demo là giả, tách khỏi môi trường thật. Không gửi email/SMS vì ngoài scope; reset/đổi lần đầu chỉ bổ sung khi đồng ý.

**Ảnh hưởng:** bootstrap, account contract, schema auth và seed; không ghi mật khẩu thật trong file trả lời.

**Trả lời Q-06:** Việc tạo tài khoản ADMIN, BQL sẽ được thực hiện thêm/chỉnh sửa trực tiếp vào Database, chỉ cần trường thông tin ROLE (hoặc tương tự do cậu chọn) là 1 trong 3 giá trị "ADMIN", "BQL" và "SV" thì chương trình sẽ tự động đưa ra giao diện phù hợp với quyền hiện tại. Bỏ qua rủi ro sai sót trong quá trình nhập liệu, không cần kiểm tra lỗi của ROLE.

### Q-07 [P0] Gán và đổi role sau cấp

SRS mô tả tài khoản được gán một trong ba vai trò; bộ kế hoạch giữ mô hình một role/tài khoản.

**Cần biết:** "Gán role" chỉ lúc cấp hay cho phép đổi về sau? Nếu đổi tài khoản Sinh viên thành role khác, giữ liên kết hồ sơ như thế nào; có cho đổi ngược một tài khoản BQL/Admin thành Sinh viên không?

**Đề xuất:** một role/tài khoản; không kế thừa quyền. Nếu chưa có nhu cầu đổi sau cấp, chỉ gán lúc cấp để giảm rủi ro; nếu cần đổi, chốt precondition, liên kết hồ sơ và hiệu lực phiên rõ ràng. Không tự thêm cơ chế đa role.

**Ảnh hưởng:** RBAC, account-profile relation, revoke phiên, test khi đổi role và nghiệp vụ đang tồn tại.

**Trả lời Q-07:** Gán role lúc tạo tài khoản (chỉnh sửa trực tiếp vào Database), có thể thay đổi quyền tùy ý nhưng sẽ ngầm định sau khi thêm thì không xóa hay chỉnh sửa. Xem như một tài khoản sau khi được tạo thì sẽ không thể thay đổi role.

### Q-17 [P1] Khóa tài khoản và bảo vệ tài khoản quản trị

**Cần biết:** Khóa có vô hiệu ngay các phiên đang đăng nhập không? Có ngăn admin tự khóa mình hoặc khóa admin hoạt động cuối cùng không? Có muốn cho đổi role/khóa tài khoản trong lúc người đó có tác vụ đang xử lý không?

**Đề xuất:** khóa chặn các request bảo vệ tiếp theo; bảo vệ admin cuối cùng; không tự từ chối đơn/hủy xếp hoặc thay phiếu khi khóa. QT-02 đã yêu cầu giữ dữ liệu. Quyền tác vụ đang chạy cần được xử lý nhất quán tại transaction boundary.

**Ảnh hưởng:** auth lifecycle, transaction có kiểm tra tài khoản, vận hành/demo; không hỏi lại việc khóa có được xóa lịch sử hay không vì SRS đã cấm mất dữ liệu.

**Trả lời Q-17:** Khóa không cần vô hiệu ngay các phiên đang đăng nhập, nhưng chỉ cần người bị khóa reload lại trang thì sẽ bị văng. Admin có thể tự khóa tài khoản của chính minh. Hãy thêm trường thông tin ISLOCKED hoặc tương tự như vậy vào table tài khoản của ADMIN, BQL và SV. Không cần để tâm đến việc có mất quyền truy cập hay không vì nhóm sẽ không làm vậy và nếu có lỡ xảy ra trường hợp như vậy thì sẽ sửa thông tin khóa tài khoản trong database.

### Q-18 [P1] Dữ liệu được thấy khi cấp tài khoản và xử lý nghiệp vụ

**Cần biết:** Để cấp tài khoản theo mã sinh viên có trước, Admin được xem mã + họ tên + tình trạng đã có tài khoản, hay chỉ nhập mã để hệ thống kiểm tra? BQL có cần thấy toàn bộ điện thoại/email trong danh sách hay chỉ trong chi tiết? Có trường nào được yêu cầu ẩn trong demo không?

**Đề xuất:** Admin chỉ xem metadata tối thiểu cho cấp tài khoản, không xem lưu trú/phiếu thu; BQL đọc thông tin đủ xử lý nghiệp vụ; API danh sách/chi tiết có DTO riêng. Không mở thêm quyền nghiệp vụ cho Admin.

**Ảnh hưởng:** endpoint tra cứu hỗ trợ cấp tài khoản, DTO, privacy và test ownership/quyền theo trường.

**Trả lời Q-18:** Nếu có thông tin trong table sinh viên đồng nghĩa với việc có tài khoản. Tài khoản sinh viên gồm các thông tin mã số sinh viên, số điện thoại, mật khẩu (không mã hóa), ngày tháng năm sinh, địa chỉ thường trú và các trường khác nếu có yêu cầu thêm để ứng dụng hoạt động.

## C. Dữ liệu hồ sơ, phòng, ngày và tiền

### Q-08 [P0] Trường hồ sơ và dữ liệu danh mục

SRS đã có mã sinh viên, họ tên, giới tính, lớp/khoa, điện thoại và email.

**Cần biết:** Lớp và khoa là hai trường riêng hay một trường; cần danh mục riêng hay chuỗi nhập? Điện thoại/email có bắt buộc lúc tạo hồ sơ không, có yêu cầu email trường/duy nhất không? Có thật sự cần thêm ngày sinh, CCCD, địa chỉ, liên hệ khẩn cấp, ảnh hoặc giấy tờ không? Nếu cần, nêu trường, mục đích, bắt buộc và ai được xem/sửa.

**Đề xuất:** chỉ lấy tối thiểu SRS; lớp/khoa tách để dễ tra cứu nếu nhóm đồng ý; chưa thêm giấy tờ/ảnh/CCCD. Điện thoại là chuỗi, quy tắc bắt buộc/định dạng chốt cùng contract; không mặc định email duy nhất.

**Ảnh hưởng:** dictionary, schema/null/unique, request validation, UI form và privacy. Không cần điền dữ liệu sinh viên thật.

**Trả lời Q-08:** Sử dụng đề xuất của AI

### Q-09 [P0] Giới tính và sửa dữ liệu ảnh hưởng xếp phòng

**Cần biết:** Danh mục giới tính sinh viên và giới tính tiếp nhận của phòng dùng những giá trị nào; có phòng hỗn hợp không? Khi BQL sửa giới tính hồ sơ hoặc phòng đang có đơn chờ/hồ sơ mở, nên cấm sửa hay áp dụng kiểm tra tương thích nào?

**Đề xuất:** dùng danh mục thực tế nhóm cần, không suy từ 2 ví dụ nam/nữ trong SRS thành danh mục hoàn chỉnh. Khi đã có hồ sơ mở, chặn thay đổi làm vi phạm tương thích; với đơn chờ phải kiểm tra lại lúc duyệt và quyết định rõ có cần xử lý đơn ngay không. Không tự thêm chức năng chuyển phòng để giải quyết.

**Ảnh hưởng:** enum, constraint/check, transaction sửa hồ sơ/phòng với duyệt đồng thời, thông báo cho UI.

**Trả lời Q-09:** Sử dụng đề xuất của AI

### Q-10 [P0] Mã và tính bất biến của danh mục

**Cần biết:** Mã phòng duy nhất toàn hệ thống hay duy nhất trong một tòa? Mã tòa có cần và duy nhất không? Quy tắc viết hoa/khoảng trắng/độ dài mã sinh viên, mã tòa/phòng là gì? Có cho sửa mã sinh viên, chuyển phòng sang tòa khác hoặc đổi mã khi đã được tham chiếu không?

**Đề xuất:** tách ID kỹ thuật khỏi mã nghiệp vụ; chốt chuẩn hóa một lần. Không sửa mã sinh viên/tòa của phòng đã có tham chiếu nếu không có nhu cầu rõ; sửa tên hiển thị có thể tách khỏi khóa. Chính sách cụ thể phải phản ánh nhu cầu nhóm, không tự khóa mọi chỉnh sửa.

**Ảnh hưởng:** unique/FK, route/query, tìm kiếm, lịch sử, migration.

**Trả lời Q-10:** Sử dụng đề xuất của AI

### Q-14 [P0] Mức phí và độ chính xác tiền

**Cần biết:** Chỉ dùng VND nguyên đồng hay cần số thập phân? Phí phòng có thể bằng 0 không, mức trần/sức chứa tối đa có quy định không? Có cần mã phiếu thu riêng hay chỉ ID kỹ thuật? Có cần hạn thanh toán/ghi chú/phương thức thu (thông tin mô tả, không tích hợp online) không?

**Đề xuất:** VND nguyên đồng, số tiền chính xác; không dùng số thực; không thêm hạn/phí phạt/khoản phụ nếu chưa có yêu cầu. Mã phiếu dễ đọc chỉ thêm nếu nhóm cần. Giá 1.000.000 trong AC là ví dụ, không phải giá cố định.

**Ảnh hưởng:** numeric type, API money format, validation và trường phiếu. Snapshot lúc lập, một phiếu/hồ sơ và không chia ngày đã được SRS xác định.

**Trả lời Q-14:** Sử dụng đề xuất của AI

### Q-15 [P0] Ngày nhận/trả và thời điểm xác nhận tiền

**Cần biết:** "Ngày" trong SRS là ngày không có giờ hay timestamp? Người quản lý được nhập ngày thực tế quá khứ hay lấy lúc server ghi nhận; có cho ngày tương lai/sửa sau ghi nhận không? Múi giờ nghiệp vụ có dùng `Asia/Ho_Chi_Minh` không? Quy tắc quan hệ ngày nhận ≤ ngày trả, ngày xác nhận tiền cần thế nào?

**Đề xuất:** phân biệt ngày nghiệp vụ với timestamp thao tác do server sinh; thống nhất múi giờ Việt Nam và format API. Nếu cho nhập lùi, lưu cả người/thời điểm ghi nhận và giới hạn sửa; không mặc định thêm endpoint sửa lịch sử.

**Ảnh hưởng:** date/timestamp types, JSON format, UI nhập ngày, test timezone và lịch sử.

**Trả lời Q-15:** Sử dụng đề xuất của AI

### Q-19 [P1] Xóa dữ liệu và lịch sử

**Cần biết:** Có nhu cầu xóa hồ sơ/tòa/phòng nhập nhầm chưa từng được tham chiếu không, hay không cung cấp DELETE trong prototype? Nếu cần xóa/ẩn, đối tượng nào, điều kiện nào, ai được làm? Có yêu cầu giữ nguyên tên/mã cũ trong lịch sử khi danh mục đổi tên không? Có cần nhật ký riêng "ai làm gì/lúc nào" ngoài các ngày/người thao tác SRS đã yêu cầu, hay giữ mức tối thiểu SRS?

**Đề xuất:** không có hard-delete cho đơn/lưu trú/phiếu; không cấp DELETE mặc định theo CRUD. Dùng trạng thái phòng sẵn có, giữ quan hệ và lịch sử; chỉ bổ sung xóa dữ liệu chưa dùng khi được yêu cầu. Không tự thêm soft-delete cho mọi bảng; nhật ký bổ sung chỉ có nếu nhóm cần, luôn giữ các ngày/người thao tác bắt buộc trong SRS.

**Ảnh hưởng:** FK ON DELETE, API, history model và audit nếu được chọn. Khóa tài khoản/trả phòng/hủy xếp phải giữ dữ liệu theo QT-02/16, không phụ thuộc câu trả lời này.

**Trả lời Q-19:** Sử dụng đề xuất của AI

## D. Chính sách vòng đời còn thiếu

### Q-11 [P0] Ý nghĩa một kỳ và đóng/mở lại

**Cần biết:** Prototype chỉ có đúng một kỳ cấu hình cố định, hay cần lưu thông tin kỳ đã đóng nhưng vẫn chỉ xử lý một kỳ? Kỳ cần tên/ngày bắt đầu-kết thúc hay chỉ mở/đóng thủ công? Sau đóng có được mở lại cùng kỳ và duyệt các đơn đã gửi trước đó không?

**Đề xuất:** một kỳ trong prototype, đóng/mở thủ công, không tự mở/đóng theo lịch; vẫn được xử lý đơn chờ sau khi đóng, mở lại cùng kỳ nếu cần. Đây là đề xuất cần cậu xác nhận; không triển khai đa kỳ hoặc job tự động.

**Ảnh hưởng:** entity kỳ, endpoint, trạng thái UI, transaction gửi đơn khi đóng; đơn cũ không tự biến mất.

**Trả lời Q-11:** Sử dụng đề xuất của AI

### Q-12 [P1] Gửi lại đơn và phòng nguyện vọng thay đổi

**Cần biết:** Trong cùng kỳ đang mở, sau đơn bị từ chối hoặc sau hồ sơ bị hủy/đã kết thúc, sinh viên có được gửi đơn mới khi không còn đơn chờ và hồ sơ mở không? Có giới hạn số lần không? Nếu phòng nguyện vọng đầy/ngừng sử dụng sau khi đơn đã gửi, giữ đơn chờ cho BQL chọn phòng khác hay cần xử lý khác?

**Đề xuất:** cho gửi mới khi mọi điều kiện FR-04 đều đạt, không sửa/hủy đơn cũ; không giới hạn số lần ngoài các ràng buộc SRS. Đơn đã gửi không tự đổi trạng thái khi phòng đầy; BQL chọn phòng khác phù hợp hoặc từ chối kèm lý do. Không thêm trạng thái tự hết hạn.

**Ảnh hưởng:** unique đơn chờ, lịch sử đơn, thông báo lỗi và xử lý phòng không còn phù hợp. SRS đã cấm sinh viên tự hủy; câu hỏi này không mở lại quyền đó.

**Trả lời Q-12:** Sử dụng đề xuất của AI

### Q-13 [P1] Sinh viên xem thông tin lưu trú đến mức nào?

Phạm vi SRS có tra cứu thông tin lưu trú cá nhân nhưng UC chi tiết chủ yếu liệt kê trạng thái đơn và phiếu.

**Cần biết:** Cần màn hình/endpoint riêng xem phòng được xếp, trạng thái, ngày nhận/trả và lịch sử các lần đã ở không; hay thông tin hiện tại gộp vào chi tiết đơn? Có cần danh sách người cùng phòng không?

**Đề xuất:** xem hồ sơ lưu trú của chính mình, phòng được xếp và ngày/trạng thái, có lịch sử cá nhân; không hiển thị danh sách hoặc liên hệ bạn cùng phòng. Endpoint riêng hay gộp chọn sau khi thống nhất UI/contract.

**Ảnh hưởng:** DTO/endpoint đọc và quyền; không cho sinh viên tự nhận/trả/hủy xếp.

**Trả lời Q-13:** Sử dụng đề xuất của AI

### Q-16 [P1] Hủy xếp phòng vì không đến nhận

**Cần biết:** BQL hủy thủ công khi xác định không đến nhận, hay có số ngày chờ cụ thể? Có bắt buộc nhập lý do/ngày xác nhận không đến? Nếu có deadline nhận phòng, nó là thông tin của kỳ hay từng hồ sơ?

**Đề xuất:** hủy thủ công chỉ khi Đã xếp phòng, bắt buộc lý do và lưu người/thời điểm; không có job tự động hay trạng thái mới. Phiếu đã lập, kể cả chưa thanh toán, giữ nguyên theo QT-16; không hỏi lại việc hủy nợ/hoàn tiền vì SRS đã xác định.

**Ảnh hưởng:** các trường bổ sung của lưu trú, validation, API hủy xếp và test retry.

**Trả lời Q-16:** Sử dụng đề xuất của AI

## E. Chuẩn tích hợp, UI và đầu ra

### Q-20 [P0] Ủy quyền chọn chuẩn API/DB và cách xử lý request lặp

**Cần biết:** Nhóm đã có chuẩn URL/version, JSON naming, ID, enum, pagination, error envelope/status hoặc mô tả API nào cần theo chưa? Nếu chưa, cậu có giao AI chọn một bộ quy ước thống nhất không? Với thao tác đã xử lý nhưng client gửi lại, ưu tiên trả lỗi trạng thái/xung đột hay trả lại kết quả cũ; có cần Idempotency-Key không?

**Đề xuất:** chốt một bản conventions trước; field API và cột SQL có mapping rõ, không bắt buộc giống casing. Với thao tác ghi, phải chống trùng và tránh tác dụng phụ lặp ở DB dù chọn lỗi hay replay; dùng idempotency key chỉ nếu cần, không tự thêm hạ tầng phức tạp. Chỉ định chuẩn tiền/ngày cùng Q-14/15.

**Ảnh hưởng:** mọi contract/example/mock, schema, test, frontend xử lý lỗi và khả năng tích hợp. Nếu giao AI chọn, lựa chọn phải được ghi rõ trong decision log, không chọn riêng theo thành viên.

**Trả lời Q-20:** Sử dụng đề xuất của AI

### Q-21 [P1] Giao diện và thiết bị mục tiêu

**Cần biết:** Ngôn ngữ giao diện, ưu tiên desktop/mobile web, yêu cầu responsive, bộ UI/design/template đã có hoặc yêu cầu từ giảng viên. Có cần thiết kế màn hình chi tiết trong bộ tài liệu đợt tiếp theo không?

**Đề xuất:** tiếng Việt, web sử dụng tốt trên laptop và điện thoại ở các thao tác sinh viên; cùng bố cục và cách hiển thị loading/empty/error cho ba role. Screen inventory và mapping API có ích, thiết kế đồ họa chi tiết là phần bổ sung nếu cần.

**Ảnh hưởng:** phạm vi frontend, read endpoints, task chia người, lịch; không tạo ứng dụng di động riêng.

**Trả lời Q-21:** Sử dụng đề xuất của AI

### Q-22 [P1] Có nhận FR-08 thống kê trong bản giao không?

**Cần biết:** Đưa FR-08 SHOULD vào bản đầu, để sau khi MUST ổn, hay hoãn hẳn cho prototype này? Có chỉ cần đúng 4 chỉ số SRS hay muốn chỉ số khác?

**Đề xuất:** đưa đúng 4 chỉ số sau khi các MUST ổn; chưa thêm báo cáo doanh thu, export hoặc bộ lọc nhiều kỳ. Chỗ còn lại trong tổng hợp tính theo phòng đang sử dụng để khớp mục tiêu thống kê; ghi định nghĩa rõ trước khi viết query.

**Ảnh hưởng:** task SHOULD, endpoint/quyền, query và TC-08.1. Nếu thêm chỉ số cần định nghĩa và đánh giá lịch riêng.

**Trả lời Q-22:** Sử dụng đề xuất của AI

### Q-23 [P1] Kiểm thử, CI và môi trường kiểm chứng

**Cần biết:** Nhóm/giảng viên yêu cầu công cụ test/báo cáo nào; có chạy kiểm tra tự động trên GitHub không? Máy kiểm chứng NFR-02/03 là máy nào, có Docker không? Bộ API tra cứu nào cần ưu tiên trong 100 lượt kiểm thử tải?

**Đề xuất:** chọn công cụ cùng stack; DB test PostgreSQL thật; có smoke test/contract test và kiểm tra cạnh tranh quan trọng. CI có thể chuẩn bị cấu hình khi được giao nhưng không tự bật dịch vụ, push hoặc phát hành. Kiểm thử tải dùng đúng 100 sinh viên/100 phòng, 20 người dùng đồng thời và 100 lượt như SRS.

**Ảnh hưởng:** test commands, seeds, pipeline và bằng chứng nghiệm thu; không thay tiêu chuẩn NFR gốc bằng tiêu chuẩn nhẹ hơn.

**Trả lời Q-23:** Sử dụng đề xuất của AI

### Q-24 [P2, phạm vi đầu ra] Bộ tài liệu bổ sung và giới hạn đợt sau

**Cần biết:** Ngoài API Markdown+AGENTS, schema.sql và Business Rules bắt buộc, cậu muốn thêm những phần nào: OpenAPI YAML, ERD Mermaid, data dictionary, seed SQL giả, request collection, screen inventory, checklist kiểm thử, task/ownership templates? Đợt sau chỉ tạo bộ đặc tả hay cũng yêu cầu phần ứng dụng cụ thể?

**Đề xuất:** tạo cả data dictionary, ERD, traceability, checklist và mẫu task/bàn giao để chống phân mảnh; seed/request collection/OpenAPI theo công cụ đã chọn. Tập trung hoàn tất bộ đặc tả trước khi giao viết ứng dụng. Prompt tiếp theo có thể quyết định lại phạm vi cuối cùng.

**Ảnh hưởng:** số lượng file, thời gian và công cụ kiểm chứng. Không tự hiểu câu trả lời "thêm tất cả tài liệu" là cho phép triển khai toàn bộ ứng dụng.

**Trả lời Q-24:** Sử dụng đề xuất của AI

## F. Ghi chú/thay đổi chủ động so với SRS

Chỉ điền nếu muốn thay đổi điều đã có. Nêu yêu cầu cũ, yêu cầu mới, lý do và mức ưu tiên; AI sẽ đánh dấu tác động và cập nhật quyết định, không sửa PDF nguồn.

**Ghi chú của chủ dự án:** CHƯA CÓ

## G. Bảng kiểm trước khi gửi prompt tiếp theo

- [x] Đã trả lời các câu ảnh hưởng bộ đặc tả hoặc ghi rõ phần được giao AI quyết định.
- [x] Có lịch/năng lực đủ để chuyển P1-P4 thành phân công thật, hoặc xác nhận để trống tên tới khi nhóm chốt.
- [x] Các đề xuất đồng ý được ghi rõ, không chỉ xóa chữ CHƯA TRẢ LỜI.
- [x] Đã xác định phạm vi đợt tiếp theo; biết rằng cần gửi thêm prompt để yêu cầu thực hiện.
- [x] Không đưa mật khẩu/thông tin cá nhân thật vào file.
