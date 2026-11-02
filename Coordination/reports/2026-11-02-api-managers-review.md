> Báo cáo này ghi nhận kết quả review trước commit. Sau đó chủ dự án đã cho phép tạo commit ký riêng cho từng nhánh và push lên origin; yêu cầu không merge hoặc approve PR vẫn giữ nguyên. Phiên bản đã lưu được xác định trong lịch sử Git của nhánh.

# Review PostgreSQL — BQL / api-managers

Ngày: 02/11/2026, Asia/Ho_Chi_Minh. Người giao/reviewer cuối: Bùi Thế Anh; thực hiện rà soát và sửa: Codex theo yêu cầu kiểm tra toàn bộ 3 role.

**READY_FOR_OWNER_REVIEW / READY_FOR_FRONTEND_INTEGRATION sau tích hợp bản sửa.** Kết quả áp dụng source local chưa commit; PR gốc chưa tự thay đổi. Không có thao tác commit/push/merge/tag.

## Phiên bản và nguồn

- [PR #2](https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/2); head nguồn `f0f6f68b9d97eb563c215bd7005e92480cace0b5`. Local HEAD, origin/api-managers, head PR đã khớp qua git ls-remote. Main nguồn 8d8ae47aa9fa3db92e52b21d9bf1eedb191ddfda.
- Contract revision 1.0.0: 28 operation BQL, Shared 5 operation; Planning/13, API Endpoint/Shared, contract role, SQL/schema.sql, SRS và Business Rules. Không đổi method/path/DTO/enum/quyền hoặc schema nghiệp vụ.
- Phạm vi sửa được chủ dự án giao gồm role, Shared/app/config, test và báo cáo để có thể kiểm dữ liệu thật. Giữ giới hạn Git trong AGENTS.

## Phát hiện và sửa

- Đã có đủ 28 operation, nhưng kiểm trạng thái, sức chứa, giới tính, residence mở và phiếu trùng nằm trong repository. Đã chuyển sang service, giữ transaction/actor recheck; repository chỉ còn SQL tham số hóa và mapping.
- Offset phân trang dùng phép nhân Number có thể mất chính xác ở page lớn. Đã đổi sang chuỗi BigInt.
- Validation ngày cho lọt năm 0000 mà PostgreSQL không hỗ trợ. Đã chặn trước DB; giữ lịch thật/không tương lai/checkout không trước checkin.
- Bổ sung tên export validation theo 28 operationId để khớp manifest; các parser nhỏ vẫn dùng cho test.
- Integration fixture gửi mã lowercase thẳng vào service dù chuẩn hóa thuộc validation HTTP. Đã dùng input đã chuẩn hóa cho ca duplicate; không sửa contract để hợp thức hóa fixture.
- AUTH-01 chưa có ở nguồn cũ. Đã thêm Shared, kiểm đăng nhập thật và toàn luồng BQL trong bản ghép.

## Kiểm chứng trọng tâm

Service integration đi qua đủ 28 operation. System test thêm HTTP đủ nhóm profile/building/room/period/application/residence/receipt/statistics; duyệt/xếp nguyên tử, xét sau đóng kỳ, chỗ cuối, giữ giá snapshot, phí 0, giữ nợ sau trả/hủy, thu sau checkout, không vượt sức chứa và không thao tác hai lần. Repo không tự tạo Pool/server/auth hay đổi schema nghiệp vụ.

## Kết quả đã chạy

| Kiểm tra | Kết quả |
|---|---|
| npm run check | TypeScript build PASS; 33/33 unit PASS |
| npm run test:integration | 4/4 PASS trên PostgreSQL 18.6, gồm Shared auth |
| Bản ghép cả ba role | 93 unit + 26 integration + 2 system = 121/121 PASS; không fail/skip/todo |
| db:check trên dormitory-db/public bằng codex | PASS, 10 bảng + view + singleton |
| db:verify | SQL invariants PASS; public khớp snapshot columns/constraints/indexes/triggers/functions/view |
| Probe public sau cấp quyền | SQL invariants ROLLBACK và PostgreSQL session HTTP PASS; 0 thay đổi nghiệp vụ bền vững/0 session thử còn lại |
| NFR-02 đo riêng | Đúng 100 SV/100 phòng, 20 account đăng nhập, 100/100 request dưới 2s, p95/max 44ms |

Test từng nhánh gồm Shared, không cộng ba nhánh thành số kiểm tra duy nhất. Bằng chứng tổng thể và giới hạn NFR xem [đánh giá sẵn sàng](2026-11-02-backend-readiness.md).

## File bàn giao

- backend/src/roles/management/: module role (ADMIN giữ implementation nghiệp vụ hiện có; BQL/SV được sửa theo nội dung trên).
- backend/src/shared/auth/, shared/db/pool.ts, shared/http/errors.ts, app.ts, server.ts: auth/store/wiring/kết nối dùng chung, đồng bộ cùng nội dung ở ba nhánh.
- backend/tests/management/, tests/integration/, tests/shared/, tests/system/: kiểm tra độc lập, DB và xuyên role; system chỉ chạy sau khi có đủ module.
- backend/tools/: db:check, db:verify, db:prepare-test, db:bootstrap-admin và runner tách unit/integration/system. package.json chỉ thêm script, không đổi dependency/lockfile.
- SQL/grant-local-app-access.sql: quyền runtime local đã được chủ dự án cho phép và đã áp dụng; không thay schema/owner.
- backend/.env và .env.test: đã cấu hình local, bị Git bỏ qua; không commit hoặc sao chép bí mật vào báo cáo.

## Trước commit/merge

Review diff của đúng worktree api-managers; xem các sửa Shared, quyền, sức chứa, residence và tiền theo AGENTS trước tích hợp thủ công. Giữ createManagementRouter(options.pool) của BQL khi ghép app.ts. Các file Shared/test hệ thống giống nhau ở ba nhánh, chỉ cần một bản sau merge. Chạy lại check/integration/system trên source main đã tích hợp vì bài test .qa/combined chưa phải merge Git.

NFR-03/Compose/frontend chưa nghiệm thu; npm máy hiện tại 12.1.0 khác npm 11 chuẩn nhóm. Chưa tự phục hồi CODEOWNERS đã bị cả ba PR gốc xóa; chủ dự án cần kiểm lại ý định. Các điểm này được ghi để review đúng phạm vi, không gọi bản local là sẵn sàng production.

Sau merge, khởi tạo Admin đầu tiên bằng công cụ local nếu DB vẫn chưa có account, rồi nối frontend theo luồng CSRF/cookie trong [backend README](../../backend/README.md).
