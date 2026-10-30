# Sổ quyết định hiện hành và bàn giao

Trạng thái: **PLAN_RECONCILED / AWAITING_SPECIFICATION_TASK**. Đã đọc 24 câu trả lời và nhận thêm ba xác nhận Q-25..Q-27. Lượt hiện tại hoàn thiện bộ kế hoạch; chưa tạo API contract operation, DDL hoặc ứng dụng. Nguồn trả lời nguyên gốc được giữ trong file 09, các làm rõ trong file 11, chuẩn kỹ thuật do AI chọn trong file 12.

## Cập nhật sang bộ đặc tả

Prompt mới đã cho phép tạo API Contract thật, schema và khung backend. DEC-022..027 được ghi tại [baseline mới](13-SPECIFICATION-BASELINE.md); nội dung phía dưới giữ lịch sử đợt kế hoạch.

## 1. Thứ tự áp dụng nguồn

1. Prompt hiện tại và xác nhận Q-25..Q-27 trong chat có hiệu lực hơn phần trả lời cũ bị thay thế.
2. Sổ quyết định này ghi kết luận, nguồn và phạm vi; [11-ANSWER-REVIEW.md](11-ANSWER-REVIEW.md) giữ nội dung câu hỏi/trả lời bổ sung.
3. [09-OWNER-QUESTIONS.md](09-OWNER-QUESTIONS.md) giữ 24 câu trả lời lịch sử; không lấy riêng câu mật khẩu rõ/nhập DB/hồ sơ tự là tài khoản để bỏ qua Q-25/Q-26.
4. [12-SHARED-TECHNICAL-BASELINE.md](12-SHARED-TECHNICAL-BASELINE.md) là các lựa chọn kỹ thuật trong phạm vi được giao, không phải toàn bộ do chủ dự án trực tiếp chỉ định.
5. [SRS nguồn](Source/SRS_v2.pdf) giữ nguyên, không sửa PDF; FR-01/02 và NFR-01 vẫn được giữ theo xác nhận mới.

## 2. Quyết định đã ghi nhận

