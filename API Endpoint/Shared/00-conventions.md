# Quy ước HTTP và dữ liệu

Revision **1.0.0**. SRS/OWNER_CONFIRMED giữ theo Planning/10–12; chi tiết HTTP/validation tại đây là DELEGATED_SELECTION theo ủy quyền tạo đặc tả của chủ dự án.

## Transport

- Base `/api/v1`, HTTPS khi triển khai. UUID chuẩn RFC4122 chuỗi; đường dẫn không dấu slash cuối. Express strict routing; URL không tồn tại404 NOT_FOUND.
- JSON camelCase. GET không body; chỉ query allowlist; query lặp hoặc dạng object/array bị422. Query boolean chỉ `true`/`false`, số nguyên thập phân chuẩn. Không dùng truthiness của chuỗi `false`.
- Ghi POST/PATCH dùng Content-Type application/json, body object, tối đa32KiB. Sai media415 UNSUPPORTED_MEDIA_TYPE; JSON lỗi400 INVALID_JSON; quá lớn413 PAYLOAD_TOO_LARGE. Không nhận thuộc tính lạ, sai kiểu/null/trống:422 VALIDATION_ERROR; không coercion boolean/number trong JSON body.
- Không trường thừa request/response; PATCH thiếu=giữ nguyên, null chỉ được chấp nhận cho nullable, PATCH rỗng422. Chỉ PUT/DELETE khi contract revision sau có operation; hiện không có.
- Trim tên/liên hệ/lý do; business code trim+uppercase; staff username trim+lowercase. Password không trim/normalize. Chuỗi rỗng sau trim không thay null. Các giới hạn chuỗi tính Unicode code points.
- Các ID/người thao tác/status/thời điểm do server sinh trừ trường được request schema cho phép. Role trong request chỉ ở cấp account và phải khớp accountType; không tin role khi login.

## Envelope và trạng thái

Thành công chi tiết: `{ "data": DTO }`. Danh sách: `{ "data": [DTO], "meta": { "page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0 } }`. Không có trường success/message bên ngoài envelope. `204` không body. Tạo mới201; đọc/cập nhật/hành động200 trừ auth logout/password204. Approve200 trả ApprovalResult.

Lỗi: `{ "error": { "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ", "details": [{"field":"capacity","message":"Phải là số nguyên dương"}] } }`. details chỉ khi có lỗi theo field; không SQL/stack/hash/session/token/password.

## Danh sách

page từ1, mặc định1; pageSize1..100 mặc định20. Trang vượt cuối trả200 data[]; totalPages=ceil(totalItems/pageSize), dữ liệu rỗng totalPages0. `q` trim, tối đa100, thiếu/rỗng=không lọc; tìm không phân biệt hoa thường, ký tự `%`/`_` là literal được escape, SQL tham số hóa.

Sort cố định: buildings `code ASC,id ASC`; rooms `buildingCode ASC,code ASC,id ASC`; residences `allocatedAt DESC,id ASC`; các list còn lại `createdAt DESC,id ASC`; candidates dùng profile.createdAt. Không nhận query sort. Filter kết hợp AND; enum phải đúng chữ hoa. Sinh viên không được truyền studentId hoặc trường lọc BQL; request đó422. List và count chạy cùng snapshot REPEATABLE READ read-only; GET thống kê tính bốn chỉ số trong một snapshot; không dùng global write lock cho GET.

## Tiền và ngày

VND chuỗi chữ số chuẩn không dấu đầu+, không zero thừa (trừ0), 0..9223372036854775807. So sánh bằng BigInt, không Number; PostgreSQL BIGINT không custom parser sang JS number. Ngày YYYY-MM-DD phải là ngày lịch thật, không tương lai theo Asia/Ho_Chi_Minh; ngày trả >= ngày nhận; ngày sinh <= hôm nay. Timestamp do server tạo UTC ISO8601 Z; node-pg DATE giữ chuỗi nguyên ngày, không parse Date gây lệch múi giờ.

Làm rõ ngày 02/11/2026 theo DEC-029: timestamp trả về thống nhất dạng `YYYY-MM-DDTHH:mm:ss.SSSZ`, ví dụ `2026-11-02T10:20:30.123Z`, giữ ba chữ số mili giây như ADMIN/BQL đang dùng. Mapper SV dùng `shared/http/datetime.ts` để giữ cùng dạng, không cắt mất phần mili giây. Đây vẫn là `format: date-time` tại schemas.json; các ví dụ không có phần lẻ giây là minh họa ISO8601 hợp lệ, không phải yêu cầu cắt độ chính xác. Không đổi ngày nghiệp vụ YYYY-MM-DD, thứ tự sort theo timestamp trong DB hoặc dữ liệu lưu PostgreSQL.

## Thứ tự kiểm tra lỗi

1. Giới hạn transport/JSON (kể cả root phải là object và GET/HEAD không body) -> 2. Origin+CSRF với mutation -> 3. xác thực fresh (401) -> 4. role (403) -> 5. validate path/query/body (422) -> 6. tìm tài nguyên kèm ownership (404) -> 7. trạng thái (409) -> 8. điều kiện nghiệp vụ theo thứ tự operation -> 9. ghi atomic. Login/logout và GETcsrf theo ngoại lệ tại authentication. Không trả lỗi tồn tại bản ghi trước xác thực/role. Với mutation recheck account bên trong khóa trước bước6.

Xem [lỗi](04-errors.md), [DTO](03-data-contracts.md), [cạnh tranh](05-concurrency-and-retry.md).
