# Báo cáo kiểm thử và tinh chỉnh sản phẩm – Buổi 8

**Trường Đại học Văn Lang – Khoa Công nghệ thông tin**
**Học phần:** Chuyên đề tốt nghiệp 2 (mã 261_71ITGR40303_01)
**Đề tài:** VLU – DormFlow: hệ thống web quản lý đăng ký lưu trú, phòng ở và thu phí ký túc xá
**GVHD:** ThS. Hà Đồng Hưng *(cần xác nhận lại: slide Buổi 8 ghi giảng viên giảng dạy là ThS. Nguyễn Văn Trung)*
**Ngày thực hiện kiểm thử:** 20/11/2026

**Nhóm 1**

| STT | Họ và tên | MSSV |
|---|---|---|
| 1 | Trần Tuấn Kiệt | 2374802010263 |
| 2 | Trần Quốc Vương | 2374802010577 |
| 3 | Nguyễn Đỗ Tuấn Kiệt | 2374802010260 |
| 4 | Bùi Thế Anh | 2374802010009 |

## 1. Môi trường kiểm thử

- Mã nguồn: kho GitHub XunNam/CDTN2-Team01-DormitoryMGMTApp, commit `09d2093` (14/11/2026).
- Môi trường chạy: máy chủ đám mây, Node.js 26.13.1, npm 11.21.3, PostgreSQL **16.15** (dự án nhắm tới PostgreSQL 18.6).
- Build, unit test, lint, typecheck, integration và system test chạy trên bản clone không sửa đổi.
- Build frontend, E2E Playwright và test frontend–backend thật chạy trên một bản sao đã bỏ `next/font/google`, vì môi trường kiểm thử không truy cập được Google Fonts. Không có thay đổi nghiệp vụ nào.
- Schema: `schema.sql` và các SQL invariant áp dụng thành công trên PostgreSQL 16 (`schemaIntegrity: PASS`). Lệnh `db:verify` trả mã lỗi vì so khớp với schema `public` đang rỗng, không phải lỗi schema.

## 2. Kết quả chạy các bộ test

| Bộ test | Lệnh | Kết quả | Dữ liệu |
|---|---|---|---|
| Backend build + unit | `npm run check` | 101/101 đạt | Mô phỏng |
| Frontend lint, typecheck | `npm run lint`; `npm run typecheck` | Đạt | – |
| Frontend unit | `npm test` | 93/93 đạt | Mô phỏng |
| Backend integration | `npm run test:integration` | 28/28 đạt | PostgreSQL thật |
| Backend system (xuyên 3 vai trò + hiệu năng) | `npm run test:system` | 2/2 đạt | PostgreSQL thật |
| Frontend → Next.js → Express → PostgreSQL | `npm run test:frontend` | Lần 1 lỗi; lần 2 (schema mới) đạt: 51/51 API, đăng nhập Chrome cả 3 vai trò | PostgreSQL thật |
| E2E Playwright | `npm run test:e2e` | 41/41 đạt | API giả (không thay cho DB thật) |
| Frontend build | `npm run build` | Bản gốc lỗi (không tải được Google Fonts); bản sao bỏ font đạt | – |

## 3. Test case luồng chính

Gồm 9 test case, trong đó 6 ca là trường hợp lỗi hoặc dữ liệu sai. Tất cả chạy trên PostgreSQL thật.

| Mã | Nguồn | Bước / dữ liệu | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|
| TC-01.1 | FR-01 | Admin cấp tài khoản sinh viên và nhân sự (BQL, ADMIN) | Tạo thành công, mật khẩu băm Argon2id, response không lộ hash | ĐẠT |
| TC-01.1-N | FR-01 | BQL gọi API cấp tài khoản; Admin đã bị khóa gọi API; thiếu CSRF | 403 / 401 / 403, không ghi dữ liệu | ĐẠT |
| TC-01.1-N2 | FR-01 | Hai Admin cấp cùng hồ sơ cùng lúc; trùng username đồng thời | Một 201 và một 409 (`DUPLICATE_USERNAME`) | ĐẠT |
| TC-01.2 | FR-01 | Khóa tài khoản BQL đang đăng nhập rồi mở khóa | Request kế tiếp bị chặn; mở khóa dùng lại được; dữ liệu sinh viên giữ nguyên | ĐẠT |
| TC-02.2 | FR-02 | Sinh viên sửa điện thoại/email; gửi kèm trường không cho phép | Chỉ đổi 2 trường; trường lạ bị 422 | ĐẠT |
| TC-04.1/04.2 | FR-04 | Gửi đơn hai lần cùng lúc cho một sinh viên | Một 201, một 409 `PENDING_APPLICATION_EXISTS`; chưa giữ chỗ | ĐẠT |
| TC-05.2 | FR-05 | Hai đơn cùng duyệt vào phòng còn 1 chỗ | Một 200, một 409 `ROOM_FULL` | ĐẠT |
| TC-06.x | FR-06 | Nhận phòng; nhận phòng lần hai; trả phòng ngày quá khứ; trả phòng hai lần | Nhận phòng không trừ thêm chỗ; ngày quá khứ 422; lần hai 409 `INVALID_STATE`; trả phòng tăng đúng 1 chỗ | ĐẠT |
| TC-07.1/07.2 | FR-07 | Lập phiếu hai lần cùng lúc; đổi giá phòng sau khi lập; thanh toán hai lần | Một 201, một 409 `RECEIPT_ALREADY_EXISTS`; số tiền phiếu giữ giá lúc lập; thanh toán lần hai 409 | ĐẠT |

