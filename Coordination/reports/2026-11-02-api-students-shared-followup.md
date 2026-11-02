# Hoàn thiện helper đọc và timestamp — api-students

Ngày 02/11/2026, Asia/Ho_Chi_Minh. Owner/reviewer: Bùi Thế Anh; thực hiện: Codex theo yêu cầu hoàn thiện hai đề xuất còn lại, commit ký và push riêng nhánh api-students. Source trước thay đổi: f4b6e2a3c68a72d2e94c0a8750188a1776f6327a. Không merge/approve PR hoặc sửa nhánh ADMIN/BQL.

## Thay đổi

1. Chuyển `withReadSnapshot` từ `student/service.ts` sang `backend/src/shared/db/read-snapshot.ts`; service SV import helper chung. Giữ cùng chữ ký, một PoolClient, READ ONLY REPEATABLE READ, commit/rollback/release và bảo toàn lỗi gốc. Không thêm advisory write lock cho GET. Lỗi BEGIN hoặc rollback làm client bị loại khỏi pool.
2. Thêm `backend/src/shared/http/datetime.ts` và cho mapper SV dùng `toUtcTimestamp`. API SV giữ ba chữ số mili giây, ví dụ `2026-11-02T10:20:30.123Z`, cùng cách `toISOString()` hiện có của ADMIN/BQL. Không cắt độ chính xác chỉ để khớp ví dụ cũ không có phần lẻ giây. Quyết định kỹ thuật DEC-029 ghi tại [baseline](../../Planning/13-SPECIFICATION-BASELINE.md) và [Shared conventions](<../../API Endpoint/Shared/00-conventions.md>).

Kiểu field vẫn là string/date-time, UTC; không đổi field/status/endpoint/quyền/schema DB. `dateOfBirth`, `checkInDate`, `checkOutDate`, `paymentDate` vẫn YYYY-MM-DD. Timestamp dùng để sort vẫn do PostgreSQL sắp xếp, không so chuỗi đã format trong code.

Ví dụ JSON cũ là ví dụ ISO8601 hợp lệ, không buộc API cắt phần mili giây. Đề xuất cũ ở bàn giao P1 được thay bằng chuẩn biểu diễn có mili giây để đồng nhất và giữ độ chính xác; frontend phải parse date-time, không giả định chuỗi dài đúng 20 ký tự. Không đổi Shared schemas/OpenAPI vì kiểu date-time và các ví dụ cũ vẫn hợp lệ.

## Kiểm chứng đã chạy

| Kiểm tra | Kết quả |
|---|---|
| api-students: npm run check | Build PASS; 62/62 unit PASS |
| api-students: npm run test:integration | 11/11 PASS trên PostgreSQL 18.6, không skip |
| Bản ghép tạm: npm run check | Build PASS; 100/100 unit PASS |
| Bản ghép tạm: npm run test:integration | 27/27 PASS |
| Bản ghép tạm: npm run test:system | 2/2 PASS |
| Tổng bộ kiểm tra bản ghép | 129/129 PASS, không fail/skip/todo |

Test mới kiểm: cùng client/snapshot không khóa ghi; lỗi acquire/BEGIN/query/COMMIT và lỗi rollback không che lỗi gốc. PostgreSQL thật xác nhận transaction READ ONLY/REPEATABLE READ, không giữ advisory write lock, vẫn thấy 1 phòng khi writer khác đã commit phòng thứ 2; sau snapshot mới thấy 2 phòng.

Test HTTP SV so createdAt/updatedAt với giá trị DB chuyển sang ISO, giữ đúng mili giây. Ca đơn vị có `.123Z` và `.456+07:00` xác nhận không mất phần lẻ giây, chuẩn hóa UTC và không đổi ngày sinh. Harness tích hợp kiểm mọi field date-time của DTO theo mẫu UTC có ba chữ số mili giây, nên bản ghép đã kiểm cùng định dạng cho cả ba role mà không sửa test/implementation riêng của ADMIN/BQL.

Benchmark hồi quy trong bộ system tạo fixture 100 SV/100 phòng và 20 tài khoản đăng nhập, tổng 100 request: 100/100 dưới 2 giây, p95 38 ms, tối đa 39 ms trên máy local. Đây là kết quả local trong namespace test, không suy rộng sang hosting khác hoặc nghiệm thu Docker/frontend.

## Phạm vi bàn giao và tích hợp

Chỉ commit helper Shared, consumer/test SV, kiểm thử Shared và tài liệu liên quan trên api-students. Không đưa code hoặc test riêng của ADMIN/BQL, không commit .env/.env.test, thư mục bản ghép, log hoặc dữ liệu fixture. Bản ghép tạm dùng source SV/Shared mới cùng các module đã commit của ADMIN/BQL để kiểm; không phải merge Git, các worktree còn lại giữ nguyên.

Sau khi tích hợp nhánh SV, ADMIN/BQL đã có cùng định dạng timestamp vì mapper hiện tại dùng `toISOString()`. Các bản private helper đọc của hai role đó có thể chuyển sang helper Shared trong task refactor riêng; đó không phải điều kiện để helper SV đã được tách hoạt động. Không thay wrapper map lỗi riêng của BQL trong task này.

Chủ dự án đã cho phép tạo commit ký/push cho task. Commit thực tế được tra trong lịch sử nhánh; giữ nguyên thiết lập khóa ký và không merge/approve PR.
