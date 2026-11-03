# DormFlow · Frontend

Next.js **16.4.4**, React **19.3.0**, TypeScript, App Router và CSS Modules. Phiên bản latest đã được kiểm tra từ registry npm ngày 03/11/2026; package-lock.json giữ dependency chính xác. Dùng Node.js 24+ và npm 11+.

## Chạy local

Từ thư mục gốc repository:

```powershell
cd frontend
npm ci
npm run dev
```

Mở [http://localhost:3000/login](http://localhost:3000/login); đường dẫn `/` cũng hiển thị trang đăng nhập. Backend Express hiện có chạy riêng, mặc định cổng 3001; xem [hướng dẫn backend](../backend/README.md). Frontend không truy cập trực tiếp PostgreSQL.

Mặc định Next.js chuyển tiếp `/api/v1/*` về `http://127.0.0.1:3001/api/v1/*`. Khi cần đổi nơi backend chạy, tạo `.env.local` từ `.env.example`, đặt `BACKEND_ORIGIN` và khởi động lại frontend. Chỉ dùng origin HTTP(S) không kèm path/query/thông tin đăng nhập. Biến này chỉ nằm phía server, không dùng NEXT_PUBLIC_.

Backend `APP_ORIGIN` phải trùng chính xác địa chỉ trên trình duyệt, ví dụ `http://localhost:3000`. `localhost` và `127.0.0.1`, hoặc cổng khác, là các origin khác nhau. Không bật CORS riêng hoặc bỏ kiểm tra Origin/CSRF để khắc phục cấu hình. Không đưa .env thật hoặc thông tin đăng nhập vào Git.

## Giao diện và API

Trang dùng bản thiết kế Campus Modern đã được chủ dự án duyệt: hai vùng giới thiệu/biểu mẫu, màu xanh mực và xanh lá nhạt, Manrope/Be Vietnam Pro, form tối đa 424px; điện thoại dưới 760px ẩn phần giới thiệu. Font dùng next/font/google để tải và tự phục vụ; build đầu tiên cần kết nối tới Google Fonts, trình duyệt không gọi Google Fonts để tải chữ.

- Hai nhóm Sinh viên/Nhân sự ánh xạ STUDENT/STAFF; nhãn identifier đổi theo nhóm. Không nhận role từ người dùng.
- GET `/api/v1/auth/me` kiểm tra phiên khi mở trang. Không polling.
- GET `/api/v1/auth/csrf` trước POST đăng nhập; token chỉ ở bộ nhớ.
- POST `/api/v1/auth/login` gửi đúng `accountType`, `identifier`, `password`; cookie cùng origin và X-CSRF-Token.
- Login thành công: tải lại CSRF do backend đã đổi phiên/token. Nếu tải CSRF mới lỗi, vẫn giữ kết quả login thành công; thao tác ghi sau lấy lại token.
- POST `/api/v1/auth/logout` với `{}` trên màn hình xác nhận để có thể đổi tài khoản. 204 không parse JSON.
- Giới hạn chuỗi tính theo Unicode code points. Identifier trim; password giữ nguyên, không trim hoặc normalize, không cấm paste.
- Chống gửi lặp, timeout 15 giây; hủy request khi rời trang. Không tự gửi lại POST. Khi mất response login, kiểm tra me và so khớp tài khoản trước khi kết luận; kết quả chưa rõ yêu cầu kiểm tra lại phiên.
- Lỗi credentials/khóa/CSRF/Origin/422/503/mất kết nối được hiển thị bằng lời, không lộ chi tiết nội bộ. Không dùng JWT, localStorage hoặc sessionStorage.

Sau khi đăng nhập, trang hiển thị tên và vai trò từ Identity do API trả về, kèm nút Đăng xuất. **Chưa có dashboard theo vai trò**, nên chưa chuyển tới route không tồn tại. Chưa làm đổi mật khẩu hoặc các màn hình nghiệp vụ còn lại của FE-01/FE-02…; không báo toàn FE-01 đã hoàn tất.

## Cấu trúc

- `src/app/page.tsx`, `src/app/login/page.tsx`: hai entry cho cùng trang đăng nhập.
- `src/components/auth/`: giao diện responsive, trạng thái và điều khiển.
- `src/lib/auth/`: DTO frontend dùng chung, validation, lời hướng dẫn lỗi, HTTP client.
- `src/app/globals.css`: token từ thiết kế đã duyệt.
- `next.config.ts`: proxy cùng origin.
- `tests/`: kiểm tra độc lập bằng fetch/response giả, không gọi API thật.

HTTP contract là nguồn tại [auth dùng chung](<../API Endpoint/Shared/01-authentication.md>) và [schemas.json](<../API Endpoint/Shared/schemas.json>). Không thay đổi backend/SQL hoặc tạo auth server riêng.

## Kiểm tra

```powershell
npm run check
```

Gồm lint, typecheck, test độc lập và production build. Test bao gồm CSRF rotation, strict request fields, không sửa password, lỗi và request mất response, tài khoản khóa, timeout/hủy và độ dài Unicode. Các test giả không chứng minh API/database thật hoạt động.

Kết quả bàn giao task FE-LOGIN-20261103: lint, typecheck, 21 test độc lập và build đạt. Không chạy kiểm thử API/backend/DB hoặc E2E thật theo yêu cầu chủ dự án; trạng thái `NOT_RUN_BY_OWNER_REQUEST`. Chưa kiểm tra bố cục bằng trình duyệt.

`npm audit --omit=dev` tại thời điểm khởi tạo không báo lỗ hổng dependency chạy ứng dụng; bộ công cụ dev do create-next-app cài báo 16 cảnh báo mức moderate. Chưa chạy audit fix --force hoặc đổi toolchain để xử lý các cảnh báo này.

## Trạng thái Git

Nhánh: `frontend/login-page`. Commit ký `dea968d` (`chore(frontend): initialize Next.js 16.4.4 app`) đã push trước khi hiện thực trang đăng nhập theo đúng thứ tự yêu cầu. Phần code trang đăng nhập sau đó được giữ trong working tree để review, chưa tạo commit/push lần hai. Thiết kế trong designs/ là đầu ra từ lượt trước, không nằm trong commit khởi tạo.