| ID | Trạng thái | Nội dung có hiệu lực | Nguồn và tác động |
|---|---|---|---|
| DEC-001 | OWNER_CONFIRMED | Chỉ sửa file trong root repo/bản clone tương ứng | Prompt ban đầu; mọi thao tác ghi |
| DEC-002 | OWNER_CONFIRMED | Không tự commit/push/merge/tag/phát hành/triển khai; chủ dự án kiểm tra thủ công | Prompt ban đầu và AGENTS; không được nới quyền bởi task |
| DEC-003 | OWNER_CONFIRMED | PostgreSQL; đầu ra bộ đặc tả tương lai cần SQL/schema.sql | Prompt ban đầu, Q-01 |
| DEC-004 | OWNER_CONFIRMED | API Markdown theo 3 role; AGENTS từng phần; Business Rules; nhóm 4 người/AI | Prompt ban đầu; cấu trúc đầu ra |
| DEC-005 | SUPERSEDED | Giai đoạn đầu chỉ lập kế hoạch và chờ 24 câu trả lời | Đã hoàn tất nhận câu trả lời; thay bởi DEC-007 cho phạm vi hiện tại; giữ lịch sử |
| DEC-006 | SRS_CONFIRMED | FR-01..07 MUST, FR-08 SHOULD, 3 NFR, 17 QT và 27 UC giữ mã | SRS; không loại yêu cầu tài khoản/hồ sơ hoặc băm mật khẩu |
| DEC-007 | OWNER_CONFIRMED | Rà mâu thuẫn, làm rõ rồi hoàn thiện bộ kế hoạch dựa trên câu trả lời | Prompt hiện tại; chưa phải yêu cầu viết ứng dụng hoặc xuất bộ đặc tả chính thức |
| DEC-008 | OWNER_CONFIRMED | Next.js frontend, Express.js backend; nhóm phát triển trên máy riêng, Anh kiểm tra/tích hợp; Docker bàn giao | Q-01/Q-02/Q-04 |
| DEC-009 | DELEGATED_SELECTION | PostgreSQL 18.6 ổn định được pin cho kế hoạch; xác minh lại khi tạo môi trường, không tag latest trôi | Q-01 yêu cầu mới nhất; bảng phiên bản PostgreSQL chính thức; TECH-01 |
| DEC-010 | OWNER_CONFIRMED | Anh frontend/điều phối/review/tích hợp; Vương, Nguyễn Đỗ Tuấn Kiệt, Trần Tuấn Kiệt làm API được giao | Q-04; domain cụ thể và giờ làm chưa gán |
| DEC-011 | OWNER_CONFIRMED | 28/11/2026 mốc triển khai, hoàn thành trước 20/12, nộp 23/12; hạn nội bộ đề xuất 19/12 | Q-03; dùng ngày cụ thể, không áp lịch 10 tuần mới từ đầu |
| DEC-012 | OWNER_CONFIRMED | Mật khẩu phải băm; khởi tạo demo đơn giản nhưng không lưu plaintext | Q-25 thay phần mật khẩu rõ Q-05/Q-18; giữ NFR-01 |
| DEC-013 | OWNER_CONFIRMED | Nhập DB chỉ để khởi tạo demo; giữ đầy đủ chức năng tài khoản/hồ sơ theo SRS | Q-26 thay phần DB-only Q-05/Q-06 và hồ sơ=account Q-18; giữ FR-01/02/QT-02 |
| DEC-014 | OWNER_CONFIRMED | API kiểm tra role, ownership, khóa mỗi request bảo vệ; tài khoản khóa bị chặn ở request tiếp theo; không cần đẩy logout tức thời | Q-27 làm rõ Q-06/Q-17; UI không thay kiểm tra tại API |
| DEC-015 | OWNER_CONFIRMED | Role SV/BQL/ADMIN, gán lúc tạo và bất biến sau tạo; cho admin tự khóa, không thêm guard admin cuối | Q-05/Q-07/Q-17; UC-06 nằm trong cấp tài khoản |
| DEC-016 | OWNER_CONFIRMED | Thêm ngày sinh và địa chỉ thường trú vào hồ sơ; giữ dữ liệu tối thiểu SRS, lớp/khoa tách; không thêm CCCD/ảnh/giấy tờ | Q-18 cụ thể + Q-08 chấp thuận đề xuất |
| DEC-017 | OWNER_CONFIRMED | Một kỳ thủ công, mở lại/xét đơn cũ sau đóng; gửi lại nếu đủ điều kiện; lưu trú cá nhân; hủy xếp thủ công có lý do; chính sách lịch sử theo đề xuất | Q-11/12/13/16/19; không tạo trạng thái/job ngoài SRS |
| DEC-018 | OWNER_CONFIRMED | Giao AI chọn auth trong giới hạn idle 30 phút, chuẩn API/DB, retry; chấp thuận kế hoạch UI/test/tài liệu bổ sung | Q-05/Q-20/Q-21/Q-23/Q-24; các lựa chọn cụ thể ghi ở file 12 với nhãn DELEGATED_SELECTION |
| DEC-019 | DELEGATED_SELECTION | Giữ hai kho account SV và nhân sự; hồ sơ SV tách account, chỉ tài khoản được cấp mới đăng nhập; shared identity/guards | Q-05 preference + Q-26 bắt buộc vòng đời; TECH-03; không coi raw Q-18 là thiết kế hiện hành |
| DEC-020 | OWNER_CONFIRMED | Nhận FR-08 đúng 4 chỉ số sau MUST, không thêm doanh thu/export | Q-22; vẫn ghi mức ưu tiên SHOULD |
| DEC-021 | DELEGATED_SELECTION | Chuẩn route/JSON/ID/status/error/money/date/pagination trong file 12 | Trong ủy quyền DEC-018; thay đổi cần ghi tác động các consumer |

DEC-001 áp dụng tại `D:\Đồ án\CĐTN2\CDTN2-Team01-DormitoryMGMTApp` trên máy hiện tại và root bản clone tương ứng trên máy thành viên. Không yêu cầu mọi người phải có cùng ổ đĩa hoặc đường dẫn Windows.

