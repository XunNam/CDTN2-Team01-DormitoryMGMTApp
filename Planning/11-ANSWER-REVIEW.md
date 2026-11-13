# Rà soát câu trả lời và kết quả làm rõ

Trạng thái: **RECONCILED - ba điểm cần làm rõ đã được chủ dự án trả lời trong chat**. Đây là báo cáo rà soát kế hoạch; không phải biên bản kiểm thử ứng dụng.

Nguồn: 24 câu trả lời nguyên gốc ở [09-OWNER-QUESTIONS.md](09-OWNER-QUESTIONS.md), SRS trong [Source/SRS_v2.pdf](Source/SRS_v2.pdf), prompt yêu cầu rà soát và ba câu trả lời bổ sung của chủ dự án trong chat. Không sửa nội dung trả lời Q-01..Q-24 để làm chúng có vẻ chưa từng mâu thuẫn.

## 1. Kết luận rà soát

Ban đầu có **hai thay đổi so với SRS cần xác nhận ý định**, cùng một điểm cần làm rõ về kiểm tra quyền/khóa. Chủ dự án đã chọn giữ yêu cầu gốc và làm rõ hành vi. Hiện không còn mâu thuẫn chặn việc hoàn thiện kế hoạch.

| Điểm | Nội dung ban đầu | Yêu cầu liên quan | Kết quả có hiệu lực |
|---|---|---|---|
| Mật khẩu | Q-05/Q-18 muốn lưu dạng rõ và so chuỗi | NFR-01, TC-N1: mật khẩu băm | Q-25 giữ băm; chỉ phần yêu cầu mật khẩu rõ trong câu trả lời cũ bị thay thế |
| Tạo hồ sơ/cấp tài khoản | Q-05/Q-06 muốn chỉ nhập DB; Q-18 coi có hồ sơ là có tài khoản | FR-01/02, QT-02, UC-04/06/07, TC-01.1/02.1; các chức năng hồ sơ khác phụ thuộc cách bỏ phạm vi | Q-26: nhập DB chỉ khởi tạo demo; vẫn BQL tạo hồ sơ trước, Admin cấp tài khoản sau, giữ đủ FR-01/02 |
| Role và khóa | Q-06 không cần kiểm tra lỗi ROLE; Q-17 reload mới văng | QT-01, NFR-01; quyền phải được kiểm tra tại API | Q-27: không cần đẩy logout tức thời; mỗi request API bảo vệ vẫn kiểm tra role, ownership và khóa |

Việc dùng hai kho tài khoản cho sinh viên và nhân sự **không tự mâu thuẫn SRS**. Điều cần giữ là vòng đời hồ sơ khác vòng đời tài khoản, quyền nhất quán và một cách định danh actor. Thiết kế kỹ thuật dung hòa được ghi ở mục TECH-03 của [12-SHARED-TECHNICAL-BASELINE.md](12-SHARED-TECHNICAL-BASELINE.md).

## 2. Ba câu hỏi bổ sung và trả lời nguyên văn

### Q-25 - Mật khẩu và NFR-01

Câu hỏi: Q-05/Q-18 yêu cầu lưu mật khẩu dạng rõ, còn NFR-01 trong SRS yêu cầu băm mật khẩu. Cậu muốn chốt theo hướng nào?

**Trả lời của chủ dự án:** Giữ yêu cầu băm mật khẩu của SRS; vẫn có cách tạo tài khoản demo đơn giản (đề xuất).

