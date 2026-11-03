Dùng **DormFlow** như một cổng ký túc xá rõ ràng, yên tĩnh và dễ thao tác. Giọng văn tiếng Việt trực tiếp: “Đăng nhập”, “Mã số sinh viên”, “Tên đăng nhập”; không dùng thuật ngữ kỹ thuật trong biểu mẫu.

## Màu sắc và bố cục
Dùng `canvas` cho nền trang, `on-primary` cho vùng biểu mẫu, `ink` cho nội dung và `muted` cho hướng dẫn. Dùng `primary` cho nút chính và mảng giới thiệu; `accent` chỉ nhấn một phần thông điệp và hình học cửa sổ. Không gradient, bóng đổ hoặc thẻ trang trí. Chia desktop thành vùng giới thiệu 44% và vùng đăng nhập 56%, biểu mẫu tối đa 424px. Dưới 760px, bỏ vùng giới thiệu lớn, đặt tên sản phẩm trước biểu mẫu. Lề điện thoại 24px.

## Chữ và nhịp
Dùng Manrope cho `display`, `heading`, `title`; Be Vietnam Pro cho `body`, `label`, `caption`, `button`. Các font là Google Fonts, fallback Segoe UI và sans-serif nếu không có mạng. Không có font nhị phân trong nguồn. Dùng `space-8` giữa nhãn và trường; `space-24` giữa các trường; `space-32` giữa phần đầu và biểu mẫu; `space-64` cho lề desktop. Input và nút cao 52px, vùng bấm phụ tối thiểu 44px. Dùng `radius-control` cho điều khiển và `radius-group` cho nhóm lựa chọn.

## Điều khiển và trạng thái
Dùng đúng hai lựa chọn “Sinh viên” và “Nhân sự”. Đổi nhãn identifier theo lựa chọn, không yêu cầu người dùng chọn quyền BQL/ADMIN. Nút chọn có màu nền và dấu chọn, không dựa riêng màu sắc. Nhãn luôn hiện, không dùng placeholder thay nhãn. Mật khẩu có nút Hiện/Ẩn với tên truy cập rõ. Khi đang gửi: khóa gửi lặp, giữ nhãn “Đang đăng nhập…”, thêm aria-busy. Lỗi toàn biểu mẫu nằm trước trường nhập với tiêu đề, lời hướng dẫn và role=alert; lỗi dữ liệu gắn aria-describedby vào trường.

## Khả năng tiếp cận
Dùng `ink` và `muted` trên các nền sáng đã nêu; `on-primary`, `on-dark-muted`, `accent` trên `primary`. Dùng `border` cho đường viền điều khiển có ý nghĩa, `focus` cho outline 3px trên nền sáng. Dùng `danger` trên `danger-surface`, luôn kèm nội dung lỗi. Giữ thứ tự Tab theo thị giác, cho phép Enter gửi form, không cấm paste hoặc password manager. Tôn trọng prefers-reduced-motion; không dùng animation tự chạy.

## Nhận diện và hình minh họa
Đặt “VLU · DormFlow” bằng chữ thuần. Nguồn không có logo chính thức; không tái tạo biểu trưng VLU. Mảng cửa sổ là hình học trang trí, không mô tả tòa nhà thực, luôn aria-hidden. Icon chức năng là SVG nét đơn, stroke 1.75–2px, aria-hidden khi đã có nhãn.

## Sử dụng
`tokens.json` là nguồn giá trị. Các ví dụ HTML gốc nằm tại `components/AccountTypeSwitch/preview.html`, `components/TextField/preview.html`, `components/Button/preview.html`, `components/Feedback/preview.html`; đọc README trong từng thư mục trước khi chuyển sang Next.js. Không có bundle JavaScript hay thư viện component được đồng bộ từ mã nguồn. Canvas dùng cùng token và điều khiển HTML gốc; cài tokens bằng bản sao nguyên tệp dưới ds/dormflow.

## Giới hạn tính năng
Không thêm tự đăng ký, ghi nhớ đăng nhập dài hạn, SSO, reset mật khẩu qua email hoặc chọn role. Hiển thị hướng dẫn “Liên hệ Ban quản lý ký túc xá để được hướng dẫn.” khi chưa có tài khoản/bị khóa. BQL hướng dẫn, quyền cấp và mở tài khoản vẫn ở ADMIN.

