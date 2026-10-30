# Kế hoạch tổng thể và cách sử dụng

Trạng thái: **PLAN_RECONCILED / AWAITING_SPECIFICATION_TASK**. Ngày lập gốc 30/10/2026; múi giờ nghiệp vụ Việt Nam `Asia/Ho_Chi_Minh`. Nhóm gồm Bùi Thế Anh, Trần Quốc Vương, Nguyễn Đỗ Tuấn Kiệt và Trần Tuấn Kiệt; vai trò thực tế tại file 06.

## 1. Mục tiêu của đợt hiện tại

Hoàn thiện kế hoạch theo 24 câu trả lời và ba xác nhận bổ sung để mỗi thành viên/AI nhận việc theo cùng nghiệp vụ, contract và dữ liệu. Đã giải quyết khác biệt về plaintext, DB-only và kiểm quyền/khóa; kết quả ở file 11. Lượt này chưa tạo ứng dụng, DDL hay API contract operation chính thức.

Hai mốc cần tách rõ:

- **Mốc A - hòa giải kế hoạch (đã thực hiện):** chủ dự án đã điền 24 câu hỏi, xác nhận Q-25..Q-27; quyết định được ghi và các phần kế hoạch được cập nhật.
- **Mốc B - tạo bộ đặc tả cộng tác:** soạn `API Endpoint/`, `SQL/`, `Business Rules/` và các tài liệu liên kết theo kế hoạch đã chốt. Mốc này hoàn tất yêu cầu tạo bộ tài liệu; viết ứng dụng là đợt khác nếu chủ dự án giao tiếp.

## 2. Kết quả đã xác minh

- Hai bản `SRS_v2.pdf` tại các thư mục tài liệu được cung cấp có cùng SHA-256; bản sao dùng chung nằm tại `Source/SRS_v2.pdf`.
- SRS có 21 trang, 8 FR, 3 NFR, 17 QT và 27 UC. FR-01 đến FR-07 là MUST; FR-08 là SHOULD.
- Ba vai trò là Sinh viên, Ban quản lý ký túc xá và Quản trị viên hệ thống. Không có kế thừa mặc định quyền nghiệp vụ cho Quản trị viên.
- PostgreSQL là lựa chọn đã xác nhận bởi chủ dự án; SRS chưa có DDL.
- Khi bắt đầu lập kế hoạch, thư mục repo chỉ có `.git`, chưa có mã nguồn hay quy ước công nghệ để kế thừa.
- Chủ dự án giữ quyền kiểm tra và thực hiện commit thủ công. Chưa xác minh trạng thái GitHub từ mạng; không suy luận từ repo local về các nhánh remote.
- Stack Next.js/Express.js đã chốt; PostgreSQL 18.6 là phiên bản ổn định được kiểm tra cho kế hoạch theo yêu cầu mới nhất. Chuẩn API/DB/auth chung được chọn trong phạm vi ủy quyền ở file 12.
- Anh làm frontend/điều phối/review/tích hợp; ba bạn còn lại làm API. Mục tiêu hoàn tất tính năng 28/11/2026, hạn nội bộ 19/12 để xong trước 20/12, nộp 23/12; giờ làm và giao domain API còn do Anh bố trí.

## 3. Các tài liệu cần đọc theo thứ tự

| Thứ tự | Tài liệu | Dùng để quyết định |
|---|---|---|
| 1 | [01-SRS-BASELINE.md](01-SRS-BASELINE.md) | Phạm vi, nguồn, điều đã có sẵn, truy vết FR/UC/TC |
| 2 | [02-TARGET-STRUCTURE.md](02-TARGET-STRUCTURE.md) | Đầu ra nào sẽ được tạo và ai dùng |
| 3 | [03-API-PLAN.md](03-API-PLAN.md) | Danh mục thao tác, quyền, hình thức API contract |
| 4 | [04-DATABASE-PLAN.md](04-DATABASE-PLAN.md) | Entity, ràng buộc, tính nhất quán và DDL cần thiết |
| 5 | [05-BUSINESS-RULES-PLAN.md](05-BUSINESS-RULES-PLAN.md) | Chuẩn hóa 17 QT, trạng thái, điểm thiếu |
| 6 | [06-COLLABORATION-PLAN.md](06-COLLABORATION-PLAN.md) | Chia việc, thay đổi contract, kiểm tra chéo và bàn giao |
| 7 | [07-QUALITY-AND-DELIVERY-PLAN.md](07-QUALITY-AND-DELIVERY-PLAN.md) | Kiểm chứng, demo và triển khai prototype sau này |
| 8 | [08-WORK-BREAKDOWN.md](08-WORK-BREAKDOWN.md) | Task, phụ thuộc và lịch có ngày cụ thể |
| 9 | [09-OWNER-QUESTIONS.md](09-OWNER-QUESTIONS.md) | 24 câu trả lời nguyên gốc; chỉ dùng phần chưa bị xác nhận mới thay thế |
| 10 | [10-DECISIONS-AND-HANDOFF.md](10-DECISIONS-AND-HANDOFF.md) | Kết hợp câu trả lời, lưu quyết định, tiếp nhận đợt sau |
| 11 | [11-ANSWER-REVIEW.md](11-ANSWER-REVIEW.md) | Mâu thuẫn ban đầu và nguyên văn xác nhận Q-25..Q-27 |
| 12 | [12-SHARED-TECHNICAL-BASELINE.md](12-SHARED-TECHNICAL-BASELINE.md) | Chuẩn kỹ thuật AI chọn theo ủy quyền để các phần khớp nhau |

