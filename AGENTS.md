# Hướng dẫn cho mọi AI và người cộng tác

## 1. Phạm vi được phép

- Chỉ tạo, sửa, di chuyển hoặc xóa file bên trong repository `D:\Đồ án\CĐTN2\CDTN2-Team01-DormitoryMGMTApp` trên máy hiện tại. Khi clone trên máy khác, áp dụng giới hạn tương đương tại thư mục gốc của bản clone đó.
- **Không tự commit, push, merge, tạo tag, phát hành hoặc triển khai.** Chủ dự án sẽ kiểm tra thủ công và tự thực hiện. Không coi việc hoàn thành một task là sự cho phép làm các thao tác này.
- Không reset/clean checkout, ghi đè thay đổi của người khác, sửa lịch sử Git hoặc chỉnh cấu hình Git để hoàn thành công việc.
- Được đọc tài liệu nguồn ngoài repo khi người dùng cung cấp; mọi file đầu ra phải nằm trong repo. Không đưa dữ liệu sinh viên thực, mật khẩu thật hoặc khóa truy cập vào tài liệu, seed hay log. Tên thành viên do chủ dự án cung cấp được dùng trong bảng phân công theo yêu cầu cộng tác.

## 2. Giai đoạn hiện tại

**PLAN_RECONCILED / AWAITING_SPECIFICATION_TASK**: chủ dự án đã trả lời 24 câu hỏi và chốt Q-25..Q-27 trong chat; đã cho phép rà soát và hoàn thiện kế hoạch. Lượt này không tạo API contract operation chính thức, `SQL/schema.sql`, migration hoặc mã ứng dụng. Kế hoạch và quyết định được cập nhật; không coi việc hoàn thiện kế hoạch là đã tạo bộ đặc tả hoặc ứng dụng.

Đọc `Planning/11-ANSWER-REVIEW.md` trước khi dùng câu trả lời thô: mật khẩu rõ, DB-only và hồ sơ tự có tài khoản trong Q-05/Q-06/Q-18 đã được Q-25/Q-26 thay thế. Q-27 chốt kiểm quyền/khóa mỗi request API. Không hỏi lại những điều đã được xác nhận. Prompt tiếp theo quyết định phạm vi tạo bộ đặc tả hoặc code; không mặc định cho phép viết toàn bộ ứng dụng.

## 3. Thứ tự đọc bắt buộc

1. File này và `README.md`.
2. `Planning/00-PLAN-INDEX.md`, `Planning/01-SRS-BASELINE.md`.
3. `Planning/10-DECISIONS-AND-HANDOFF.md`, `Planning/11-ANSWER-REVIEW.md`, `Planning/12-SHARED-TECHNICAL-BASELINE.md` để biết quyết định hiện hành và nguồn ủy quyền; đọc thêm câu trả lời gốc tại file 09 để truy vết, không áp phần đã bị thay thế.
4. Kế hoạch của phần việc và mọi `AGENTS.md` trong thư mục con sẽ sửa; phân công/lịch thật tại file 06/08.
5. Các FR/QT/AC liên quan trong `Planning/Source/SRS_v2.pdf`.

Nếu file được chỉ đến chưa có, báo rõ và kiểm tra trạng thái công việc; không tự bịa nội dung thay thế. Hướng dẫn thư mục con bổ sung trách nhiệm riêng, không được nới giới hạn chỉ sửa trong repo hoặc không tự commit.

## 4. Nguồn yêu cầu và chống lệch giữa các AI

- SRS gốc có 8 FR, 3 NFR, 17 QT, 27 UC; giữ nguyên các mã này. PostgreSQL và quy tắc hợp tác từ chủ dự án là yêu cầu bổ sung đã xác nhận.
- Câu trả lời của chủ dự án có thể làm rõ hoặc thay đổi SRS. Ghi thay đổi thành quyết định có dẫn chiếu trước khi áp dụng; không sửa PDF gốc hoặc âm thầm coi đề xuất là yêu cầu.
- Nội dung phải phân biệt `SRS_CONFIRMED`, `OWNER_CONFIRMED`, `DELEGATED_SELECTION`, `PROPOSED`, `OPEN`, `SUPERSEDED`. DELEGATED_SELECTION là lựa chọn AI có nguồn ủy quyền, không giả là chủ dự án tự chọn từng chi tiết. Bản kế hoạch hiện tại chưa phải contract để sinh code.
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
