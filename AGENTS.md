# Hướng dẫn cho mọi AI và người cộng tác

## 1. Phạm vi được phép

- Chỉ tạo, sửa, di chuyển hoặc xóa file bên trong repository `D:\Đồ án\CĐTN2\CDTN2-Team01-DormitoryMGMTApp` trên máy hiện tại. Khi clone trên máy khác, áp dụng giới hạn tương đương tại thư mục gốc của bản clone đó.
- **Không tự commit, push, merge, tạo tag, phát hành hoặc triển khai.** Chủ dự án sẽ kiểm tra thủ công và tự thực hiện. Không coi việc hoàn thành một task là sự cho phép làm các thao tác này.
- Không reset/clean checkout, ghi đè thay đổi của người khác, sửa lịch sử Git hoặc chỉnh cấu hình Git để hoàn thành công việc.
- Được đọc tài liệu nguồn ngoài repo khi người dùng cung cấp; mọi file đầu ra phải nằm trong repo. Không đưa dữ liệu sinh viên thực, mật khẩu thật hoặc khóa truy cập vào tài liệu, seed hay log. Tên thành viên do chủ dự án cung cấp được dùng trong bảng phân công theo yêu cầu cộng tác.

## 2. Giai đoạn hiện tại

**SPECIFIED_NOT_IMPLEMENTED / revision 1.0.0**: chủ dự án đã yêu cầu bộ hướng dẫn AI, API Contract thật cho3 role, chọn khung backend và chốt schema. Phạm vi lượt này gồm tài liệu trong `API Endpoint/`, `SQL/`, `Business Rules/`, `Coordination/` và backend scaffold dùng chung. Không tự triển khai toàn bộ nghiệp vụ. Các lệnh “chỉ lập kế hoạch/chờ task đặc tả” trong Planning mô tả giai đoạn cũ và đã được yêu cầu này thay thế.

Nguồn hiện hành: `Planning/13-SPECIFICATION-BASELINE.md`; contract revision1.0.0 và schema là đầu vào code theo task, chưa là bằng chứng ứng dụng hoạt động. Giữ quyết định Q-25..Q-27 và các giới hạn không tự Git.

### Nhận việc theo role

- Nếu giao code mà chưa rõ role, **hỏi chính người đang giao việc**: “Bạn đang phụ trách Sinh viên (SV), Ban quản lý (BQL), Quản trị viên (ADMIN), hay phần Shared được Anh giao?”. Đợi câu trả lời; không tự chọn role, không đoán từ tên thành viên.
- Nếu rõ role nhưng chưa rõ task, hỏi operationId/phạm vi file; đọc `Coordination/README.md` và task board để tránh nhận cùng file với người khác. Đợt soạn đặc tả toàn hệ thống này do chủ dự án trực tiếp giao, không cần hỏi role lại cho việc biên soạn.
- Role tài liệu/code không tự cấp quyền Shared. Chỉ sửa SQL/auth/session/migration/root router khi task của điều phối bao gồm các file đó.
- Đọc AGENTS tại thư mục role tài liệu và role code. Code nằm tại `backend/src/roles/<role>/`, test tại `backend/tests/<role>/`. Không đặt code trong Markdown/SQL docs hoặc tự tạo app riêng.
- Router khai báo HTTP; controller parse/serialize; validation kiểm allowlist; service xử lý nghiệp vụ và transaction; repository chỉ SQL tham số hóa trên client được truyền vào. Export operationId đúng manifest, không nhét business logic vào router/app.ts/server.ts.

## 3. Thứ tự đọc bắt buộc

1. File này và `README.md`.
2. `Planning/00-PLAN-INDEX.md`, `Planning/01-SRS-BASELINE.md`.
3. `Planning/10-DECISIONS-AND-HANDOFF.md`, `Planning/11-ANSWER-REVIEW.md`, `Planning/12-SHARED-TECHNICAL-BASELINE.md` để biết quyết định hiện hành và nguồn ủy quyền; đọc thêm câu trả lời gốc tại file 09 để truy vết, không áp phần đã bị thay thế.
4. `Planning/13-SPECIFICATION-BASELINE.md`, `Coordination/README.md`, API Shared, schema và mọi `AGENTS.md` trong thư mục sẽ sửa; rồi contract/task role được giao.
5. Các FR/QT/AC liên quan trong `Planning/Source/SRS_v2.pdf`.

Nếu file được chỉ đến chưa có, báo rõ và kiểm tra trạng thái công việc; không tự bịa nội dung thay thế. Hướng dẫn thư mục con bổ sung trách nhiệm riêng, không được nới giới hạn chỉ sửa trong repo hoặc không tự commit.

## 4. Nguồn yêu cầu và chống lệch giữa các AI

