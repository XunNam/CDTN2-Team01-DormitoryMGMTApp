> Lịch sử bàn giao P1; phần bổ sung/kiểm thử sau đó xem [review 02/11/2026](reports/2026-11-02-api-students-review.md).

> Helper đọc đã được tách Shared; timestamp được chốt giữ mili giây theo DEC-029, thay đề xuất cắt phần lẻ giây trong bản cũ. Xem [báo cáo hoàn thiện Shared](reports/2026-11-02-api-students-shared-followup.md).

# Bàn giao SV-01 / P1 cho Bùi Thế Anh

Task / role / người thực hiện / revision: SV-01 / SV / (người được giao role SV) + AI / contract 1.0.0
Trạng thái đề nghị: READY_FOR_OWNER (chưa DONE; test DB/tích hợp NOT_RUN_PENDING_OWNER)
Giai đoạn hiện tại / phạm vi phiên: P1 — 6 operation. Còn lại: P2 (5 op), P3 (2 op) — chưa làm.
File kế hoạch / checkpoint: Coordination/tasks/SV-01/plan.md, progress.md

## Operation đã triển khai (method/path/operationId)
| operationId | Route (sau /api/v1/student) |
|---|---|
| studentGetProfile | GET /profile |
| studentUpdateContact | PATCH /profile |
| studentListBuildings | GET /buildings |
| studentListRooms | GET /rooms |
| studentGetRoom | GET /rooms/{roomId} |
| studentGetPeriod | GET /registration-period |

