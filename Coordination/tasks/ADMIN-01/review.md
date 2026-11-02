# Review ADMIN-01 / PR #1

Ngày review: 01/11/2026 (Asia/Ho_Chi_Minh).

**Kết luận: REQUEST_CHANGES — chưa nên merge phiên bản hiện tại vào main.**

## Phạm vi và phiên bản được kiểm tra

- PR: https://github.com/XunNam/CDTN2-Team01-DormitoryMGMTApp/pull/1
- Head được xác nhận bằng `git ls-remote`: `e9d557d14c579a9c57d4bde4bc83bd48f14da0fd`.
- `HEAD` local và `origin/api-admins` cùng head trên; remote main: `8d8ae47aa9fa3db92e52b21d9bf1eedb191ddfda`.
- Review diff `origin/main...HEAD`: 21 file, 1.584 dòng thêm, 15 dòng xóa.
- Nguồn đối chiếu: contract ADMIN revision 1.0.0, Shared conventions/DTO/auth/authorization/transaction, SQL/schema.sql, manifest, Planning baseline/decision log, FR-01 và QT-01/QT-02 trong SRS, quy định bàn giao và kiểm thử của Coordination.
- Review gồm code runtime tại `backend/src/roles/admin/`, không chỉ các thư mục test/handoff.
- Không sửa source, test hoặc cấu hình; không commit/push/merge. File báo cáo này là đầu ra review duy nhất.

## Các phát hiện cần sửa

### R1 / P1 — Cả 5 operation chưa nhận được Pool khi chạy qua app hiện tại

Vị trí: `backend/src/roles/admin/controller.ts:13-16`; điểm tích hợp liên quan: `backend/src/app.ts:24-25`.

`poolOf(req)` bắt buộc lấy `req.app.locals.pool`, nhưng `createApp(options)` chưa gán giá trị đó. Pool có trong `options.pool` và được dùng cho session/guard, nhưng chưa được truyền cho controller. Vì vậy, với phiên ADMIN hợp lệ và input hợp lệ, cả 5 operation đều dừng ở 503 SERVICE_UNAVAILABLE trước khi thực hiện nghiệp vụ. Đây là phụ thuộc Shared đã được tác giả ghi công khai trong handoff, nhưng PR hiện tại vẫn chưa giải quyết nó.

Đã tái hiện bằng `createApp` thật, session MemoryStore được seed và fake Pool như nhóm unit, không thêm dòng wiring của harness:

| Request | Kết quả |
|---|---|
| GET /api/v1/admin/accounts | 503 SERVICE_UNAVAILABLE |
| GET /api/v1/admin/accounts/STAFF/{accountId} | 503 SERVICE_UNAVAILABLE |
| GET /api/v1/admin/student-profiles/candidates | 503 SERVICE_UNAVAILABLE |
| POST /api/v1/admin/accounts | 503 SERVICE_UNAVAILABLE |
| PATCH /api/v1/admin/accounts/STAFF/{accountId}/lock | 503 SERVICE_UNAVAILABLE |

Đối chứng: chỉ gán Pool vào `app.locals` trong bộ nhớ của lần chạy tạm thì GET accounts trả 200. Kiểm tra này xác nhận lỗi wiring; không thay kiểm chứng SQL trên PostgreSQL thật.

Hướng sửa: điều phối viên tích hợp Pool của app vào controller. Một cách nhỏ phù hợp thiết kế hiện tại là `app.locals.pool = options.pool` ngay sau `const app = express()` trong `createApp`. Có thể chọn cách truyền dependency tương đương, nhưng không tạo Pool hoặc app riêng cho ADMIN. Thay đổi app.ts thuộc Shared và cần được phối hợp đúng phạm vi.

### R2 / P2 — Fixture sửa app sau khi khởi tạo, che mất lỗi tích hợp

Vị trí: `backend/tests/admin/helpers.ts:59-60` và `backend/tests/integration/admin/fixtures.ts:50-52`.

Cả unit harness lẫn integration fixture tự gán `app.locals.pool` sau `createApp`. Do đó test chạy một app đã được fixture sửa khác với đường khởi động thực tế. Kết quả 37/37 đạt vẫn xảy ra khi R1 chưa được sửa; integration cũng không thể phát hiện thiếu wiring này khi giữ fallback hiện tại.

Hướng sửa: sau khi tích hợp Pool trong app factory, bỏ hai dòng gán dự phòng trong fixture và thêm kiểm thử hồi quy cho đường `createApp` không bị sửa sau khởi tạo. Fixture vẫn có thể seed session khi AUTH-01 chưa có, nhưng phải ghi đúng giới hạn đó. Ca hồi quy cần thất bại khi app không truyền Pool cho role và thành công khi wiring đúng.