Để tra cứu nhanh quyết định hiện hành, đọc 10 → 11 → 12 trước khi làm task. Baseline 01 ghi điều có trong SRS, không phải bằng chứng các câu hỏi đã trả lời vẫn đang mở.

## 4. Cách ghi trạng thái yêu cầu

| Nhãn | Nghĩa | Có được dùng làm căn cứ triển khai? |
|---|---|---|
| `SRS_CONFIRMED` | Có trong SRS, có trang/FR/QT đối chiếu | Có, khi phần việc đã được giao |
| `OWNER_CONFIRMED` | Chủ dự án xác nhận, có câu hỏi/prompt dẫn chiếu | Có, trong phạm vi được giao |
| `DELEGATED_SELECTION` | AI chọn chi tiết trong phạm vi được giao, có nguồn ủy quyền | Có, theo chuẩn chung và task được giao; không giả chủ dự án tự chọn chi tiết |
| `PROPOSED` | Phương án để xem xét | Chưa được coi là đã duyệt |
| `OPEN` | Chưa đủ thông tin hoặc còn xung đột | Chưa được tự suy diễn |
| `SUPERSEDED` | Đã có quyết định thay thế | Không, chỉ giữ để truy vết |

Một file có thể chứa nhiều nhãn; trạng thái PLANNING của file không phủ nhận phần yêu cầu SRS đã xác nhận. Ngược lại, một chi tiết kỹ thuật nằm cạnh QT đã xác nhận vẫn chỉ là đề xuất nếu chưa có quyết định.

## 5. Thứ tự thực hiện sau khi có prompt tiếp theo

1. Dùng kết quả đã hòa giải ở 10/11, không hỏi lại Q-25..Q-27 hoặc áp phần Q-05/Q-18 đã bị thay thế.
2. Đọc bảng Q → quyết định → tài liệu chịu tác động. Chỉ hỏi tiếp khi yêu cầu mới thực sự mâu thuẫn hoặc vượt phạm vi; thông số task chưa có không phải lý do mở lại 24 câu hỏi.
3. Dùng thuật ngữ/quyền/enum/format tại file 12; hoàn thiện dictionary/lock protocol và toolchain ở task đặc tả, không để frontend/backend chọn chuẩn riêng.
4. Soạn Business Rules, API và database theo từng nhóm nghiệp vụ, kiểm tra chéo liên tục. Không giao DDL cho một AI và endpoint cho AI khác mà không có từ điển chung.
5. Kiểm tra toàn bộ 8 FR/3 NFR/17 QT/27 UC được bao phủ; FR-08 đã được nhận đúng bốn chỉ số sau MUST, hoãn cần ghi quyết định mới.
6. Bàn giao bộ tài liệu hoàn chỉnh, liệt kê phần còn mở, kiểm chứng và hướng dẫn chia task. Không tự commit.
7. Khi có yêu cầu viết ứng dụng: triển khai từng luồng hoàn chỉnh dựa trên bộ đặc tả đã chốt, kiểm thử rồi tích hợp thủ công.

## 6. Các cổng kiểm tra

| Cổng | Điều kiện qua | Chưa đạt thì làm gì? |
|---|---|---|
| G0 - kế hoạch | Đủ file kế hoạch, nguồn, câu hỏi, quy định không commit | Sửa tài liệu; không bắt đầu schema/code |
| G1 - quyết định | Các câu hỏi ảnh hưởng phần sắp làm đã được giải quyết; có prompt thực hiện | Ghi phụ thuộc; làm phần độc lập đã được giao |
| G2 - bộ đặc tả | Quy tắc/quyền/API/schema/test nói cùng một ngôn ngữ; có review chéo | Sửa đồng bộ, không giao mỗi người một bản contract khác nhau |
| G3 - triển khai tương lai | Lát chức năng chạy với DB thật, có test quyền và lỗi | Chặn tích hợp task chưa đạt |
| G4 - nghiệm thu tương lai | MUST + 3 NFR đạt, SHOULD theo quyết định, có bằng chứng demo | Ghi lỗi và chủ sở hữu, không khai đã đạt |

## 7. Ranh giới tránh mở rộng đồ án

Không lập thêm hạng mục triển khai thanh toán online, ngân hàng, điện nước, hoàn tiền, nhiều kỳ đồng thời, chuyển phòng, gia hạn, bảo trì phòng, hợp đồng điện tử, khách ra vào, IoT, mobile riêng, chat, SMS/email hay tích hợp quản lý sinh viên. Nếu chủ dự án thay đổi phạm vi, cần một quyết định mới có tác động tới lịch và kiểm thử.

## 8. Hoàn tất đợt kế hoạch

- Tài liệu đọc được bằng Markdown trong repo, liên kết nội bộ hoạt động.
- Không còn phương án kỹ thuật bị trình bày như quyết định chủ dự án đã duyệt.
- Câu hỏi có mã ổn định, nơi điền, mức cần thiết và tác động.
- AGENTS gốc quy định rõ giai đoạn hiện tại và giới hạn sửa file/không tự commit.
- Báo cáo bàn giao nêu file cần chủ dự án mở tiếp; không yêu cầu trả lời lại những điều SRS đã xác định.