- SRS gốc có 8 FR, 3 NFR, 17 QT, 27 UC; giữ nguyên các mã này. PostgreSQL và quy tắc hợp tác từ chủ dự án là yêu cầu bổ sung đã xác nhận.
- Câu trả lời của chủ dự án có thể làm rõ hoặc thay đổi SRS. Ghi thay đổi thành quyết định có dẫn chiếu trước khi áp dụng; không sửa PDF gốc hoặc âm thầm coi đề xuất là yêu cầu.
- Nội dung phải phân biệt `SRS_CONFIRMED`, `OWNER_CONFIRMED`, `DELEGATED_SELECTION`, `PROPOSED`, `OPEN`, `SUPERSEDED`. DELEGATED_SELECTION là lựa chọn AI có nguồn ủy quyền, không giả là chủ dự án tự chọn từng chi tiết. Kế hoạch lịch sử không thay contract; triển khai theo API Endpoint revision hiện hành.
- Không tự thêm role, quyền quản trị toàn bộ, tự đăng ký tài khoản, hủy đơn bởi sinh viên, thanh toán online, chuyển phòng hoặc các chức năng ngoài phạm vi SRS.
- Không chọn lại framework/auth/enum/ID/response trái chuẩn chung: Next.js frontend, Express.js API, PostgreSQL; chuẩn kỹ thuật dùng file 12. Chi tiết chưa có (toolchain, migration, cột/lock protocol) được thiết kế trong task được giao, có nguồn quyết định, không tạo chuẩn riêng từng người.
- Khi contract được chốt: API, schema, quy tắc nghiệp vụ, UI và test phải dùng cùng tên trường, enum, quyền và chuyển trạng thái. Không nhân bản định nghĩa độc lập theo từng vai trò.
- Thay đổi liên phần phải ghi tác động và được điều phối với người phụ trách; làm tiếp các phần độc lập nếu còn câu hỏi, không tự lấp khoảng trống nghiệp vụ.

## 5. Quy trình nhận và bàn giao việc

- Trước khi sửa: đọc trạng thái Git, xác định task, file sở hữu, phụ thuộc và tiêu chí hoàn tất. Không sửa phần người khác đang làm nếu chưa có phối hợp.
- Task cần ghi người phụ trách, người rà soát, nguồn FR/QT, đầu ra, phụ thuộc, quyết định cần có và kiểm chứng dự kiến.
- Sau khi sửa: kiểm tra liên kết/tính nhất quán thích hợp; khi có code thì chạy kiểm chứng tương ứng. Không báo kiểm thử đã chạy khi chưa chạy.
- Bàn giao bằng: nội dung đã làm, file thay đổi, kiểm chứng và kết quả, điều chưa làm, câu hỏi còn mở, ảnh hưởng tới phần khác. Không tự commit.
- Với thay đổi quyền, sức chứa, hồ sơ lưu trú, tiền hoặc migration: phải có người khác rà soát và kiểm thử tình huống sai quyền, trùng dữ liệu, cạnh tranh đồng thời phù hợp trước khi tích hợp thủ công.
- Bùi Thế Anh phụ trách frontend, điều phối, review và tích hợp; Trần Quốc Vương, Nguyễn Đỗ Tuấn Kiệt, Trần Tuấn Kiệt làm API theo task Anh phân. Không tự gán domain API khi chưa giao chính thức, không tự merge code thành viên khác. Điều chỉnh API để phục vụ frontend vẫn phải cập nhật contract và các consumer liên quan.

## 6. Nguyên tắc dữ liệu không được bỏ qua

- Sinh viên chỉ xem dữ liệu riêng; Ban quản lý không cấp tài khoản; Quản trị viên không có quyền nghiệp vụ chỉ nhờ vai trò quản trị.
- Giữ đủ FR-01/02, hồ sơ sinh viên có trước tài khoản và mọi mật khẩu băm (Q-25/Q-26). Dữ liệu DB trực tiếp chỉ để khởi tạo/demo; không thay chức năng quản lý trên app.
- Role `SV/BQL/ADMIN`, gán lúc cấp rồi bất biến; API kiểm tra role/ownership/isLocked ở mỗi request bảo vệ. Cho Admin tự khóa, không thêm guard Admin cuối hoặc logout đẩy tức thời trái Q-17/Q-27.
- Gửi đơn chưa giữ chỗ. Duyệt đơn và tạo hồ sơ lưu trú là một thao tác nhất quán; không vượt sức chứa, kể cả khi thao tác đồng thời.
- Nhận phòng không trừ thêm chỗ. Hủy xếp phòng hoặc trả phòng chỉ giải phóng chỗ đúng một lần, giữ lịch sử và phiếu thu.
- Một sinh viên tối đa một đơn chờ duyệt và một hồ sơ lưu trú chưa kết thúc. Một hồ sơ tối đa một phiếu thu; tiền chốt theo giá lúc lập phiếu.
- Chi tiết còn thiếu được ghi trong file câu hỏi, không giải quyết bằng giả định ẩn.
