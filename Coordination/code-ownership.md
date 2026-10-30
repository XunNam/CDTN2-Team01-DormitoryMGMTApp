# Bản đồ code và trách nhiệm sửa file

Revision: 1.0.0. Những vị trí dưới đây là nơi đặt code trong **một** backend Express dùng chung. Thư mục của người thực hiện không phải namespace quyền mới.

| Phạm vi được giao | Vị trí |
|---|---|
| SV | `backend/src/roles/student/` và `backend/tests/student/` |
| BQL | `backend/src/roles/management/` và `backend/tests/management/` |
| ADMIN | `backend/src/roles/admin/` và `backend/tests/admin/` |
| Shared auth/session/HTTP/DB | `backend/src/shared/`, `backend/src/app.ts`, `backend/src/server.ts`; chỉ người được giao nền chung |
| Workflow dùng bởi nhiều role | `backend/src/shared/domain/`; điều phối viên giao một owner rõ trước khi sửa |
| Cấu trúc và dữ liệu PostgreSQL | `SQL/`; người được Anh giao schema/migration, role owner chỉ đề xuất |
| Đặc tả role | Folder role tương ứng trong `API Endpoint/`; thay đổi giao diện hợp đồng cần review ảnh hưởng |

## Một operation nằm ở đâu

Trong mỗi `backend/src/roles/<role>/` có đúng các điểm mở rộng:

- `router.ts`: khai báo method/path theo contract và nối `validation → controller`; export router có sẵn. Không mở thêm port, `listen`, pool hoặc session middleware.
- `validation.ts`: schema Zod cho path/query/body, strict allowlist; parse sang DTO. Không đọc DB hoặc tự cấp role.
- `controller.ts`: nhận dữ liệu đã parse và `res.locals.actor`, gọi service; dùng helper `sendData`/`sendList` hoặc `res.status(204).end()`. Không viết SQL hoặc nhúng quy tắc sức chứa tại controller.
- `service.ts`: các hàm đặt theo operationId trong contract; kiểm tra điều kiện trước, workflow, chuyển trạng thái và gọi repository. Mỗi mutation chạy trong transaction dùng chung. Không giữ `Response`/`Request` trong service.
- `repository.ts`: SQL có tham số `$1...`, nhận `PoolClient` khi nằm trong transaction; không tạo `Pool` riêng, không tự `COMMIT` khi service sở hữu transaction, không trả row DB trực tiếp cho frontend.

Mỗi file có vùng bình luận `IMPLEMENTATION SLOT`; thêm exported function theo operationId vào đó, giữ export/router khung. Không chèn code vào cuối file ngoài function chỉ để chạy khi import. Khi một file lớn, đề xuất tách theo domain trong chính folder role và cập nhật danh mục; không tự di chuyển code của người khác.

## Logic liên role

Thông tin phòng hiển thị cho SV và BQL phải tính từ cùng occupancy query/DTO. Workflow gửi đơn và duyệt đơn cần cùng khóa business write, trạng thái và constraint. Shared workflow không được sao chép vào hai role; task phải nêu owner shared, API sử dụng và test liên phần. Nếu dependency chưa được triển khai, báo phần bị chặn, chuẩn bị test/validation độc lập; không dựng DB/auth khác để giả chạy được.

## File không sửa theo task role thông thường

`package.json`, lockfile, `tsconfig.json`, `src/app.ts`, `src/server.ts`, `src/shared/**`, `SQL/**`, contract của role khác và AGENTS gốc cần task nền hoặc thay đổi liên phần được Anh giao. Việc phát hiện cần sửa không phải lý do bỏ qua; ghi đề xuất cụ thể để Anh điều phối.
