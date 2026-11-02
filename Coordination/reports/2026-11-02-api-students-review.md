> Báo cáo này ghi nhận kết quả review trước commit. Sau đó chủ dự án đã cho phép tạo commit ký riêng cho từng nhánh và push lên origin; yêu cầu không merge hoặc approve PR vẫn giữ nguyên. Phiên bản đã lưu được xác định trong lịch sử Git của nhánh.

# Review PostgreSQL — SV / api-students

Ngày: 02/11/2026, Asia/Ho_Chi_Minh. Người giao/reviewer cuối: Bùi Thế Anh; thực hiện rà soát và sửa: Codex theo yêu cầu kiểm tra toàn bộ 3 role.

**READY_FOR_OWNER_REVIEW / READY_FOR_FRONTEND_INTEGRATION sau tích hợp bản sửa.** Kết quả áp dụng source local chưa commit; PR gốc chưa tự thay đổi. Không có thao tác commit/push/merge/tag.

## Phiên bản và nguồn

- [PR #3](https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/3); head nguồn `4356ab05cc5541ae72c579ff5ca856f510468aae`. Local HEAD, origin/api-students, head PR đã khớp qua git ls-remote. Main nguồn 8d8ae47aa9fa3db92e52b21d9bf1eedb191ddfda.
- Contract revision 1.0.0: 13 operation SV, Shared 5 operation; Planning/13, API Endpoint/Shared, contract role, SQL/schema.sql, SRS và Business Rules. Không đổi method/path/DTO/enum/quyền hoặc schema nghiệp vụ.
- Phạm vi sửa được chủ dự án giao gồm role, Shared/app/config, test và báo cáo để có thể kiểm dữ liệu thật. Giữ giới hạn Git trong AGENTS.

## Phát hiện và sửa

- Nguồn chỉ hoàn thành P1 (6 operation), phù hợp phạm vi P1 ghi trong handoff. Yêu cầu kiểm tra toàn backend lần này đã giao phần bổ sung P2/P3: 7 operation đăng ký/lưu trú/phiếu thu.
- Thiếu app.locals.pool khiến đường HTTP thật không lấy được DB; fixture từng tự gán Pool. Đã sửa app factory và bỏ cách chữa app trong fixture.
- Sáu file integration là bản sao unit mock và import ./helpers.js không tồn tại; db-helpers cũng trỏ sai src, khiến build lỗi. Đã giữ nguyên unit P1, thay integration bằng login/HTTP/SQL thật, đưa vào tests/integration/student và bỏ helper cũ không còn dùng.
- Hoàn thiện studentCreateApplication/ListApplications/GetApplication/ListResidences/GetResidence/ListReceipts/GetReceipt, nối router/controller/validation/service/repository đúng contract.

## Kiểm chứng trọng tâm

Một đơn PENDING/một residence mở; thứ tự kỳ → đơn → lưu trú → phòng/giới tính/chỗ; gửi đơn không giữ chỗ; hai gửi cùng SV một 201/một 409. List/count cùng snapshot, filter allowlist page/pageSize/status, mọi detail và receipt JOIN có ownership; dữ liệu người khác trả 404. Lịch sử ENDED/CANCELLED và phiếu UNPAID/PAID vẫn xem được; BIGINT snapshot giữ chuỗi. Không thêm API SV hủy đơn hoặc tự xác nhận tiền.

## Kết quả đã chạy

| Kiểm tra | Kết quả |
|---|---|
| npm run check | TypeScript build PASS; 55/55 unit PASS |
| npm run test:integration | 10/10 PASS trên PostgreSQL 18.6, gồm Shared auth |
| Bản ghép cả ba role | 93 unit + 26 integration + 2 system = 121/121 PASS; không fail/skip/todo |
| db:check trên dormitory-db/public bằng codex | PASS, 10 bảng + view + singleton |
| db:verify | SQL invariants PASS; public khớp snapshot columns/constraints/indexes/triggers/functions/view |
| Probe public sau cấp quyền | SQL invariants ROLLBACK và PostgreSQL session HTTP PASS; 0 thay đổi nghiệp vụ bền vững/0 session thử còn lại |
| NFR-02 đo riêng | Đúng 100 SV/100 phòng, 20 account đăng nhập, 100/100 request dưới 2s, p95/max 44ms |

Test từng nhánh gồm Shared, không cộng ba nhánh thành số kiểm tra duy nhất. Bằng chứng tổng thể và giới hạn NFR xem [đánh giá sẵn sàng](2026-11-02-backend-readiness.md).

## File bàn giao

- backend/src/roles/student/: module role (ADMIN giữ implementation nghiệp vụ hiện có; BQL/SV được sửa theo nội dung trên).
- backend/src/shared/auth/, shared/db/pool.ts, shared/http/errors.ts, app.ts, server.ts: auth/store/wiring/kết nối dùng chung, đồng bộ cùng nội dung ở ba nhánh.
- backend/tests/student/, tests/integration/, tests/shared/, tests/system/: kiểm tra độc lập, DB và xuyên role; system chỉ chạy sau khi có đủ module.
- backend/tools/: db:check, db:verify, db:prepare-test, db:bootstrap-admin và runner tách unit/integration/system. package.json chỉ thêm script, không đổi dependency/lockfile.
- SQL/grant-local-app-access.sql: quyền runtime local đã được chủ dự án cho phép và đã áp dụng; không thay schema/owner.
- backend/.env và .env.test: đã cấu hình local, bị Git bỏ qua; không commit hoặc sao chép bí mật vào báo cáo.

## Trước commit/merge

Review diff của đúng worktree api-students; xem các sửa Shared, quyền, sức chứa, residence và tiền theo AGENTS trước tích hợp thủ công. Giữ createManagementRouter(options.pool) của BQL khi ghép app.ts. Các file Shared/test hệ thống giống nhau ở ba nhánh, chỉ cần một bản sau merge. Chạy lại check/integration/system trên source main đã tích hợp vì bài test .qa/combined chưa phải merge Git.

NFR-03/Compose/frontend chưa nghiệm thu; npm máy hiện tại 12.1.0 khác npm 11 chuẩn nhóm. Chưa tự phục hồi CODEOWNERS đã bị cả ba PR gốc xóa; chủ dự án cần kiểm lại ý định. Các điểm này được ghi để review đúng phạm vi, không gọi bản local là sẵn sàng production.

Sau merge, khởi tạo Admin đầu tiên bằng công cụ local nếu DB vẫn chưa có account, rồi nối frontend theo luồng CSRF/cookie trong [backend README](../../backend/README.md).