**Diễn giải áp dụng:** mọi role dùng password hash; dữ liệu demo được tạo bằng cơ chế sinh hash. Không dùng plaintext để đăng nhập thật, không lưu mật khẩu ở response/log. Thuật toán cụ thể do AI chọn trong chuẩn kỹ thuật, không nói chủ dự án đã trực tiếp chọn thuật toán đó. Băm là phép biến đổi một chiều, khác mã hóa có thể giải mã; đây cũng là hướng dẫn của [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

### Q-26 - Giữ hay bỏ chức năng quản lý tài khoản/hồ sơ

Câu hỏi: Q-05/Q-06 chuyển việc tạo hồ sơ sinh viên và cấp tài khoản sang sửa database, còn FR-01/FR-02 yêu cầu Admin/BQL thực hiện qua ứng dụng. Phạm vi cuối cùng là gì?

**Trả lời của chủ dự án:** Nhập database chỉ để khởi tạo dữ liệu demo; giữ đủ chức năng tài khoản/hồ sơ theo SRS (đề xuất).

**Diễn giải áp dụng:** không loại API tạo/cập nhật/tìm hồ sơ BQL, API cấp/gán role lúc cấp/khóa/mở tài khoản Admin, hay chức năng sinh viên xem/sửa liên hệ. Một hồ sơ có thể chưa được cấp tài khoản. Không giữ suy luận cũ "có hàng trong bảng hồ sơ là có quyền đăng nhập". Nhập DB phục vụ demo không được trở thành đường ghi bỏ qua sức chứa, lịch sử hoặc constraint.

### Q-27 - Kiểm tra role, ownership và khóa

Câu hỏi: Có thể hiểu yêu cầu "không kiểm tra lỗi ROLE" và "khóa thì reload sẽ văng" là không cần màn hình sửa lỗi nhập tay hoặc đăng xuất tức thời, nhưng API vẫn kiểm tra role, quyền sở hữu và khóa ở mỗi request được bảo vệ không?

**Trả lời của chủ dự án:** Đúng; API vẫn kiểm tra đầy đủ, tài khoản khóa bị từ chối ở request tiếp theo, không cần thông báo đăng xuất tức thời (đề xuất).

**Diễn giải áp dụng:** UI đang mở có thể còn hiển thị cho tới request kế tiếp; không có quyền tiếp tục thao tác chỉ vì chưa reload. Server kiểm tra trước xử lý request mới. Không hứa hủy ngược một transaction đã bắt đầu hoặc dùng WebSocket để đẩy logout. Giá trị role lạ không nhận được quyền mặc định; request trái quyền bị từ chối.

## 3. Những điểm đã hòa giải mà không phải hỏi lại

| Câu trả lời | Cách cập nhật kế hoạch |
|---|---|
| Q-01 Next.js, Express.js, PostgreSQL mới nhất | Chốt hai framework. Dùng bản PostgreSQL ổn định mới nhất đã kiểm tra tại thời điểm rà soát, pin phiên bản; không chọn RC/beta hoặc tag latest trôi |
| Q-02 chưa chọn hosting | Cần Docker/Compose bàn giao; giữ hosting là quyết định triển khai sau, không chặn kế hoạch/API/DB |
| Q-03 tuần 8, mốc 28/11, trước 20/12, nộp 23/12 | Dùng ngày cụ thể: mục tiêu triển khai 28/11, hạn nội bộ 19/12, nộp 23/12/2026. "Tuần 8" giữ là nhãn nhóm; không tự đổi deadline |
| Q-04 hai lần ghi Thành viên 3 | Có bốn tên khác nhau; chuẩn hóa Trần Tuấn Kiệt thành TV4 trong bảng phân công, không đổi tên người dùng |
| Q-04 frontend và API | Bùi Thế Anh phụ trách frontend/điều phối/review/tích hợp; ba thành viên còn lại làm API được giao. Bỏ phương án cũ mỗi người đều làm một lát UI+API |
| Q-04 mỗi người một file, không merge phần người khác | Đề xuất tách file/module bàn giao theo owner trong một Express app chung; không tự gom code người khác. Không suy diễn bắt buộc mọi logic một người nhét vào một file lớn. Cấu trúc file source sẽ được chốt khi tạo nền ứng dụng |
| Q-04 có thể chỉnh API phục vụ frontend | Điều phối viên có thể đề xuất sửa; phải cập nhật contract, schema/rules/test bị ảnh hưởng trước khi áp dụng. Không trở thành ngoại lệ cho việc đổi API âm thầm |
| Q-07 có thể đổi nhưng câu cuối nói không đổi | Áp dụng kết luận cụ thể cuối câu: gán lúc tạo, role bất biến sau tạo. Không làm endpoint đổi role sau tạo |
| Q-17 cho tự khóa và không cần bảo vệ Admin cuối | Cho tự khóa; không thêm guard cấm khóa Admin cuối. Nhóm có thể sửa trạng thái trong DB để khôi phục theo lựa chọn vận hành của chủ dự án |
| Q-18 thêm ngày sinh/địa chỉ, Q-08 chọn tối thiểu | Thêm ngày sinh và địa chỉ thường trú theo yêu cầu cụ thể; vẫn giữ họ tên, giới tính, lớp/khoa, email cùng các trường SRS. Không tự thêm CCCD/ảnh/giấy tờ |
| Q-11..16/19..24 chọn đề xuất | Chấp thuận đúng phần đề xuất đã viết. Những đề xuất chỉ nói "sẽ chọn" không trở thành một giá trị cụ thể do chủ dự án chọn; lựa chọn kỹ thuật được ghi riêng ở file 12 |

## 4. Điều được chốt và điều chỉ được giao chuẩn bị

- Đã chốt: role `SV/BQL/ADMIN`, role gán lúc cấp, session không hoạt động 30 phút, kiểm quyền/khóa ở API, giữ 8 FR và 3 NFR, xử lý một kỳ, vòng đời đơn/lưu trú/phiếu như SRS.
- Đã đồng ý cách làm: kỳ đóng vẫn xét đơn chờ; mở lại cùng kỳ; gửi lại khi đủ điều kiện; hủy xếp thủ công có lý do/người/thời điểm; xem lưu trú cá nhân không thấy bạn cùng phòng; thống kê đúng bốn chỉ số sau MUST.
- Đã giao AI chuẩn hóa: API conventions, tên trường/enum, ID, cách thể hiện tiền/ngày, kỹ thuật auth trong yêu cầu 30 phút. File 12 ghi lựa chọn và nguồn ủy quyền.
- Chưa có và không được bịa: số giờ mỗi người, năng lực chi tiết của hai bạn Kiệt, gán chính thức từng domain API, hosting/domain cuối cùng, thông số máy đo tải. Đây là đầu vào vận hành ở task tương lai, không phải mâu thuẫn chặn bộ kế hoạch.
- Lượt này hoàn thiện kế hoạch; chưa viết contract operation chính thức, `SQL/schema.sql`, source hoặc cài đặt/chạy PostgreSQL của người dùng.

## 5. Kiểm tra tránh tái xuất hiện mâu thuẫn

1. AI đọc câu trả lời thô Q-05/Q-18 phải đọc tiếp Q-25/Q-26 trước khi đề xuất model hoặc viết đăng nhập.
2. Không xóa FR/UC/TC tài khoản-hồ sơ khỏi inventory vì bản trả lời cũ nói nhập DB.
3. Không dùng role do client gửi để cấp quyền; chọn giao diện chỉ là kết quả phân quyền, không thay kiểm tra tại API.
4. Không đánh dấu TC-N1 đạt nếu chưa có mật khẩu băm và test quyền/ownership; hiện chưa có runtime để test.
5. Không tự đổi role của tài khoản sau tạo hoặc thêm bảo vệ Admin cuối trái quyết định Q-07/Q-17.
6. Không biến phiên bản PostgreSQL đã chọn thành yêu cầu tự nâng cấp database trên máy ngoài repo.
# Yêu cầu môi trường ngày 13/11/2026

**OWNER_CONFIRMED**, nguyên văn chủ dự án: “Hãy điều chỉnh lại để dự án chạy ở NodeJS 26. Chỉnh sửa lại denpendency nếu có lỗi.”

Thay chuẩn Node 24 bằng Node 26. Giữ npm 11 đang cài. Không thay quyết định nghiệp vụ hoặc công nghệ Express/Next.js/PostgreSQL.
