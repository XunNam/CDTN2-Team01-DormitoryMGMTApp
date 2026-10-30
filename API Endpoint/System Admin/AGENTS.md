# Chỉ dẫn Agent phụ trách Quản trị viên

Áp dụng cùng [AGENTS gốc](../../AGENTS.md) và [AGENTS API](../AGENTS.md). Role máy là `ADMIN`, không kế thừa quyền nghiệp vụ `BQL` hoặc `SV`.

## Nhận việc

Nếu chưa có role/task rõ ràng, hỏi người đang làm việc với Agent: **“Bạn đang phụ trách API của Sinh viên, Ban quản lý hay Quản trị viên? Bạn được giao operation hoặc task nào?”** Chờ trả lời trước khi chọn module nghiệp vụ; không tự chọn ADMIN vì người dùng là chủ repository.

Đọc contract, Shared auth/authorization/DTO/error và schema trước khi code. Ghi task, contract revision, người phụ trách/review, file được sửa; đọc `git status` và không ghi đè thay đổi khác.

## Vị trí code

- Đặt code tại `backend/src/roles/admin/`, test theo bảng ánh xạ operation trong contract và backend README.
- Router chỉ gắn route/middleware; controller xử lý transport; service xử lý nghiệp vụ/transaction; repository SQL có tham số; validation allowlist.
- Dùng một auth/session/DB pool/error handler chung. Không tạo server Admin, bảng account thứ ba hoặc cơ chế đăng nhập riêng.
- Không tự sửa module SV/BQL, Shared, schema, dependency hoặc app entrypoint ngoài phạm vi task. Đề xuất thay đổi liên phần cùng ảnh hưởng tới contract/consumer cho điều phối viên.
- Code hoàn tất ở đúng hàm/file operation, được nối vào router hiện có và có test; không giữ phần triển khai chỉ trong chat hoặc một file bàn giao tách rời dự án.

## Tài khoản và quyền

- Phân biệt hai namespace `STUDENT` và `STAFF`; accountId đi kèm accountType, không truy vấn nhầm bảng khi UUID hoặc identifier giống nhau.
- BQL tạo hồ sơ trước. ADMIN chỉ cấp account SV cho hồ sơ đã có và chưa gắn account; hồ sơ không tự có login. Tra cứu hỗ trợ cấp account chỉ trả metadata tối thiểu theo DTO đã chốt.
- Role chọn lúc tạo; không có endpoint đổi role, reset mật khẩu, tự đăng ký hoặc gán nhiều role.
- Mật khẩu băm Argon2id theo Shared; không trả/log password hoặc hash. Request login không được tự quyết role.
- Khóa không xóa profile, đơn, lưu trú hoặc phiếu. Mỗi request bảo vệ kiểm tra khóa; cho Admin tự khóa, không tự thêm guard Admin cuối hoặc logout realtime.
- ADMIN không được đọc đơn/lưu trú/phiếu hoặc thao tác xếp phòng/thu phí chỉ nhờ role quản trị.
- Dùng DTO/envelope/error chung, không trả hàng DB; không thêm field ngoài contract để phục vụ màn hình riêng.

## Kiểm chứng và bàn giao

Kiểm thử cấp ba loại role, account SV thiếu/trùng hồ sơ, username trùng, input thừa, sai quyền, hash không lộ, khóa/mở và self-lock. Test yêu cầu kế tiếp của tài khoản đang đăng nhập sau khi bị khóa; kiểm tra dữ liệu nghiệp vụ giữ nguyên.

Bàn giao operation/file/test, revision và phụ thuộc, lệnh/kết quả kiểm tra thực tế, phần chưa kiểm chứng. Không tự commit/push/merge hoặc triển khai; người cộng tác tự kiểm tra và thực hiện các thao tác Git theo AGENTS gốc.
