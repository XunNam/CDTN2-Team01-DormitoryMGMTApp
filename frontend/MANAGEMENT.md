# DormFlow · Frontend Management

Đầu vào: prototype đã được chủ dự án duyệt ngày 04/11/2026, wireframe Figma file `6Tab73i6wkfdEtXuhcjL7P`, contract revision 1.0.0. Nhánh: `frontend/management-pages`. Người thực hiện: Codex; người review/tích hợp: Bùi Thế Anh. Phạm vi frontend BQL, không sửa nghiệp vụ backend, SQL hoặc giao thức auth.

## Chạy và truy cập

Chạy backend theo backend/README.md, frontend theo README.md. BQL đăng nhập nhóm Nhân sự bằng tài khoản đã được cấp; Identity STAFF/BQL chuyển đến `/management`. Next.js proxy cùng origin `/api/v1/*` về BACKEND_ORIGIN (mặc định localhost:3001). APP_ORIGIN backend phải trùng địa chỉ trình duyệt. Không đưa mật khẩu/cookie vào tài liệu hoặc commit.

| Đường dẫn | Chức năng |
|---|---|
| /management | Tổng quan và các đơn đang chờ xử lý |
| /management/student-profiles | Danh sách, tìm kiếm, lọc giới tính, phân trang |
| /management/student-profiles/new | Tạo hồ sơ sinh viên trước khi Admin cấp tài khoản |
| /management/student-profiles/{id} | Hồ sơ, cập nhật, danh sách lưu trú liên quan |
| /management/buildings, /new, /{id} | Danh mục tòa, tạo, sửa tên, phòng trực thuộc |
| /management/rooms, /new, /{id} | Tìm/lọc phòng, tạo/sửa, sức chứa, danh sách lưu trú theo phòng |
| /management/applications, /{id} | Lọc đơn, chi tiết, duyệt và xếp phòng thực tế hoặc từ chối có lý do |
| /management/residences, /{id} | Lọc/lịch sử, nhận phòng, hủy xếp, trả phòng, phiếu thu liên quan |
| /management/receipts, /new, /{id} | Lập phiếu, xem giá, xác nhận thu đủ tiền, biên nhận |
| /management/registration-period | Xem và xác nhận đóng/mở kỳ |
| /management/statistics | Đúng 4 chỉ số của FR-08 |
| /management/security | Đổi mật khẩu đang đăng nhập qua Shared API |

Các `{id}` là UUID thật từ API; UI không dùng mã ngắn minh họa của prototype làm khóa. Lập phiếu từ trang lưu trú mang theo residenceId đã chọn, vẫn đọc lại giá hiện tại và tình trạng phiếu. Không chuyển phòng, cấp tài khoản, thu từng phần, thanh toán online hoặc thêm báo cáo doanh thu.

## API và ràng buộc

`src/lib/management/schema.ts` được sinh trực tiếp từ `API Endpoint/Shared/schemas.json`; types, query/body allowlist và runtime response decoder cùng nguồn revision 1.0.0. Khi đặc tả thay đổi chạy `node scripts/generate-management-contracts.mjs`. Unit test đối chiếu bản sinh với nguồn, tránh drift. `client.ts` bao phủ 6 list, 6 detail, 14 mutation, GET period và GET statistics = 28 operation. Không gửi q vào Application/Residence/Receipt query vì contract không hỗ trợ; lọc theo sinh viên/phòng bằng picker có phân trang. Tòa/phòng/hồ sơ hỗ trợ q. Bảng nhận metadata phân trang từ server. Chọn phòng duyệt lọc ACTIVE, đúng giới tính, hasAvailability=true; backend vẫn là bên quyết định cuối cùng khi cạnh tranh.