**Các ca chỉ có bằng chứng gián tiếp (chưa đối chiếu từng assertion):** TC-03.1, TC-03.2, TC-03.3 và TC-05.1 đi qua luồng 51 API; việc sửa phòng khi còn người ở (`ROOM_OCCUPIED`, `GENDER_MISMATCH`) có assert trong `backendFlow.test.ts`. TC-05.3 (từ chối đơn có lý do) có trong luồng hệ thống. TC-08.1 (thống kê) được so với truy vấn SQL trực tiếp; chưa đối chiếu fixture chuẩn "2 phòng × 6 chỗ".

File test tham chiếu: `backend/tests/integration/admin/*`, `backend/tests/integration/shared/*`, `backend/tests/integration/student/studentLifecycle.test.ts`, `backend/tests/system/backendFlow.test.ts`.

Ngoài ra, E2E (API giả) đã kiểm các tình huống kỳ đăng ký đóng, sai giới tính, phòng đầy, mất response và phiên hết hạn. Đây là bằng chứng cho giao diện, không thay cho kiểm thử với cơ sở dữ liệu thật.

## 4. Yêu cầu phi chức năng

| Mã | Kết quả | Chi tiết |
|---|---|---|
| NFR-01 / TC-N1 | ĐẠT | Gọi API khi chưa đăng nhập, sai vai trò, tài khoản bị khóa và đọc dữ liệu của sinh viên khác đều bị từ chối (401/403/404); mật khẩu lưu dạng Argon2id. |
| NFR-02 / TC-N2 | ĐẠT | 100 sinh viên + 100 phòng, 20 người dùng đăng nhập khác nhau, 100 lượt tra cứu: **100/100 lượt dưới 2 giây**; p95 = 89 ms; max = 90 ms. Đo cục bộ qua loopback. |
| NFR-03 / TC-N3 | CHƯA CHẠY | Repo chưa có Dockerfile hay file compose nên không kiểm tra được. Không tính là đạt. |

## 5. Bug log

| # | Mô tả | Mức độ | Nguyên nhân | Đề xuất | Trạng thái |
|---|---|---|---|---|---|
| B1 | Chưa có Docker/Compose, TC-N3 không chạy được | Cao (khi nghiệm thu) | Tính năng chưa làm, không phải lỗi mã | Viết Dockerfile cho backend, frontend và compose cùng PostgreSQL; README tối đa 2 lệnh | Mở |
| B2 | `test:frontend` lỗi một lần ngay sau khi Next.js dev khởi động (`other side closed`, cổng 3200); chạy lại đạt | Thấp | Chưa xác định (chưa lưu log Next.js) | Chạy lại nhiều lần, lưu log Next.js, cân nhắc tăng thời gian chờ khởi động | Mở |
| B3 | `next build` phụ thuộc Google Fonts lúc build, lỗi khi không có mạng | Thấp – Trung bình | Dùng `next/font/google` | Chuyển sang `next/font/local` (cũng cần cho build Docker offline) | Mở |

Không phát hiện lỗi nghiệp vụ nào ở mức độ cao.

## 6. Lỗi đã sửa và chạy lại

Lần kiểm thử này không sửa mã nguồn vì không có lỗi nghiệp vụ mức cao. Test frontend–backend thật (`test:frontend`) đã được chạy lại trên schema mới và đạt. B1–B3 giao cho nhóm xử lý theo bảng trên; sau khi sửa cần chạy lại toàn bộ `npm run check`, test integration, system và E2E.

## 7. Hạn chế đã biết

- Chưa có Docker/Compose nên chưa kiểm tra NFR-03.
- E2E 41/41 dùng API giả; với cơ sở dữ liệu thật, giao diện mới được kiểm ở phần đăng nhập 3 vai trò và 51 API qua proxy, chưa kiểm từng biểu mẫu.
- Kiểm thử chạy trên PostgreSQL 16.15, dự án nhắm tới 18.6.
- Có một lần `test:frontend` lỗi chưa rõ nguyên nhân (B2).
- Hiệu năng đo cục bộ qua loopback, chưa đo trên môi trường triển khai thật.

## 8. So sánh với báo cáo ngày 05/11/2026

| Hạng mục | 05/11 | 20/11 |
|---|---|---|
| Backend unit | 100 | 101 |
| Integration | 27/27 | 28/28 |
| Frontend unit | 92 | 93 |
| E2E | 41/41 | 41/41 |
| API qua Next.js thật | 51/51 | 51/51 |

Không có hạng mục nào giảm so với báo cáo trước.

## 9. Nhật ký thực hiện đề tài – Buổi 8

- Đọc yêu cầu Buổi 8, dựng môi trường kiểm thử (Node 26, PostgreSQL), chạy toàn bộ unit, integration, system và E2E.
- Kết quả: 101 unit backend, 28 integration, 2 system và 41 E2E đều đạt; NFR-02 đạt 100/100 lượt dưới 2 giây.
- Phát hiện 3 vấn đề (B1–B3), chưa có lỗi nghiệp vụ mức cao; đã ghi vào danh sách hạn chế.
- Điều bất ngờ so với buổi 7: vấn đề nằm ở phần đóng gói (Docker, font) chứ không phải logic nghiệp vụ. Hạn chế nêu thẳng trong báo cáo: chưa có Docker/Compose.

> Ghi chú: trước khi nộp, nên chạy lại bộ test trên máy của Bùi Thế Anh với PostgreSQL 18.6 để số liệu khớp môi trường dự án.
