# Baseline đặc tả revision 1.0.0

Trạng thái **SPECIFIED_NOT_IMPLEMENTED**. Nguồn ủy quyền: prompt chủ dự án yêu cầu hướng dẫn AI chi tiết, tự quyết định khung backend, chốt schema và viết API Contract thật cho3 role; yêu cầu role chưa rõ phải hỏi lại chính người giao việc. Đây là mốcB của kế hoạch, không tự cho phép hoàn thiện mọi API nghiệp vụ.

## Những quyết định có hiệu lực

| ID | Trạng thái | Nội dung |
|---|---|---|
| DEC-022 | OWNER_CONFIRMED | Tạo bộ đặc tả, schema và khung dùng chung; AGENTS hướng dẫn nhận role/task và đặt code; giữ giới hạn không tự thực hiện thao tác Git |
| DEC-023 | DELEGATED_SELECTION | Một backend Express5, TypeScript strict ESM, Node24 LTS, npm và lockfile; pg SQL tham số hóa, express-session/PG store, Argon2id. Manifest/lockfile backend sở hữu exact dependency; không cài bản riêng từng role |
| DEC-024 | DELEGATED_SELECTION | 51 operation: 5 Shared, 13 SV, 28 BQL, 5 ADMIN; route/schema/DTO theo danh mục API và Shared/schemas.json. Mapping manifest dùng cho kiểm tra dẫn xuất |
| DEC-025 | DELEGATED_SELECTION | Hai kho account+profile tách, session_version để revoke phiên sau đổi password; singleton kỳ1; schema.sql cụ thể và trigger/index bảo vệ lifecycle/history |
| DEC-026 | DELEGATED_SELECTION | Mutation READ COMMITTED dùng khóa advisory xact(724006,1) trước đọc nghiệp vụ, recheckactor; GET snapshot khôngwrite lock; derive occupancy khôngcounter |
| DEC-027 | DELEGATED_SELECTION | Sourcecontract Markdown+schemas dùng chung; OpenAPI/request collection dẫn xuất. Auth và schema phải tích hợp kiểm chứng trước nhận task nghiệp vụ; role không tự cấp quyền Shared |

DEC-022 tiếp nối DEC-007 (kế hoạch đã hoàn tất), thay phạm vi chỉ lập kế hoạch. DEC-023 chốt các toolchain còn PROPOSED/OPEN trong TECH-11; không đổi framework. DEC-024..027 cụ thể hóa DEC-018/021, không thay quyền/FR/QT. Ngày xác lập theo prompt30/10/2026. Hosting và phân công tên người vẫn chưa chốt, không chặn đặc tả; không tự gán bạn nào vào role.

## Làm rõ môi trường kiểm thử ngày 01/11/2026

**DEC-028 / OWNER_CONFIRMED:** ba thành viên chuẩn bị Node.js 24/npm 11, không có PostgreSQL local; Bùi Thế Anh kiểm thử PostgreSQL/tích hợp sau bàn giao. Thành viên vẫn triển khai code, chạy build/unit và viết test tích hợp/fixture để bàn giao. Ghi NOT_RUN_PENDING_OWNER cho test cần DB; READY_FOR_OWNER không là DONE. Cho phép viết và bàn giao phần role độc lập trước khi có môi trường DB/auth để tích hợp; làm rõ điều kiện nhận task trong DEC-027. Đây là phân công nơi chạy test, không giảm yêu cầu SRS hoặc thay stack/contract. Chi tiết tại [phân công kiểm thử](../Coordination/testing-responsibilities.md).

## Hoàn thiện Shared/SV ngày 02/11/2026

**DEC-029 / DELEGATED_SELECTION:** trong yêu cầu chủ dự án hoàn thiện hai đề xuất còn lại và commit/push trên api-students, chuyển `withReadSnapshot` của SV vào `backend/src/shared/db/read-snapshot.ts`. Giữ READ ONLY REPEATABLE READ, một client, không advisory write lock, rollback/release và lỗi gốc. Các role khác có thể tái sử dụng helper khi được giao sửa consumer; lượt này không đưa implementation ADMIN/BQL vào nhánh SV.

Thống nhất biểu diễn timestamp UTC có ba chữ số mili giây (`YYYY-MM-DDTHH:mm:ss.SSSZ`), khớp cách ADMIN/BQL hiện có, qua formatter `backend/src/shared/http/datetime.ts` được mapper SV dùng. Không đổi kiểu date-time, field/enum/quyền/schema DB hoặc ngày nghiệp vụ; giữ độ chính xác để frontend so thời điểm cập nhật. Đây là lựa chọn kỹ thuật trong phạm vi chủ dự án giao, không trình bày như chủ dự án tự chọn định dạng cụ thể. Đề xuất cũ trong bàn giao P1 cắt phần lẻ giây để giống ví dụ được thay bằng quy tắc này.

Kiểm chứng: unit về transaction cleanup và timestamp precision; PostgreSQL snapshot với writer đồng thời; DTO HTTP so thời gian DB và bản ghép ba role. Chi tiết/trạng thái thực tế tại `Coordination/tasks/SHARED-SV-FOLLOWUP-20261102/progress.md` và báo cáo bổ sung cùng ngày. Chủ dự án đã cho phép commit ký/push cho task; không merge hoặc approve PR.

## Cập nhật độ dài Argon2id ngày 05/11/2026

**OWNER_CONFIRMED:** chủ dự án yêu cầu trên nhánh `config/backend-frontend` đổi hash length sang **64 byte** và commit/push bổ sung. Áp dụng cho cấp tài khoản ADMIN/BQL/SV, đổi mật khẩu và bootstrap ADMIN; giữ Argon2id, memoryCost 65536 KiB, timeCost 3, parallelism 1 và salt ngẫu nhiên. Thay lựa chọn hashLength 32 trước đây tại Shared/03-data-contracts.md. Hash cũ 32 byte vẫn được xác minh bằng thông số trong chuỗi Encoded; không reset mật khẩu hoặc sửa dữ liệu tài khoản hiện có. Chỉ mật khẩu được tạo/đổi sau cập nhật sinh digest 64 byte. Không đổi độ dài token CSRF, session secret hoặc yêu cầu mật khẩu.

## Nguồn triển khai

- [Danh mục API](<../API Endpoint/README.md>) và [schemas](<../API Endpoint/Shared/schemas.json>).
- [SQL](../SQL/README.md) và [Business Rules](<../Business Rules/README.md>).
- [Điều phối](../Coordination/README.md), [khung code](../backend/README.md).

Không thay SRS PDF. Không coi health/compile/static checks là kiểm chứng businessAPI hoặc NFR. Agent phải dùng taskboard và handoff; con người tự commit/pushbranch/PR, Anh review/merge thủ công.
