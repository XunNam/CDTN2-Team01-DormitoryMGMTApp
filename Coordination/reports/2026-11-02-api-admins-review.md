> Báo cáo này ghi nhận kết quả review trước commit. Sau đó chủ dự án đã cho phép tạo commit ký riêng cho từng nhánh và push lên origin; yêu cầu không merge hoặc approve PR vẫn giữ nguyên. Phiên bản đã lưu được xác định trong lịch sử Git của nhánh.

# Review PostgreSQL — ADMIN / api-admins

Ngày: 02/11/2026, Asia/Ho_Chi_Minh. Người giao/reviewer cuối: Bùi Thế Anh; thực hiện rà soát và sửa: Codex theo yêu cầu kiểm tra toàn bộ 3 role.

**READY_FOR_OWNER_REVIEW / READY_FOR_FRONTEND_INTEGRATION sau tích hợp bản sửa.** Kết quả áp dụng source local chưa commit; PR gốc chưa tự thay đổi. Không có thao tác commit/push/merge/tag.

## Phiên bản và nguồn

- [PR #1](https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/1); head nguồn `c5f78a0665ce34aed544efba64e54798bacfbff9`. Local HEAD, origin/api-admins, head PR đã khớp qua git ls-remote. Main nguồn 8d8ae47aa9fa3db92e52b21d9bf1eedb191ddfda.
- Contract revision 1.0.0: 5 operation ADMIN, Shared 5 operation; Planning/13, API Endpoint/Shared, contract role, SQL/schema.sql, SRS và Business Rules. Không đổi method/path/DTO/enum/quyền hoặc schema nghiệp vụ.
- Phạm vi sửa được chủ dự án giao gồm role, Shared/app/config, test và báo cáo để có thể kiểm dữ liệu thật. Giữ giới hạn Git trong AGENTS.

## Phát hiện và sửa

- R1/P1: controller lấy app.locals.pool nhưng createApp chưa gán, mọi API hợp lệ có thể trả 503. Đã gán đúng Pool ở app factory.
- R2/P2: fixture tự gán Pool nên che R1. Đã thay bằng assertion kiểm app factory, không sửa app trong test.
- Shared auth trống khiến không có login thật. Đã hoàn thiện Shared theo yêu cầu liên phần lần này; kiểm bằng PostgreSQL store và HTTP thật.
- Test khóa BQL giả định endpoint BQL trả 404 khi router trống. Đã chuyển kiểm request kế tiếp sang auth/me để test đúng cả nhánh độc lập và bản ghép.

## Phạm vi giữ đúng

Đủ adminListAccounts, adminGetAccount, adminCreateAccount, adminSetAccountLock, adminListProfileCandidates. Giữ tách STUDENT/STAFF, profile trước account, Argon2id, role bất biến, metadata tối thiểu, self-lock, fresh guard và transaction chung. Không mở quyền BQL cho ADMIN, không thêm reset-password hoặc quyền quản trị kế thừa.

Các test ADMIN chuyên biệt vẫn seed session PostgreSQL để cô lập nghiệp vụ account; bằng chứng login thật đến từ integration/shared và system, không đánh đồng hai loại test.

## Kết quả đã chạy

| Kiểm tra | Kết quả |
|---|---|
| npm run check | TypeScript build PASS; 39/39 unit PASS |
| npm run test:integration | 18/18 PASS trên PostgreSQL 18.6, gồm Shared auth |
| Bản ghép cả ba role | 93 unit + 26 integration + 2 system = 121/121 PASS; không fail/skip/todo |
| db:check trên dormitory-db/public bằng codex | PASS, 10 bảng + view + singleton |
| db:verify | SQL invariants PASS; public khớp snapshot columns/constraints/indexes/triggers/functions/view |
| Probe public sau cấp quyền | SQL invariants ROLLBACK và PostgreSQL session HTTP PASS; 0 thay đổi nghiệp vụ bền vững/0 session thử còn lại |
| NFR-02 đo riêng | Đúng 100 SV/100 phòng, 20 account đăng nhập, 100/100 request dưới 2s, p95/max 44ms |

Test từng nhánh gồm Shared, không cộng ba nhánh thành số kiểm tra duy nhất. Bằng chứng tổng thể và giới hạn NFR xem [đánh giá sẵn sàng](2026-11-02-backend-readiness.md).

## File bàn giao

- backend/src/roles/admin/: module role (ADMIN giữ implementation nghiệp vụ hiện có; BQL/SV được sửa theo nội dung trên).
- backend/src/shared/auth/, shared/db/pool.ts, shared/http/errors.ts, app.ts, server.ts: auth/store/wiring/kết nối dùng chung, đồng bộ cùng nội dung ở ba nhánh.
- backend/tests/admin/, tests/integration/, tests/shared/, tests/system/: kiểm tra độc lập, DB và xuyên role; system chỉ chạy sau khi có đủ module.
- backend/tools/: db:check, db:verify, db:prepare-test, db:bootstrap-admin và runner tách unit/integration/system. package.json chỉ thêm script, không đổi dependency/lockfile.
- SQL/grant-local-app-access.sql: quyền runtime local đã được chủ dự án cho phép và đã áp dụng; không thay schema/owner.
- backend/.env và .env.test: đã cấu hình local, bị Git bỏ qua; không commit hoặc sao chép bí mật vào báo cáo.

## Trước commit/merge

Review diff của đúng worktree api-admins; xem các sửa Shared, quyền, sức chứa, residence và tiền theo AGENTS trước tích hợp thủ công. Giữ createManagementRouter(options.pool) của BQL khi ghép app.ts. Các file Shared/test hệ thống giống nhau ở ba nhánh, chỉ cần một bản sau merge. Chạy lại check/integration/system trên source main đã tích hợp vì bài test .qa/combined chưa phải merge Git.

NFR-03/Compose/frontend chưa nghiệm thu; npm máy hiện tại 12.1.0 khác npm 11 chuẩn nhóm. Chưa tự phục hồi CODEOWNERS đã bị cả ba PR gốc xóa; chủ dự án cần kiểm lại ý định. Các điểm này được ghi để review đúng phạm vi, không gọi bản local là sẵn sàng production.

Sau merge, khởi tạo Admin đầu tiên bằng công cụ local nếu DB vẫn chưa có account, rồi nối frontend theo luồng CSRF/cookie trong [backend README](../../backend/README.md).