API chỉ trả khóa ngoại ở nhiều DTO; trang đọc các hồ sơ/phòng liên quan để hiển thị tên và mã dễ nhận biết. Dữ liệu được đọc theo từng trang, không tải toàn bộ danh mục để lọc tại client. Không cache dữ liệu sinh viên vào localStorage, không dùng seed hay fallback giả khi API hỏng. Không nhận API server message tùy ý làm HTML.

Mutation dùng SessionClient hiện có (cookie cùng origin, CSRF), guard đồng bộ chống gửi trùng. Navigation và form khóa khi đang ghi. Chỉ hiển thị thành công sau response đã giải mã và kiểm tra khóa/trạng thái/nội dung liên quan. Lỗi 401 hoặc sai quyền loại nội dung bảo vệ khỏi cây giao diện. Đây là bảo vệ UX; API vẫn phải kiểm role/ownership/isLocked theo Q-27.

409/CSRF và mất phản hồi có nút kiểm tra hiện trạng, không tự replay mutation. Response ghi không hợp lệ cũng được coi là chưa rõ kết quả. Với tạo mới mất response, tìm đúng mã trong danh sách qua GET, hoặc residenceId khi lập phiếu; nếu chưa tìm được vẫn khóa gửi lại, không khẳng định rollback. Với thao tác trên bản ghi đã biết, GET lại và đóng cửa sổ để xem dữ liệu mới. Kết quả tìm thấy không chứng minh thao tác của chính người dùng tạo ra nó.

Phí và số tiền luôn là chuỗi nguyên đồng, giới hạn PostgreSQL bigint, định dạng bằng BigInt, không ép Number. Nhận phòng không tự trừ chỗ; số chỗ luôn đọc API. Ngày theo Asia/Ho_Chi_Minh, kiểm ngày lịch hợp lệ, không ngày tương lai, trả phòng không trước nhận. Hủy/trả không xóa phiếu hoặc tự đánh dấu thanh toán. Không cập nhật lạc quan sức chứa hoặc số dư.

## UX và khả năng tiếp cận

Giữ Campus Modern với cùng token nền/chữ/màu/radius của login/Admin, font Manrope và Be Vietnam Pro. Sidebar xanh rừng, mục chọn xanh non, panel trắng. Màn hẹp có điều hướng xuống dòng và bảng cuộn ngang trong vùng riêng. Nhãn trường, lỗi gắn aria-describedby, focus lỗi đầu, h1 có thể nhận focus, skip link và dialog native có Escape/focus trap. Đóng dialog rồi tải lại sẽ trả focus về nút thao tác nếu còn, hoặc tiêu đề. Phiếu thanh toán hiển thị audit ID của nhân viên do API không cung cấp tên nhân sự; không tra API Admin từ BQL.

## Kiểm chứng và bàn giao

Chạy `npm run check` và `npm run test:e2e` (sau build). Kiểm thử HTTP/contract ở `tests/management-client.test.ts`; trình duyệt ở `e2e/management.spec.ts`, response giả tại `e2e/management-api.ts`. Các response giả chỉ thuộc test, không được import vào ứng dụng. Ảnh/trace trong test-results bị ignore.

Các ca gồm chuỗi duyệt → nhận → lập phiếu → thu đủ → trả; từ chối/hủy có lý do; hồ sơ/tòa/phòng; tiền vượt Number.MAX_SAFE_INTEGER; 409/mất response không replay; kỳ; tìm kiếm/rỗng; sai role/hết phiên; desktop/mobile. Tiếp tục chạy hồi quy 14 ca Admin. Kết quả cuối nằm trong checkpoint Coordination/tasks/frontend-management-pages/progress.md.

Chưa kiểm thử frontend nối backend/PostgreSQL thật trong task này: NOT_RUN_PENDING_OWNER. Khi tích hợp, review riêng sai quyền, phiếu trùng, chỗ cuối bị lấy đồng thời, giảm sức chứa và hủy/trả giải phóng đúng một chỗ. Test frontend giả không chứng nhận transaction DB hay NFR toàn hệ thống. Không merge/deploy trong task này.