## Hành vi thực tế
- `studentId` luôn lấy từ actor đã fresh-check; không có đường nào để client chọn chủ thể. Mọi query key thừa (kể cả `page`, `studentId`) → 422.
- GET: một snapshot `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY` cho cả data và count; **không** lấy advisory lock.
- PATCH profile: `withBusinessTransaction`; recheck role + owner sau khóa; chỉ ghi cột `phone`/`email`; **nếu giá trị không đổi thì trả 200 và không UPDATE** (trigger `preserve_entity_identity` sẽ đổi `updated_at` với mọi UPDATE nên tránh ghi thừa để "không phát sinh tác dụng phụ" đúng contract).
- Rooms: luôn `status='ACTIVE'` ở SQL; đếm chỗ từ view `room_availability` (cùng nguồn với BQL theo code-ownership.md). `studentListBuildings`: tòa có ≥1 phòng ACTIVE, kể cả hết chỗ.
- q: trim, ≤100 ký tự, escape `% _ \` (ESCAPE '\'), tìm trong mã phòng / mã tòa / tên tòa, không phân biệt hoa thường.
- Lỗi CHECK của DB cho phone/email (`student_profiles_phone_check`, `student_profiles_email_check`) được map 422 thay vì 500.

## File tạo/sửa
- Sửa (điền slot): backend/src/roles/student/{validation,repository,service,controller,router}.ts
- Mới (test độc lập): backend/tests/student/{helpers.ts, studentGetProfile, studentUpdateContact, studentListBuildings, studentListRooms, studentGetRoom, studentGetPeriod}.test.ts
- Mới (test DB): backend/tests/integration/student/{db-helpers.ts, <6 operationId>.test.ts}
- Mới (hồ sơ): Coordination/tasks/SV-01/{plan,progress,handoff-P1}.md
- KHÔNG sửa: app.ts, server.ts, shared/**, SQL/**, package*.json, contract.

## PHỤ THUỘC / ĐỀ XUẤT CẦN ANH QUYẾT ĐỊNH (quan trọng)
1. **Router của role không truy cập được Pool.** `createApp` nhận `pool` nhưng không truyền xuống `studentRouter`. Controller hiện đọc `req.app.locals.pool`. Cần thêm **1 dòng** trong `createApp` (app.ts, thuộc Shared): `app.locals.pool = options.pool;`. Trước khi có dòng này, 6 route trả 500 INTERNAL_ERROR (không lộ chi tiết). Role BQL/ADMIN sẽ gặp đúng vấn đề này; nên chốt một cách duy nhất cho cả ba role. Tôi không tự tạo Pool thứ hai.
2. **Helper snapshot đọc.** `withReadSnapshot` đang là hàm private trong student/service.ts (cùng kỷ luật BEGIN/ROLLBACK/release với `withBusinessTransaction`). Nên chuyển lên `shared/db/` để BQL/ADMIN dùng chung; tôi đã gắn TODO.
3. **Định dạng timestamp**: mapper trả `YYYY-MM-DDTHH:MM:SSZ` (bỏ phần giây lẻ) cho khớp ví dụ trong contract. Nếu Anh muốn có mili-giây, sửa hàm `iso()` trong repository.ts.
4. **Thứ tự sắp xếp** dùng `ORDER BY ... ASC` thuần theo collation của DB (không `COLLATE "C"`) để BQL/SV nhất quán nếu BQL cũng dùng mặc định. Cần chốt chung.
5. AUTH-01 chưa có: test tích hợp dùng phiên tạo thẳng trong store — **không phải bằng chứng login**.

## Lệnh đã chạy và kết quả thực tế
- `npm run check` (sandbox AI, **Node 22.22.2/npm 10.9.7**, không phải Node 24/npm 11): build PASS, 52/52 PASS (15 cũ + 37 mới). **Anh/bạn cần chạy lại trên Node 24/npm 11 của dự án.**
- Tham khảo (không thay nghiệm thu): PostgreSQL 16 tạm trong sandbox AI, nạp schema.sql + invariants.sql PASS, 22/22 test tích hợp student PASS. DB đó đã bỏ.

## Ca đã kiểm (độc lập, qua createApp thật + Pool giả)
Đúng dữ liệu; thiếu/thừa/null/rỗng; sai kiểu; enum/UUID sai; query lặp; biên 1/100 pageSize, 7/20 chữ số, email 254; chưa login; khóa tài khoản (kể cả bị khóa sau khi chờ lock); BQL/ADMIN → 403 và không chạm DB; hai SV; PATCH có gender/role/studentId → 422 không ghi; rollback khi lỗi DB; lỗi DB lạ → 500 không lộ; deadlock → 503 không tự replay.

## Test DB/tích hợp giao Anh — NOT_RUN_PENDING_OWNER
- File: backend/tests/integration/student/*.test.ts
- Setup: DB test **trống, riêng**; `psql "$URL" -v ON_ERROR_STOP=1 -f SQL/schema.sql`; trong backend/ tạo `.env.test` từ `.env.test.example` (TEST_DATABASE_URL). Fixture tự tạo (mã có hậu tố ngẫu nhiên, đi qua advisory lock + trigger). Các bảng lịch sử cấm DELETE nên **không có cleanup**: dùng DB dùng một lần, dựng lại giữa các lần chạy đầy đủ. Lưu ý test đổi trạng thái kỳ đăng ký (OPEN/CLOSED) và để kỳ ở OPEN.
- Lệnh: `cd backend && npm run test:integration`
- Kết quả mong đợi: 22 test PASS. Kiểm chứng gồm: phòng 6 chỗ (2 ALLOCATED + 3 CHECKED_IN) → allocated 5/available 1 (TC-03.1); lọc kết hợp (TC-03.3); phòng INACTIVE ẩn; `_`/`%` trong q là ký tự thường; phân trang không trùng/hụt; GET không bị khóa ghi chặn; PATCH chờ writer đang giữ lock rồi mới ghi; khóa account có hiệu lực ở request kế tiếp.
- Chưa có trong P1 (thuộc P2): cạnh tranh gửi đơn.

## Giới hạn / lỗi còn lại
- Chưa đo NFR-02. Chưa có test qua login thật. Không dùng seed 100 SV/100 phòng.
- `studentGetPeriod`: nếu thiếu hàng singleton → 500 (coi là lỗi toàn vẹn dữ liệu; schema.sql luôn INSERT hàng này).

## Thao tác Git người dùng tự thực hiện
Xem file thay đổi ở trên; mở PR sau khi chạy lại `npm ci && npm run check` trên Node 24. AI chưa tự commit/push/merge/tag/phát hành/triển khai.
