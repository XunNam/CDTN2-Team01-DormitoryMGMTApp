# DormFlow · Bàn giao thiết kế đăng nhập

Task UI-AUTH-DESIGN-20261103. Phạm vi: thiết kế giao diện xác thực dùng chung, không triển khai hoặc thay đổi backend. Người thực hiện: Codex theo yêu cầu người giao việc. Người review: chủ dự án. Nguồn chức năng: FR-01, UC-01, QT-01/QT-02, TC-01.1/01.2, NFR-01. Contract revision 1.0.0.

## Nguồn và quyết định thiết kế

Đã đọc Figma qua Desktop Bridge: file **CDDTN2 - ĐKY Dromitory**, file key `6Tab73i6wkfdEtXuhcjL7P`, trang **DormFlow · Wireframe 16-9**, section `2:2`, frame đăng nhập `2:5` (1280×720). [Mở khung nguồn](https://www.figma.com/design/6Tab73i6wkfdEtXuhcjL7P/?node-id=2-5).

Giữ hai vùng giới thiệu/biểu mẫu, tên VLU · DormFlow, thông điệp “Đăng ký chỗ ở. Theo dõi dễ dàng.”, hai kho tài khoản, identifier, mật khẩu, hiện/ẩn và hướng dẫn liên hệ BQL. Thay select bằng hai radio nhìn thấy cùng lúc, đổi nhãn identifier theo nhóm. Màu sắc, kiểu chữ, khoảng cách và hình học là thiết kế mới theo hướng Campus Modern, không đồng bộ bảng màu wireframe. Không thay đổi Figma.

Đã đối chiếu mã thật tại:
- [validation.ts](../../../backend/src/shared/auth/validation.ts): strict allowlist, STUDENT/STAFF, trim + uppercase/lowercase identifier, độ dài Unicode code points.
- [router.ts](../../../backend/src/shared/auth/router.ts), [controller.ts](../../../backend/src/shared/auth/controller.ts), [service.ts](../../../backend/src/shared/auth/service.ts): CSRF, cookie phiên, lỗi, Identity.
- [Contract auth](<../../../API Endpoint/Shared/01-authentication.md>), [conventions](<../../../API Endpoint/Shared/00-conventions.md>), [errors](<../../../API Endpoint/Shared/04-errors.md>).
- [Backend README](../../../backend/README.md): Next.js chuyển tiếp cùng origin, không CORS riêng.
- AGENTS và Planning baseline: quyền do server quyết định, không tự đăng ký/reset qua email, idle timeout 30 phút.

## Bộ đầu ra

| Artboard | Kích thước | Nội dung |
|---|---|---|
| Main.dc.html | 1440×900, trang fluid | Sinh viên; chuyển được sang nhân sự |
| Mobile.dc.html | 390×844, cuộn trong khung | Cùng luồng; bỏ hero trên điện thoại |
| Staff.dc.html | 1440×900, trang fluid | Nhân sự với trạng thái tài khoản bị khóa |

Design system: `designs/dormflow-design-system/project/`, 12 màu, 7 kiểu chữ, 7 khoảng cách, 3 bán kính, hướng dẫn và 4 mẫu điều khiển HTML (AccountTypeSwitch, TextField, Button, Feedback), thêm cover. Không có logo/font nhị phân từ nguồn, dùng tên bằng chữ thuần và Google Fonts với fallback. Không có bundle component hiện hữu để kế thừa. Canvas cài bản sao token nguyên tệp tại `ds/dormflow/tokens.json`.

Bản mẫu giữ dữ liệu nhập trong bộ nhớ, không gọi mạng/API đăng nhập, không dùng localStorage hoặc ghi mật khẩu xuống tệp. Không nhập tài khoản thật vào bản mẫu. Khi gửi với dữ liệu giả hợp lệ, mô phỏng loading 700ms rồi hiển thị trạng thái chọn trong Tweaks; READY cho kết quả mô phỏng thành công. Chưa có trang đích sau đăng nhập trong phạm vi thiết kế.

## Ánh xạ form sang API

| Giao diện | JSON | Ràng buộc |
|---|---|---|
| Sinh viên | accountType: STUDENT | Chọn kho sinh viên, không gửi role |
| Nhân sự | accountType: STAFF | Bao gồm BQL/ADMIN, không chọn quyền từ client |
| Mã số sinh viên / Tên đăng nhập | identifier | 1–50 Unicode code points sau trim; SV viết hoa, STAFF viết thường do backend chuẩn hóa |
| Mật khẩu | password | 8–128 Unicode code points; không trim/normalize/cắt chuỗi |

Chỉ gửi đúng ba thuộc tính, không query, không displayName/studentId/role/rememberMe. Identifier là text, không bắt buộc numeric hay email. Không dùng maxlength dựa UTF-16 để thay quy tắc code point; kiểm bằng `[...value].length`. Cho phép paste, bộ quản lý mật khẩu và nhập bằng bàn phím; nhãn không biến mất.

## Luồng nối frontend thật

1. Next.js proxy `/api/v1` về Express theo cùng origin `APP_ORIGIN`. Khi vào trang, có thể dùng `GET /api/v1/auth/me` để kiểm tra phiên; 200 chuyển tới giao diện theo `data.role`, 401 hiển thị đăng nhập theo mã lỗi. Không tạo polling để duy trì phiên.
2. Lấy `GET /api/v1/auth/csrf`, đọc `data.csrfToken` và giữ trong bộ nhớ. Dùng cookie cùng origin; `credentials: 'same-origin'` hoặc `include` tùy lớp HTTP dùng chung. Không gửi body/query cho GET.
3. Người dùng gửi form: validate; `POST /api/v1/auth/login`, `Content-Type: application/json`, `X-CSRF-Token`, JSON đúng ba trường. Trình duyệt cung cấp Origin; không giả mạo/tắt kiểm tra Origin. Tắt gửi lặp trong khi chờ.
4. 200 trả `{data: Identity}`; không tìm token JWT trong response. Cookie `dormflow.sid` HttpOnly được trình duyệt quản lý, không đọc/lưu bằng JavaScript.
5. Sau thành công, phiên và CSRF đã thay đổi: gọi lại GET csrf trước mutation tiếp theo. Lấy role từ Identity do server trả: SV/BQL/ADMIN chuyển tới các màn hình role đã được triển khai. Đường dẫn frontend chưa tồn tại trong repo; không tự đặt route như một quyết định backend.
6. Nếu việc lấy CSRF mới lỗi sau 200, giữ kết quả login thành công, chặn mutation và cho tải lại token/kiểm tra me; không tự POST lại mật khẩu.
7. Nếu request login mất response, GET me để xác định phiên trước khi yêu cầu đăng nhập lại; không khẳng định đăng nhập thất bại hoặc tự gửi lại mật khẩu. 401 từ API bảo vệ đưa về đăng nhập; không tự refresh phiên bằng polling.
8. Xóa password khỏi bộ nhớ sau thành công hoặc khi rời trang. Không log request body, cookie, X-CSRF-Token hay mật khẩu.

## Trạng thái và lời hướng dẫn

Tweaks → `previewState` chọn trạng thái; `accountType` chọn STUDENT/STAFF trước khi thao tác. Thay radio là thao tác trong bản mẫu, sẽ giữ lựa chọn đó cho tới khi mở lại artboard.

| Tình huống | Giao diện/hành động frontend thật |
|---|---|
| READY | Hiện form trống, nhóm Sinh viên mặc định |
| LOADING | “Đang đăng nhập…”, disabled, aria-busy, chống gửi lặp |
| INVALID_CREDENTIALS · 401 | Lỗi chung; kiểm tra nhóm, mã đăng nhập và mật khẩu; không phân biệt account có tồn tại |
| ACCOUNT_LOCKED · 401 | “Tài khoản đã bị khóa”, hướng dẫn liên hệ BQL; không có nút mở khóa |
| VALIDATION_ERROR · 422 | Đánh dấu trường khi có details; chỉ map field thuộc identifier/password/accountType; lỗi không định vị được thì đặt đầu form |
| CSRF_INVALID · 403 | Làm mới token/phiên; yêu cầu thao tác gửi lại của người dùng, không tự gửi mật khẩu |
| ORIGIN_FORBIDDEN · 403 | Hướng dẫn mở đúng cổng, không lặp POST |
| SERVICE_UNAVAILABLE · 503 | Thông báo tạm thời, cho thử lại thủ công; không tự retry |
| SESSION_EXPIRED · 401 | Giải thích phiên hết hạn và yêu cầu đăng nhập lại |
| Network error | Giải thích mất kết nối; kiểm tra me để hòa giải kết quả không rõ trước khi gửi lại |
| INTERNAL_ERROR / lỗi khác | Thông báo chung “Chưa thể đăng nhập. Vui lòng thử lại sau.”; không hiển thị stack trace hay thông tin nội bộ |
| SUCCESS | Chỉ trạng thái mô phỏng; frontend thật chuyển trang theo role |

Hỗ trợ quên mật khẩu bằng hướng dẫn liên hệ hiện có, không dựng reset email. Không có tự đăng ký/SSO/ghi nhớ phiên dài hạn. BQL tiếp nhận hướng dẫn; API cấp/mở tài khoản vẫn là ADMIN.

## Tiêu chí bố cục và truy cập

Desktop: hero 44%, form 56%, form tối đa 424px. Dưới 760px: ẩn hero, tên sản phẩm trước form, lề 24px, không thu nhỏ chữ input dưới 15px. Màn hình điện thoại là khung 390×844 cuộn được, không vẽ thanh hệ điều hành hay bàn phím giả. Form tiếp tục cuộn khi bàn phím mở.

Radio native: hỗ trợ Tab và mũi tên, chữ cùng dấu chọn. Label gắn input. Hiện/Ẩn dùng button type=button với aria-label/aria-controls/aria-pressed. Focus-visible 3px. Form dùng Enter để gửi. Lỗi nhập liệu nằm cạnh trường với aria-invalid/aria-describedby và focus trường sai đầu tiên. Lỗi server role=alert trước trường nhập. SVG trang trí aria-hidden. Hạn chế chuyển động; các trạng thái loading dựa vào chữ, không phụ thuộc animation.

## Kiểm chứng và checkpoint

Đã hoàn tất: xem khung Figma và screenshot nguồn; đọc contract và implementation auth; tạo design system; cài token vào canvas; tạo đủ ba artboard và tài liệu bàn giao. Hai lệnh check của Baoyu báo **problems: 0** cho hệ thiết kế và canvas.

Check của Baoyu chỉ kiểm cấu trúc tệp, không xác nhận layout hay JavaScript chạy. Theo quy tắc Canvas trong SKILL.md, chưa thực hiện render/screenshot/kiểm tra tương tác khi người dùng chưa yêu cầu. Chưa kiểm thử API end-to-end, chưa chạy frontend Next.js, không thay đổi backend. Tình trạng bàn giao: **DESIGN_READY_FOR_OWNER_REVIEW**; không phải tính năng đăng nhập đã được tích hợp.

Tiếp theo khi được giao triển khai: dùng hệ thiết kế này để làm trang Next.js trong cây frontend thống nhất của dự án; nối 3 operation getCurrentIdentity/getCsrfToken/login; kiểm chứng hai kho tài khoản, ba role, phiên cũ/mới, lỗi và bàn phím trên desktop/mobile. Các giới hạn không tự Git và không tự sửa Shared giữ nguyên.

