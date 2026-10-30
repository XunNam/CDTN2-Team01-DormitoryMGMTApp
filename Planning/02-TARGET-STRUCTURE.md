# Cấu trúc thư mục và hợp đồng tài liệu dự kiến

**Ghi chú giai đoạn mới:** tài liệu này giữ nội dung kế hoạch lịch sử. Bộ đặc tả thực tế và các lựa chọn đã chốt xem [baseline revision 1.0.0](13-SPECIFICATION-BASELINE.md). Lệnh chờ tạo đặc tả trong kế hoạch cũ đã được prompt mới thay thế; không dùng các đề xuất cũ để ghi đè contract/schema hiện hành.

Trạng thái: **PLAN_RECONCILED** cho kế hoạch; bố cục file đích là **PROPOSED** để dùng khi được giao tạo bộ đặc tả. Chỉ `README.md`, `AGENTS.md` và `Planning/` hiện có. Đã nhận câu trả lời và hòa giải tại file 11; cây dưới đây chưa phải các file đã tồn tại. Chuẩn API/auth/dữ liệu lấy từ file 12, không chọn lại riêng cho từng thư mục.

## 1. Cây thư mục cho bộ đặc tả cộng tác

```text
CDTN2-Team01-DormitoryMGMTApp/
├── AGENTS.md
├── README.md
├── Planning/                         # kế hoạch/câu hỏi/quyết định/nguồn của đợt này
│   ├── AGENTS.md
│   ├── 00-PLAN-INDEX.md ... 10-DECISIONS-AND-HANDOFF.md
│   ├── 11-ANSWER-REVIEW.md
│   ├── 12-SHARED-TECHNICAL-BASELINE.md
│   └── Source/SRS_v2.pdf
├── API Endpoint/
│   ├── AGENTS.md
│   ├── README.md                     # mục lục operation + role/FR/UC
│   ├── Shared/
│   │   ├── AGENTS.md
│   │   ├── 00-conventions.md          # URL, ID, JSON, phân trang, ngày, tiền
│   │   ├── 01-authentication.md       # đăng nhập/xuất/đổi mật khẩu
│   │   ├── 02-authorization.md        # ma trận quyền và ownership
│   │   ├── 03-data-contracts.md       # DTO/enum dùng chung
│   │   ├── 04-errors.md               # error code và response lỗi
│   │   └── 05-concurrency-and-retry.md
│   ├── Student/
│   │   ├── AGENTS.md
│   │   ├── README.md
│   │   ├── 01-my-profile.md
│   │   ├── 02-room-search.md
│   │   ├── 03-my-applications.md
│   │   ├── 04-my-residence.md         # thông tin/lịch sử cá nhân đã nhận Q-13
│   │   └── 05-my-receipts.md
│   ├── Dormitory Management/
│   │   ├── AGENTS.md
│   │   ├── README.md
│   │   ├── 01-student-profiles.md
│   │   ├── 02-buildings-and-rooms.md
│   │   ├── 03-registration-period.md
│   │   ├── 04-application-review.md
│   │   ├── 05-residence-lifecycle.md
│   │   ├── 06-receipts-and-payment.md
│   │   └── 07-statistics.md           # SHOULD, Q-22 đã nhận sau MUST
│   ├── System Admin/
│   │   ├── AGENTS.md
│   │   ├── README.md
│   │   ├── 01-account-provisioning.md
│   │   ├── 02-lock-and-unlock.md
│   │   └── 03-role-assignment.md
│   └── openapi.yaml                  # dẫn xuất theo công cụ/Q-24; không thay Markdown
├── SQL/
│   ├── AGENTS.md
│   ├── README.md
│   ├── schema.sql                    # DDL PostgreSQL đầy đủ theo quyết định
│   ├── 01-data-dictionary.md
│   ├── 02-relationships.md            # ERD và cardinality
│   ├── 03-constraints-and-indexes.md
│   ├── 04-transactions-and-locking.md
│   ├── 05-migration-policy.md
│   ├── 06-schema-verification.md
│   └── seeds/                        # dữ liệu giả, tách DDL; password hash theo Q-25
├── Business Rules/
│   ├── AGENTS.md
│   ├── README.md
│   ├── 00-glossary-and-statuses.md
│   ├── 01-accounts-and-permissions.md # QT-01..03
│   ├── 02-rooms-and-capacity.md       # QT-04..05
│   ├── 03-registration.md            # QT-06..08
│   ├── 04-review-and-allocation.md   # QT-09..10 + QT-05/08
│   ├── 05-residence-lifecycle.md     # QT-11..13, QT-16
│   ├── 06-receipts-and-payment.md    # QT-14..16
│   ├── 07-statistics.md              # QT-17
│   └── 08-validation-matrix.md
└── Coordination/
    ├── AGENTS.md
    ├── README.md
    ├── shared-conventions.md
    ├── traceability-matrix.md
    ├── ownership.md
    ├── task-template.md
    ├── handoff-template.md
    ├── acceptance-checklist.md
    └── decisions/
        └── README.md                 # decision log triển khai, liên kết lịch sử Planning
```

Tên `API Endpoint/`, `SQL/`, `Business Rules/` đáp ứng cách chia của chủ dự án. Thư mục role giúp người đọc tìm việc, nhưng một hành vi/DTO chỉ được định nghĩa chuẩn ở một nơi; file role khác dẫn chiếu thay vì chép rồi sửa riêng.

## 2. Độ nhỏ của file