## Đối chiếu phần đã làm với contract

| Nhóm yêu cầu | Nhận xét từ code và unit test |
|---|---|
| Đủ operation | Có đủ adminListAccounts, adminGetAccount, adminCreateAccount, adminSetAccountLock, adminListProfileCandidates; đúng method/path và tầng router/controller/service/repository/validation. |
| Phân quyền ADMIN | Dùng middleware Shared; SV/BQL không kế thừa quyền admin; mutation đọc lại actor sau advisory lock. Unit test có ma trận sai quyền/khóa/CSRF. |
| Cấp tài khoản SV | Kiểm tra hồ sơ có trước, chưa có account; role SV; lỗi thiếu/trùng đúng 404/409; username STAFF thuộc namespace riêng. |
| Cấp tài khoản nhân sự | Chỉ BQL/ADMIN; chuẩn hóa username; kiểm tra trùng và map unique violation theo constraint. |
| Mật khẩu và DTO | Argon2id đúng tham số contract, không trim password; response được map theo DTO, không trả hash/session version. |
| Khóa/mở | Chỉ cập nhật is_locked; lặp giá trị trả 409; cho self-lock; request sau kiểm tra trạng thái khóa qua guard. |
| Tra cứu | Filter allowlist, phân trang, escape LIKE, sort có tie-break; list/count dùng cùng snapshot REPEATABLE READ READ ONLY. |
| Phạm vi file | Không thay Shared/auth/schema/module role khác/dependency trong commit được review; phụ thuộc được ghi trong handoff. |

Các nhận xét trên không phải chứng nhận toàn bộ API/FR-01 đã chạy với PostgreSQL hoặc luồng đăng nhập thật.

## Kiểm chứng thực tế trên máy review

Môi trường: Node.js 24.18.0, npm 12.1.0. Manifest yêu cầu npm 11; không thay toolchain hay cài lại dependency trong lượt review.

| Kiểm tra | Kết quả |
|---|---|
| git diff --check origin/main...HEAD | Đạt |
| npm run check | Build đạt; 37/37 unit test đạt, 0 fail/skip |
| Tái hiện đường app không có fixture bổ sung Pool | Cả 5 API trả 503; GET đối chứng khi cấp Pool trong bộ nhớ trả 200 |
| npm run test:integration | NOT_RUN_PENDING_OWNER: runner dừng vì thiếu TEST_DATABASE_URL; không có .env.test |
| PostgreSQL/session-store/SQL/concurrency thật | Chưa kiểm chứng trên máy review |
| Đăng nhập thực tế rồi gọi ADMIN | Chưa kiểm chứng: Shared auth/router.ts vẫn là slot trống; fixture hiện ghi session trực tiếp |

Lượt unit đầu bị môi trường hạn chế kết nối loopback (EACCES). Sau khi chạy với quyền cho phép kết nối nội bộ, cùng bộ test đạt đủ 37/37; không tính lỗi môi trường đó là lỗi của PR.

Handoff báo 15 integration test đạt trên môi trường tác giả dùng PostgreSQL 16/Node 22. Đây là bằng chứng do tác giả bàn giao, không thay kết quả kiểm chứng lại trên máy Anh hoặc phiên bản baseline của nhóm.

## Các bước trước khi xem xét merge lại

1. Tích hợp dependency Pool dùng chung để giải quyết R1.
2. Sửa fixture và bổ sung hồi quy theo R2; chạy lại build/unit trên toolchain thống nhất.
3. Chuẩn bị database test riêng theo SQL README; chạy schema/assertions theo quy trình trước khi chạy test. Không dùng DB thật hoặc tự reset DB hiện có.
4. Chạy lại 15 integration test với PostgreSQL, kiểm tra dữ liệu fixture được dọn; bổ sung/kiểm chứng ca actor bị khóa trong lúc đợi advisory lock trên DB thật nếu muốn xác nhận kịch bản cạnh tranh đó (hiện chỉ có unit mô phỏng).
5. Giữ AUTH-01 là phụ thuộc riêng. Khi có auth, kiểm tra luồng đăng nhập → cấp tài khoản → đăng nhập đúng role, khóa/chặn đăng nhập, mở khóa/đăng nhập lại; không gọi session seed là kiểm chứng đăng nhập.
6. Cập nhật handoff/checkpoint với commit và kết quả thực tế, rồi review lại diff mới. READY_FOR_OWNER là trạng thái bàn giao để kiểm tra, chưa phải DONE hoặc chấp thuận merge.

Không coi việc tác giả chưa sửa Shared/auth ngoài quyền được giao là sai phạm phạm vi. Những điểm này là điều kiện tích hợp còn thiếu; quyết định merge cần dựa trên phiên bản đã sửa và bằng chứng kiểm thử tương ứng.
