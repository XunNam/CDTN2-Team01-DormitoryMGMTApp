> Báo cáo này ghi nhận kết quả review trước commit. Sau đó chủ dự án đã cho phép tạo commit ký riêng cho từng nhánh và push lên origin; yêu cầu không merge hoặc approve PR vẫn giữ nguyên. Phiên bản đã lưu được xác định trong lịch sử Git của nhánh.

# Đánh giá sẵn sàng Backend — 02/11/2026

**READY_FOR_FRONTEND_INTEGRATION — bản code local đã sửa đủ điều kiện để chủ dự án review, commit/push và tích hợp thủ công trước khi nối frontend.** Đây chưa phải chứng nhận production hoặc nghiệm thu toàn prototype. Các PR trên GitHub vẫn ở head cũ cho đến khi chủ dự án đưa các sửa local lên nhánh.

## Phạm vi và nguồn

Chủ dự án giao review/sửa cả ADMIN, BQL, SV, cấu hình PostgreSQL và kiểm tra dữ liệu. Phạm vi bao gồm nền Shared cần thiết để các API chạy thật. Giữ contract revision 1.0.0, 8 FR/17 QT/27 UC; không thêm role/chuyển phòng/thanh toán online. Đối chiếu Planning/13, contract từng role, Shared, SQL/schema.sql và SRS gốc; NFR-01/02/03 kiểm lại trực tiếp ở trang 15–16. Hash PDF không thay đổi.

Ngày kiểm tra theo Asia/Ho_Chi_Minh. Node 24.18.0, PostgreSQL 18.6; máy đang dùng npm 12.1.0 trong khi manifest pin npm 11. Không nâng dependency/đổi lockfile; nên dùng npm 11 khi chạy CI hoặc cài sạch theo chuẩn nhóm.