- Chia theo **nhóm nghiệp vụ ổn định**, không bắt buộc một file/một HTTP endpoint gây hàng trăm file rời rạc.
- Trong mỗi file, mỗi operation có mục riêng với mã duy nhất; nếu một nhóm quá lớn thì tách tiếp và cập nhật mục lục/truy vết.
- `README.md` của role phải liệt kê đầy đủ operation, người được gọi, nguồn và phụ thuộc. Không chứa một bản hợp đồng response thứ hai.
- Mẫu dự kiến ở đây là tên đích thống nhất. Nếu kế hoạch chuyên môn gợi ý tên phụ khác, chuẩn hóa về cây này khi tạo tài liệu, ghi thay đổi vào index.

## 3. Trách nhiệm tối thiểu của AGENTS từng phần

| Phạm vi | Hướng dẫn bắt buộc ngoài AGENTS gốc |
|---|---|
| API Endpoint | Đọc conventions, quyền, DTO, errors; cấm tự đổi URL/trường/enum; cập nhật operation index và truy vết |
| Shared | Một nơi định nghĩa auth/error/enum/DTO; thay đổi phải nêu mọi consumer bị ảnh hưởng |
| Student | Ràng buộc ownership ở API; lấy chủ thể từ phiên; không cho client chọn sinh viên khác hoặc sửa trường do BQL quản lý |
| Dormitory Management | Transaction, kiểm tra trạng thái, sức chứa, trùng hồ sơ/phiếu; không lấn quản lý tài khoản |
| System Admin | Không tự cấp quyền nghiệp vụ; hồ sơ sinh viên phải có trước tài khoản; lock không xóa dữ liệu |
| SQL | Đúng PostgreSQL được chọn; schema/migration nhất quán; không phá dữ liệu; kiểm chứng constraint và cạnh tranh liên dòng |
| Business Rules | Dẫn nguồn FR/QT/AC; bảo toàn quy tắc gốc; quy tắc bổ sung có quyết định; nêu rõ điều kiện/chuyển trạng thái/tác động |
| Coordination | Cập nhật owner, dependency, decision và nghiệm thu đồng bộ; không tự đổi trạng thái hoàn thành khi chưa có bằng chứng |

AGENTS con phải dẫn về AGENTS gốc và lặp lại ngắn gọn giới hạn **chỉ sửa repo, không tự commit/push** để AI bắt đầu từ thư mục con vẫn thấy. Không sao chép toàn bộ hướng dẫn gốc rồi để các bản lệch nhau.

## 4. Các file sẽ có nếu được giao viết ứng dụng ở đợt khác

`frontend/` (Next.js), `backend/` (Express.js), `tests/`, cấu hình Compose, `.env.example`, pipeline kiểm tra và migrations chỉ được tạo khi có yêu cầu triển khai. Cấu trúc source/công cụ migration được chốt ở task nền tảng trước khi viết các module.

`schema.sql` là đầu ra bắt buộc của bộ đặc tả tiếp theo. Q-24 đã nhận hướng bổ sung data dictionary, ERD, traceability, checklist và mẫu task/bàn giao; seed/OpenAPI/request collection cụ thể theo công cụ chung được chọn, không cần hỏi lại phạm vi tài liệu đã nhận. Nếu có ORM migration, phải chốt nguồn DDL chuẩn và cách kiểm tra tương đương trước khi hai người cùng sửa.

Theo Q-04, mỗi API owner bàn giao module/file riêng trong một Express app chung, không tự merge phần người khác. Anh sở hữu frontend/tích hợp. Đề xuất thư mục `backend/src/modules/<nhom-nghiep-vu>/` với entry/router rõ; đây là phương án source tương lai, không buộc một người nhét mọi logic vào một file hoặc dựng ba backend. Next.js không tự triển khai một bộ nghiệp vụ/DB riêng song song Express.

## 5. Quy tắc liên kết và truy vết

Mỗi operation phải dẫn tới FR/UC/QT, DTO chung, constraint/transaction liên quan và test. Mỗi bảng/constraint phải có ý nghĩa nghiệp vụ, consumer và trường dữ liệu công khai tương ứng nếu có. Một ví dụ truy vết cần tạo sau khi chốt:

```text
FR-05/AC02 + QT-05 + QT-10
  -> operation duyệt/xếp phòng
  -> trạng thái Đã duyệt + Đã xếp phòng
  -> transaction kiểm tra/chốt phòng và hồ sơ
  -> test hai lượt duyệt cùng chỗ cuối
```

Không gắn 1 UC = 1 endpoint một cách máy móc. UC-04 bao gồm UC-06; UC-17 bao gồm UC-19. Endpoint đọc danh sách/chi tiết có thể tách, nhưng không biến kiểm tra nội bộ thành quyền API thừa.

## 6. Tiêu chí hoàn tất cấu trúc

- Người mới đọc root README tìm được AGENTS, SRS, câu hỏi và task của mình.
- Mỗi phần chuyên môn có README, AGENTS, đầu ra thực và đường dẫn tới phần liên quan.
- Mỗi file có trạng thái/nguồn/owner hoặc chỉ rõ nơi lưu owner; không có placeholder trông như đã hoàn tất.
- Markdown vẫn là bản đọc chính cho nhóm; công cụ bổ sung không được làm mất yêu cầu contract Markdown.
- Cây thư mục hiện thực, mục lục và traceability khớp nhau; không còn hai tên khác nhau cho cùng chuẩn.
