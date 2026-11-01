# Phân công kiểm thử trên máy thành viên và máy Anh

**OWNER_CONFIRMED ngày 01/11/2026:** ba thành viên viết ba phần backend trên máy có Node.js 24 và npm 11, không có PostgreSQL cài sẵn. Bùi Thế Anh chuẩn bị PostgreSQL và kiểm thử database/tích hợp sau khi nhận bàn giao. Quy định này làm rõ nơi thực hiện test, giữ nguyên contract 1.0.0 và các tiêu chí SRS.

| Người thực hiện | Trách nhiệm |
|---|---|
| Thành viên và AI của mình | Triển khai API theo role; viết test độc lập và test tích hợp; chạy build, unit test bằng mock/fake; bàn giao cách chạy, fixture và kết quả mong đợi |
| Bùi Thế Anh | Chuẩn bị DB test riêng, cấu hình và dữ liệu giả; chạy SQL assertions, test tích hợp API, ownership/auth/session-store và cạnh tranh thật; kiểm tra liên role, phản hồi lỗi và quyết định merge |

## Trên máy ba thành viên

Chỉ cần Node.js 24, npm 11, source đã clone và mạng để npm ci tải dependency. Không yêu cầu cài PostgreSQL, psql hoặc Docker. AI không tự cài database, đổi sang SQLite, xin credentials DB của Anh hoặc chờ có DB mới bắt đầu code.

Từ repo root:

```powershell
cd backend
npm ci
npm run check
```

`check` chạy build rồi test độc lập; `npm test` và `npm run test:unit` cùng chạy nhóm này. Các test tại `backend/tests/{student,management,admin,shared}/` phải chạy không cần DATABASE_URL, server bên ngoài đang chạy hoặc PostgreSQL thật; có thể dùng fake repository/Pool/session cho kiểm tra đơn vị, validation, mapping, envelope và lỗi. Không import server.ts hoặc tự connect DB khi load file test. Runner không nạp .env và bỏ DATABASE_URL/TEST_DATABASE_URL khỏi môi trường nhóm unit.

Mock chỉ kiểm phần logic được mô phỏng, không chứng minh query SQL thực thi, FK/trigger, phân quyền với session thật hoặc racecondition. Thiếu PostgreSQL là điều kiện đã biết của mô hình cộng tác, không phải blocker cho toàn bộ role.

## Test database phải bàn giao

Agent vẫn phải viết các ca cần PostgreSQL tại `backend/tests/integration/<role>/<operationId>.test.ts`; file test độc lập theo contract vẫn ở `backend/tests/<role>/<operationId>.test.ts`. Hai nhóm bổ sung nhau. Không đặt test kết nối DB trong nhóm mặc định, không dùng skip/todo để biến test chưa chạy thành pass. Test tích hợp không được tự fallback sang mock khi thiếu DB.

Mỗi nhóm test tích hợp có fixture/setup, thứ tự chạy, dữ liệu giả, cách dọn trên DB test, expected status/body và invariant cuối. Fixture phải đi qua transaction/trigger chuẩn; không bỏ check quyền, số chỗ, snapshot tiền hoặc cạnh tranh vì máy người viết thiếu DB. Không tự DROP/TRUNCATE database hay áp schema trong lúc import test. Shared auth chưa có phải ghi phụ thuộc riêng; không giả login để tuyên bố kiểm chứng full API.

Trong handoff/checkpoint, ghi **NOT_RUN_PENDING_OWNER — chờ Bùi Thế Anh kiểm thử PostgreSQL**, kèm danh sách test cụ thể. Khi implementation đã hoàn tất, build/unit pass và hồ sơ bàn giao đủ, có thể đề nghị READY_FOR_OWNER dù test DB chưa chạy. Không ghi toàn API/role DONE hoặc nghiệm thu tích hợp đạt.

## Trên máy Anh

Sau review code và file test, Anh chuẩn bị Node/npm cùng PostgreSQL, psql và một database test riêng. Dùng SQL/README.md dựng schema một lần trên DB trống, chạy assertions và chuẩn bị account/fixture hợp lệ; xác thực dùng chung phải có trước kiểm chứng full API. Không dùng DB chứa dữ liệu thật.

Trong backend/, sao chép `.env.test.example` thành `.env.test`, điền TEST_DATABASE_URL trỏ DB test cùng SESSION_SECRET và APP_ORIGIN cần cho bộ test. Hoặc cấp các biến qua môi trường. Đây là cấu hình riêng máy Anh; không gửi secret cho thành viên và không commit .env.test.

```powershell
npm run check
npm run test:integration
```

Lệnh integration chỉ chọn test dưới tests/integration, nạp .env.test nếu có và dùng TEST_DATABASE_URL riêng, không fallback DATABASE_URL của môi trường development. Runner cấp DATABASE_URL của tiến trình test từ đúng TEST_DATABASE_URL. Thiếu URL hoặc chưa có file test tích hợp thì lệnh kết thúc với lỗi hướng dẫn, không báo pass. Runner không tạo/reset DB, không tự chạy SQL/schema.sql. Các test phải đọc cấu hình đã cấp, không hardcode credentials.

Hiện repo mới có test khung, chưa có test tích hợp nghiệp vụ; lệnh riêng là đường chạy để nhận các test do thành viên bổ sung. Anh ghi kết quả thực tế, lỗi, các ca chưa chạy và bằng chứng tại handoff của task. Các ca cạnh tranh phải dùng hai connection/request chồng lấp, theo SQL/tests/concurrency.md. Chỉ sau các kiểm chứng cần thiết và review liên phần mới xác nhận DONE/merge thủ công.

## Mẫu bàn giao tối thiểu

- Code/API đã triển khai, router, revision và file thay đổi.
- Build/unit: lệnh, kết quả, lỗi đã sửa hoặc còn lại.
- Integration/SQL: đường dẫn test, setup/fixture, lệnh chạy và kết quả mong đợi; trạng thái NOT_RUN_PENDING_OWNER trên máy thành viên.
- Phụ thuộc Shared hoặc role khác chưa có; bước Anh cần thực hiện trước test.
- Không có credentials thật; không thay API/schema/phạm vi để né kiểm thử.