DELEGATED_SELECTION nghĩa là lựa chọn của AI có nguồn ủy quyền, được công khai để cả nhóm dùng cùng chuẩn. Không giả mạo thành chủ dự án đã trực tiếp chọn từng kiểu dữ liệu/thuật toán. Khi có yêu cầu thay đổi từ chủ dự án, cập nhật decision và các phần phụ thuộc.

## 3. Kết quả xử lý 24 câu trả lời

| Q | Kết luận | Quyết định/đầu ra liên quan |
|---|---|---|
| Q-01 | Đã trả lời: Next/Express/PG mới nhất; số phiên bản PG được xác minh, không nâng DB máy người dùng | DEC-008/009, TECH-01 |
| Q-02 | Đã trả lời: có Docker; hosting cuối cùng để task triển khai chọn | DEC-008, hạ tầng còn thông tin vận hành chưa có |
| Q-03 | Đã trả lời: lịch có ngày, deadline và mốc nộp | DEC-011, kế hoạch 08 |
| Q-04 | Đã trả lời: tên, vai trò, quy trình bàn giao; chưa gán domain API/giờ làm | DEC-010, kế hoạch 06/08 |
| Q-05 | Đã xử lý: MSSV/username và idle 30 phút; phần plaintext/DB-only bị Q-25/Q-26 thay | DEC-012/013/018/019, TECH-03/04 |
| Q-06 | Đã xử lý: DB chỉ demo; role lạ không được cấp quyền, API vẫn kiểm tra | DEC-013/014 |
| Q-07 | Đã trả lời: áp câu kết luận role không đổi sau tạo | DEC-015 |
| Q-08 | Đã đồng ý đề xuất tối thiểu, cộng thêm DOB/địa chỉ theo Q-18 | DEC-016, dictionary tương lai |
| Q-09 | Đã đồng ý nguyên tắc tương thích khi sửa giới tính; domain cụ thể AI chuẩn hóa cho prototype | TECH-06; không nói chủ dự án tự chọn MALE/FEMALE |
| Q-10 | Đã đồng ý tách ID/mã và chuẩn hóa; phạm vi unique mã phòng do AI ghi rõ | TECH-03/07 |
| Q-11 | Đã đồng ý một kỳ thủ công, mở lại, xét đơn chờ khi đóng | DEC-017, TECH-10 |
| Q-12 | Đã đồng ý gửi lại khi đủ điều kiện, không tự đổi đơn khi phòng đầy | DEC-017, TECH-10 |
| Q-13 | Đã đồng ý xem thông tin/lịch sử lưu trú riêng, không danh sách bạn cùng phòng | DEC-017, API Student |
| Q-14 | Đã đồng ý VND nguyên đồng, không khoản phụ; kiểu tiền/fee 0 do AI chọn công khai | TECH-07 |
| Q-15 | Đã đồng ý tách ngày nghiệp vụ và timestamp server, múi giờ Việt Nam; chi tiết nhập ngày trong chuẩn AI | TECH-07 |
| Q-16 | Đã đồng ý hủy xếp thủ công có lý do/người/thời điểm, không job | DEC-017 |
| Q-17 | Đã trả lời self-lock; hiệu lực khóa được Q-27 làm rõ | DEC-014/015 |
| Q-18 | DOB/địa chỉ được nhận; plaintext và profile=account bị Q-25/Q-26 thay | DEC-012/013/016/019 |
| Q-19 | Đã đồng ý không DELETE mặc định, giữ lịch sử, không soft-delete mọi bảng | TECH-07; không thêm generic audit ngoài nhu cầu SRS |
| Q-20 | Đã giao chuẩn hóa; quy ước cụ thể ở một nơi duy nhất | DEC-018/021, file 12 |
| Q-21 | Đã đồng ý UI Việt, laptop + mobile web SV, cùng trạng thái UI | Kế hoạch 06/08, screen inventory tương lai |
| Q-22 | Đã nhận 4 chỉ số FR-08 sau MUST | DEC-020 |
| Q-23 | Đã nhận hướng kiểm thử cùng stack/PostgreSQL thật, giữ NFR; máy và công cụ cụ thể ở task kiểm chứng | Kế hoạch 07 |
| Q-24 | Đã nhận data dictionary/ERD/traceability/checklist/mẫu task; các dẫn xuất theo công cụ; chưa yêu cầu app trong lượt này | DEC-007/018, cây 02 |
| Q-25 | Đã trả lời trong chat: giữ băm | DEC-012, file 11 |
| Q-26 | Đã trả lời trong chat: giữ đủ FR-01/02 | DEC-013, file 11 |
| Q-27 | Đã trả lời trong chat: API check mỗi request, không logout push | DEC-014, file 11 |

