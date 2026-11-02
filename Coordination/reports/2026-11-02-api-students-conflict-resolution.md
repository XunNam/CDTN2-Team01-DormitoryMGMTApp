# API Students — xử lý hai conflict PR #3

Ngày: 02/11/2026. Thực hiện: Codex theo yêu cầu Bùi Thế Anh. Nhánh đích: api-students; PR: [#3](https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/3). Chủ dự án cho phép giải quyết conflict, commit ký và push nhánh SV. Không merge/approve PR vào main.

## Nguyên nhân

SV bắt đầu tại `4d8204843cceb4466787dd880324ab451f5d9ee5`; main mới nhất tại `c8317fcaa6f1973f24bc389c097b475839d2e26a` đã nhận PR ADMIN #1 và BQL #2. Hai phía cùng có thay đổi ở tài liệu Shared và harness kiểm thử, nên Git không thể tự quyết định nội dung cuối cùng. Đây là conflict văn bản khi ghép lịch sử, không phải bằng chứng API Students lỗi khi chạy.

| File | Dạng conflict | Cách giải quyết |
|---|---|---|
| `backend/README.md` | Content: SV bổ sung đoạn snapshot/formatter ở cuối file, main có phần cuối từ các nhánh role | Giữ đoạn mới của SV, giải thích helper Shared và timestamp UTC có ba chữ số mili giây theo DEC-029. |
| `backend/tests/integration/shared/harness.ts` | Add/add: hai phía thêm cùng harness nhưng khác kiểm tra date-time | Giữ regex đầy đủ của SV (`YYYY-MM-DDTHH:mm:ss.SSSZ`), thay vì chỉ kiểm tra ký tự `Z` cuối chuỗi. |

Đồng bộ main vào nhánh SV bằng merge commit, giữ lịch sử và các commit ký trước đó. `app.ts` tự kết hợp đúng factory router BQL `createManagementRouter(options.pool)`, đồng thời giữ router SV, auth và pool dùng chung. Implementation/test riêng ADMIN/BQL và app.ts được đối chiếu khớp main; không sửa lại nghiệp vụ các role này. Helper snapshot, formatter, test và quyết định DEC-029 từ bản SV trước đó được giữ nguyên.

## Kiểm chứng trên nhánh SV đã đồng bộ

| Kiểm tra | Kết quả |
|---|---|
| `npm run check` | Build PASS; unit 100/100 PASS |
| `npm run test:integration` | 27/27 PASS, PostgreSQL thật và HTTP đăng nhập thật |
| `npm run test:system` | 2/2 PASS, luồng ba role, quyền sở hữu, cạnh tranh và kiểm tra hiệu năng cục bộ |
| `tools/check_specification.py` | PASS |
| Git diff/check và unmerged index | Không có lỗi khoảng trắng hoặc file conflict còn lại |

Tổng cộng 129 test PASS, không fail/skip. Dùng schema kiểm thử riêng trong PostgreSQL cục bộ; không thay schema nghiệp vụ, không stage `.env`, mật khẩu hoặc log. Các test này xác nhận bộ tình huống hiện có trên máy chủ dự án; không thay kiểm thử frontend hoặc môi trường triển khai thực tế.

Đầu ra: hai conflict đã xử lý, báo cáo và [checkpoint](../tasks/SV-CONFLICT-20261102/progress.md) để theo dõi. Commit ký và push chỉ vào api-students; main và trạng thái approve PR không được thay đổi bởi thao tác này.