| Role | PR/head nguồn đã đối chiếu bằng git ls-remote | Trước review | Sau sửa local | Build/unit | PostgreSQL integration |
|---|---|---|---|---|---|
| ADMIN | [PR #1](https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/1), c5f78a0 | 5 API, thiếu wiring Pool/auth | 5/5 + Shared | PASS, 39/39 | PASS, 18/18 |
| BQL | [PR #2](https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/2), f0f6f68 | 28 API, nhiều quy tắc đặt trong repository | 28/28 + Shared, đúng tầng | PASS, 33/33 | PASS, 4/4 |
| SV | [PR #3](https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/3), 4356ab0 | P1: 6/13, test integration sao chép mock/import lỗi | 13/13 + Shared, test DB thật | PASS, 55/55 | PASS, 10/10 |

Số test từng nhánh có phần Shared trùng nhau; không cộng ba hàng để suy ra số test độc lập. Một test có nhiều kiểm tra nghiệp vụ. Bản ghép được kiểm riêng: **93 unit + 26 integration + 2 system = 121/121 PASS, không fail/skip/todo**; đủ 51 operation gồm Shared 5 + ADMIN 5 + BQL 28 + SV 13 trong toàn bộ bộ kiểm tra.

## Các sửa quan trọng

- Shared: triển khai đủ CSRF/login/logout/change-password/me; Argon2id, regenerate session/token, idle 30 phút, thu hồi phiên bằng version, fresh guard và logout lặp/khóa theo contract. Verify login ngoài khóa, đọc lại credential/version dưới khóa; ca đổi mật khẩu lúc login chờ khóa đã được kiểm trên PostgreSQL.
- App nối một Pool vào app.locals cho ADMIN/SV; fixture không còn tự chữa wiring. BQL vẫn dùng router factory nhận chính Pool đó. Session PostgreSQL thật, lỗi store trả 503; Pool có giới hạn chờ khóa/câu lệnh và xử lý mất kết nối idle; server kiểm DB trước khi listen.
- ADMIN giữ nguyên phạm vi 5 operation; sửa harness che lỗi wiring và test đang giả định namespace BQL còn trống.
- BQL chuyển kiểm tra trạng thái/giới tính/sức chứa/phiếu trùng về service; repository chỉ truy vấn tham số hóa và map DTO. Sửa offset bằng BigInt, chặn năm 0000, bổ sung export validation theo operationId. Sửa fixture gọi service bằng mã chưa chuẩn hóa; HTTP vẫn chuẩn hóa qua validation.
- SV bổ sung 7 operation P2/P3, khóa/ownership/filter/error đúng contract; gửi đơn không giữ chỗ. Giữ unit test P1, thay 6 bản sao mock trong integration bằng test đăng nhập/HTTP/PostgreSQL thật và đặt đúng thư mục role.

SV trước đó chỉ được giao P1 theo handoff của nhánh; thiếu P2/P3 là phần bổ sung trong yêu cầu review toàn backend lần này, không quy trách nhiệm thành viên đã nhận P1.

## Database và dữ liệu

File backend/.env của từng worktree đã cấu hình localhost:5432, database dormitory-db và tài khoản được chủ dự án cung cấp; secret chỉ nằm trong file local bị Git bỏ qua. Không đưa mật khẩu vào báo cáo, seed hoặc Git.

Ban đầu codex kết nối được nhưng không có quyền các bảng public thuộc theanh. Chủ dự án đã chấp thuận cụ thể việc chạy SQL/grant-local-app-access.sql; script đã COMMIT bằng phiên pgAdmin theanh sẵn có. Chỉ cấp CONNECT/USAGE và SELECT/INSERT/UPDATE/DELETE cho 10 bảng, SELECT cho view; không đổi owner/superuser/role membership. db:check sau đó PASS trên public; db:verify xác nhận columns/constraints/indexes/triggers/functions/view khớp schema.sql (chuẩn hóa CRLF/LF).

Đã chạy SQL/tests/invariants.sql trên public bằng codex trong transaction ROLLBACK, và chạy GET csrf → logout bằng PostgreSQL session store thật. Sau probe: dữ liệu nghiệp vụ không thay đổi, không còn session thử. Các luồng có COMMIT và lịch sử được chạy trong schema codex_review_* riêng, search_path không chứa public để tránh ghi nhầm. Các namespace test được giữ để có thể kiểm lại; không DROP/TRUNCATE hoặc tắt trigger.

## Bằng chứng luồng và cạnh tranh

Bản ghép tại .qa/combined chỉ là thư mục kiểm chứng, không phải merge Git. Đã kiểm qua HTTP sau login thật: BQL tạo/sửa/tìm hồ sơ, tòa/phòng/kỳ → ADMIN cấp SV/BQL → SV gửi/xem đơn → BQL duyệt, nhận, lập phiếu, trả và thanh toán → SV đọc lịch sử/phí. Sai role/khóa/CSRF/input/ownership bị từ chối đúng envelope.

Ca tranh chấp chủ động giữ advisory lock rồi xác nhận cả hai transaction cùng chờ trên pg_locks trước khi thả: gửi trùng đơn, duyệt chỗ cuối, lập phiếu trùng, nhận phòng trùng, thanh toán trùng. Kết quả một thành công và một 409; không vượt sức chứa/ghi tiền hai lần. Kiểm thêm actor bị khóa trong lúc chờ: request trả 401 và không ghi dữ liệu. Các kịch bản approve/reject cùng đơn cũng đã kiểm bằng hai transaction thật.

Kiểm thêm: xét đơn cũ khi kỳ đóng; submit chưa giảm chỗ; nhận không giảm chỗ lần hai; không ngừng phòng đang có người; không sửa giới tính trái hồ sơ mở; trả/hủy chỉ trả chỗ một lần; trả khi còn nợ; giữ phiếu sau ENDED/CANCELLED; phí 0 vẫn UNPAID; snapshot BIGINT 9223372036854775807 không mất độ chính xác; gọi lặp trả 409.

NFR-02 được đo lại trên schema riêng có **đúng 100 hồ sơ SV + 100 phòng**, 20 tài khoản SV đăng nhập khác nhau, 5 vòng × 20 request = 100 lượt tra cứu. **100/100 dưới 2000 ms; p95 44 ms, tối đa 44 ms** trên máy local này. Đây là bằng chứng môi trường local, không suy rộng sang hosting khác.

NFR-01: các kiểm tra xác thực/role/ownership/khóa/hash/session đạt trong phạm vi test. **NFR-03 còn NOT_RUN**: chưa có frontend/Compose để nghiệm thu toàn prototype bằng tối đa 2 lệnh. Không chặn bắt đầu frontend, nhưng phải hoàn thiện trước nghiệm thu đồ án.

## Tích hợp thủ công

1. Chủ dự án review và commit/push thay đổi của từng worktree; báo cáo riêng ở Coordination/reports/2026-11-02-api-<role>-review.md. AI chưa commit/push/merge/tag.
2. Các file Shared mới được đồng bộ giống nhau ở cả ba nhánh. app.ts vẫn có khác biệt nền BQL dùng createManagementRouter; khi xử lý conflict phải giữ factory này, createAuthRouter(options.pool), app.locals.pool và SafeSessionStore. Không chọn toàn bộ một phiên bản chỉ để bỏ conflict.
3. Sau khi ghép source, giữ đủ 4 namespace auth/student/management/admin và một Pool/session. Chạy npm run check, npm run test:integration, npm run test:system trên vùng test riêng trước khi coi bản main tích hợp đạt.
4. Cả ba PR gốc đều xóa .github/CODEOWNERS so với main (head main 8d8ae47). Thay đổi này đã có từ trước review, chưa tự phục hồi hoặc đổi chính sách review. Chủ dự án cần kiểm lại ý định khi merge.
5. DB public hiện chưa có tài khoản nghiệp vụ. Trước demo đăng nhập, tự chọn thông tin Admin ban đầu qua công cụ db:bootstrap-admin như backend/README; sau đó cấp các account còn lại bằng API ADMIN. Không dùng tài khoản/mật khẩu fixture cho dữ liệu thật.

Thư mục local: BQL ở repo gốc; ADMIN ở .qa/review/api-admins; SV ở .qa/review/api-students. Đây là Git worktree gắn đúng nhánh, các sửa chưa commit được giữ tại đó. Thư mục .qa/combined không dùng để commit thay ba nhánh.

## Kiểm tra bàn giao cuối

Đã kiểm whitespace, không đưa thông tin kết nối bí mật vào file được Git theo dõi, và đồng bộ nội dung Shared giữa ba worktree. tools/check_specification.py đã sửa cách loại thư mục theo đường dẫn tương đối để không bỏ toàn bộ tài liệu khi worktree nằm dưới .qa. Kết quả kiểm: BQL 86 Markdown/521 liên kết; ADMIN 89/521; SV 88/523; 51 operation, 44 ví dụ DTO/OpenAPI và hash SRS đều PASS. Đã kiểm công cụ bootstrap tạo Admin đầu tiên và từ chối khi có staff, bằng DB test và hash Argon2id thật.

Xem trước merge dạng văn bản app.ts (không merge Git) xác định hai vùng khác biệt ở import và mount router BQL. Giữ phiên bản createManagementRouter(options.pool) như source đã kiểm tại .qa/combined/backend/src/app.ts. Đây là hướng dẫn cho chủ dự án giải quyết conflict, không tự hợp nhất nhánh.
