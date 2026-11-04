# DormFlow · Frontend Sinh viên

Prototype Students đã được chủ dự án duyệt ngày 04/11/2026. Source ở nhánh `frontend/student-pages`, xuất phát từ main `595d8185`, độc lập với `frontend/management-pages` (`76072882`). Role frontend SV; 13 operation theo contract 1.0.0, Shared auth tái dùng. Không thay backend/SQL/API/schema gốc.

## Chạy và kiểm tra

Theo hướng dẫn frontend/README.md để chạy Next.js và backend Express. Đăng nhập nhóm Sinh viên, Identity STUDENT/SV chuyển đến `/student`. BACKEND_ORIGIN mặc định `http://127.0.0.1:3001`; APP_ORIGIN của backend phải trùng địa chỉ/cổng trình duyệt, proxy cùng origin `/api/v1/*`. Không sửa CSRF/Origin để né lỗi cấu hình.

```powershell
cd frontend
npm run lint
npm run typecheck
node --test --experimental-strip-types tests/*.test.ts
npm run build
npm run test:e2e
```

Giữ nguyên package.json để tránh conflict với nhánh Management đang sửa script test. Lệnh `node --test --experimental-strip-types tests/*.test.ts` chạy tất cả test độc lập hiện có, bao gồm Student và Management khi ghép hai nhánh. `npm test` của main trước task này vẫn chỉ liệt kê test Auth/Admin. Mọi response giả chỉ ở tests/e2e; app không import fixture. Font next/font/google giữ từ main, build đầu tiên cần kết nối Google Fonts. Test trình duyệt tự mở server cổng 3100, không gọi backend thật; trace/ảnh ở test-results bị ignore.

## Các trang

| Đường dẫn | Chức năng |
|---|---|
| /student | Kỳ đăng ký, đơn mới nhất, lưu trú hiện tại và số phiếu chưa thanh toán của chính SV |
| /student/rooms | Tìm mã/tòa, lọc tòa/giới tính/còn chỗ kết hợp AND; phân trang; danh mục tòa có phân trang riêng |
| /student/rooms/{id} | Thông tin phòng ACTIVE, chỗ đã phân bổ/còn trống, giá; kiểm điều kiện và dialog xác nhận gửi nguyện vọng |
| /student/applications, /{id} | Lịch sử, lọc trạng thái, pending/approved/rejected, lý do từ chối, phòng thực tế từ lưu trú |
| /student/residences, /{id} | Lịch sử ALLOCATED/CHECKED_IN/ENDED/CANCELLED, ngày/lý do, liên kết đơn/phiếu |
| /student/receipts, /{id} | UNPAID/PAID, tiền snapshot, biên nhận; giữ nợ sau kết thúc, không thanh toán online |
| /student/profile | Hồ sơ chỉ đọc và PATCH điện thoại/email; để trống thành null |
| /student/security | Đổi mật khẩu của phiên hiện tại qua Shared auth |

Các ID là UUID thật, không dùng mã minh họa DK/LT/PT trong prototype. Sinh viên không được tự hủy/sửa đơn, xếp/nhận/trả/hủy lưu trú, lập phiếu hay xác nhận tiền. Không có dữ liệu người ở cùng phòng. Gửi đơn không tạo residence hoặc giảm chỗ. Phòng thực tế có thể khác nguyện vọng.

## Kiến trúc và kiểm tra dữ liệu

- `src/lib/student/schema.ts`: sinh từ `API Endpoint/Shared/schemas.json`; query được thu hẹp đúng Student contract. Chạy `node scripts/generate-student-contracts.mjs` khi đặc tả được thay đổi. Query đơn/lưu trú/phiếu chỉ page/pageSize/status; không gửi studentId, roomId, residenceId hoặc q thừa. Query tòa chỉ phân trang, query phòng không có status. Unit đối chiếu schema nguồn.
- `src/lib/student/client.ts`: 13 consumer, decoder runtime, ownership theo Identity cho profile/application/residence, kiểm ID response, không tự replay ghi. Chọn hồ sơ/đơn luôn từ phiên, không từ field người dùng nhập.
- `components/student`: layout bảo vệ STAFF bị chặn, shell responsive, danh sách, chi tiết, dialog gửi, liên hệ, security và hooks request. Chỉ tái dùng các primitive UI thuần của Admin đã có trên main; không import bất kỳ file Management nào.
- Dữ liệu quan hệ được đọc qua endpoint Student. Phòng cũ trả 404 được ghi rõ không còn công khai, không làm mất lịch sử residence/receipt. Không nuốt 401/403/network thành dữ liệu rỗng. Khi liên kết application→residence hoặc residence→receipt, tìm trên các trang lịch sử cá nhân, không truyền filter ngoài contract hoặc giả phòng thực tế bằng nguyện vọng.
- Tiền giữ chuỗi VND đến formatter BigInt, không ép Number. Room giữ invariant allocatedPlaces+availablePlaces=capacity; dữ liệu malformed không được render như thành công. Ngày dùng Asia/Ho_Chi_Minh.

Mutation dùng cookie/CSRF transport hiện có, guard đồng bộ chống double-submit và khóa điều hướng khi gửi. Lỗi nghiệp vụ 409 hoặc CSRF phải đọc/làm mới trước thao tác mới. Mất phản hồi POST hoặc response thành công sai schema/owner/phòng/trạng thái được coi là chưa rõ kết quả, khóa gửi lại. Cho GET tìm đơn hiện tại, diễn đạt trung lập; chưa tìm thấy không kết luận rollback. Mất phản hồi cập nhật liên hệ phải GET hồ sơ rồi mới mở form lại. Không lưu dữ liệu cá nhân/token vào localStorage. Đổi mật khẩu xóa trường sau gửi, dùng token xoay mới với logout.

## Kiểm chứng và tương thích hai nhánh

Nhánh Student: lint/typecheck/build PASS; 64 unit/contract tests PASS (46 Auth/Admin + 18 Student), 29 browser tests PASS (14 Admin + 15 Student), không skip. Đã xem ảnh desktop/mobile; bảng cuộn trong vùng riêng, viewport không tràn. Ca gồm login, tìm/phân trang/rỗng, xác nhận đơn, chưa giữ chỗ, pending/active/closed/mismatch, 409/mất response, actual room khác preferred, lịch sử phòng ngừng công khai, tiền snapshot, liên hệ/null, role/session, mật khẩu/CSRF/logout.

Chỉ file chung `src/components/auth/login-page.tsx` được thêm effect SV ở vùng trước effect kiểm phiên, cách biệt các hunk redirect BQL ở Management. Không sửa package.json, README.md chung, root layout, global CSS, Shared API hoặc các file Management. File tài liệu, generator, tests và thư mục source đều có tên riêng. Không nhập commit Management vào lịch sử Student. Kết quả kiểm ghép tĩnh và bản ghép tạm được ghi ở `Coordination/tasks/frontend-student-pages/progress.md`; chỉ đánh giá với đúng các commit được nêu, không bảo đảm các thay đổi tương lai.

Frontend với backend/PostgreSQL thật: NOT_RUN_PENDING_OWNER. Mock/browser test không chứng nhận quyền/transaction/concurrency DB hoặc NFR toàn hệ thống. Khi tích hợp cần review ownership ở server, hai người gửi/duyệt chỗ cuối, đóng kỳ đồng thời, phiếu của lưu trú kết thúc và các lỗi mất phản hồi. Không merge/deploy trong task này.
