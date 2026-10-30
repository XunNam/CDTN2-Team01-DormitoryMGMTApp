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

## Nguồn triển khai

- [Danh mục API](<../API Endpoint/README.md>) và [schemas](<../API Endpoint/Shared/schemas.json>).
- [SQL](../SQL/README.md) và [Business Rules](<../Business Rules/README.md>).
- [Điều phối](../Coordination/README.md), [khung code](../backend/README.md).

Không thay SRS PDF. Không coi health/compile/static checks là kiểm chứng businessAPI hoặc NFR. Agent phải dùng taskboard và handoff; con người tự commit/pushbranch/PR, Anh review/merge thủ công.