Không còn câu hỏi nghiệp vụ chặn hoàn thiện kế hoạch. Những input task tương lai chưa có không được đổi thành câu trả lời do AI bịa: giờ làm từng người, phân domain API chính thức, hosting, exact dependency/migration tool và cấu hình máy đo tải.

## 4. Mẫu quyết định tiếp theo

```text
ID: DEC-022 hoặc số chưa dùng tiếp theo
Trạng thái: PROPOSED / OPEN / OWNER_CONFIRMED / DELEGATED_SELECTION / SUPERSEDED
Chủ đề và nguồn Q/prompt/ủy quyền:
Lựa chọn, lý do và giới hạn:
Ai quyết định, khi nào:
SRS/FR/QT/UC/AC bị làm rõ hoặc thay đổi:
API/DTO/enum và SQL/constraint/transaction bị ảnh hưởng:
UI/seed/test/tài liệu cần đồng bộ:
Dữ liệu cũ và tương thích:
Kiểm chứng:
Thay thế/bị thay thế bởi:
```

Không xóa quyết định cũ; dùng SUPERSEDED và link bản mới. Khi sau này chuyển sang Coordination/decisions/, giữ nguyên mã DEC, không đánh số lại từ đầu.

## 5. Phạm vi và bước kế tiếp

- Lượt này: rà câu trả lời, làm rõ mâu thuẫn, cập nhật toàn bộ kế hoạch, ghi chuẩn chung và điều phối theo người thật. Không tự tạo ứng dụng hoặc schema thực thi.
- Khi chủ dự án giao tạo bộ đặc tả: dùng kế hoạch/chuẩn đã hòa giải để tạo API Endpoint/, SQL/schema.sql, Business Rules/ và Coordination/ theo cây 02, có AGENTS con và kiểm chứng.
- Khi chủ dự án giao ứng dụng: chốt ngôn ngữ/toolchain/migration và phân task cụ thể; dùng một Express app, một schema, một auth, các module theo owner. Không cho mỗi người dựng một hệ thống riêng.
- Không cần hỏi lại Q-25..Q-27 hoặc các đề xuất đã được chấp thuận. Chỉ hỏi thêm khi có thông tin mới thực sự mâu thuẫn hoặc yêu cầu ngoài phạm vi.

## 6. Bàn giao và kiểm chứng

- Đợt đầu đã tạo 14 file Markdown + bản SRS nguyên gốc; kiểm tra 44 link, hash nguồn, số yêu cầu và trạng thái.
- Đợt hòa giải bổ sung file 11/12, cập nhật tên người/lịch/kiến trúc/quyền/kiểm thử và các nguồn quyết định. Đã kiểm tra **16 file Markdown, 82 liên kết file nội bộ**, UTF-8, code fence, bảng và whitespace; không có lỗi kiểm tra.
- Đối chiếu tự động trước/sau: **24/24 phần trả lời gốc giữ nguyên**, chỉ metadata file 09 thay đổi. Ba câu trả lời bổ sung nằm ở file 11; đủ 21 mã quyết định duy nhất. SHA-256 PDF nguồn vẫn khớp bản gốc.
- Đã rà chéo API/DB/rules/cộng tác/backlog với file 12 và sửa các ghi chú cũ về ngày/unique mã phòng/PATCH/envelope/request lặp/phiên. Không còn câu hỏi chặn kế hoạch; các phần ghi PROPOSED là việc thiết kế hoặc phân công ở task tiếp theo.
- Không có API/DDL/code để kiểm thử runtime; không báo TC-N1/TC-N2/TC-N3 đã đạt chỉ vì kế hoạch mô tả chúng.
- Không commit/push/merge/tag hoặc sửa cấu hình Git; chủ dự án tự kiểm tra thủ công.
