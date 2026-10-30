# Kế hoạch kiểm chứng, bảo mật và bàn giao prototype

Trạng thái: **PLAN_RECONCILED**. Q-23 đã nhận hướng kiểm thử theo stack/PostgreSQL thật, Q-25..Q-27 giữ băm, đầy đủ FR-01/02 và kiểm quyền/khóa mỗi API request. Chuẩn lỗi, enum, tiền/ngày và retry theo [baseline kỹ thuật](12-SHARED-TECHNICAL-BASELINE.md). Tổ chức công cụ và test cụ thể được thiết kế khi triển khai; đợt này chưa viết/chạy test ứng dụng.

## 1. Mục tiêu và phân lớp kiểm chứng

| Lớp | Cần phát hiện | Thời điểm/đầu ra |
|---|---|---|
| Rà soát tài liệu | Thiếu FR/QT/UC, enum khác nhau, quyền vượt vai trò, field chưa có trong schema | Trước khi giao code; traceability và checklist có người review |
| Kiểm tra contract | Request/response lỗi, required/null, phân trang, mã lỗi, DTO lộ dữ liệu | Khi API contract hoàn tất; ví dụ hợp lệ/không hợp lệ cho từng operation |
| Kiểm tra DB thật | Unique/FK/check, trạng thái, transaction rollback, không vượt sức chứa | Khi tạo DDL/backend; dùng PostgreSQL cùng dòng phiên bản đã chốt |
| API integration | Auth, RBAC, ownership, luồng nghiệp vụ và lỗi đồng thời | Mỗi task backend; request thật tới API + DB thật |
| Giao diện và E2E | Ghép màn hình/API đúng trường và trạng thái; nút gửi lặp; lỗi dễ hiểu | Mỗi lát chức năng; ít nhất luồng chính của từng vai trò |
| Hiệu năng | TC-N2 theo đúng quy mô SRS | Sau khi có các API tra cứu và dữ liệu giả |
| Cài đặt sạch | TC-N3, cấu hình tái lập, seed/init không chạy phá dữ liệu | Trước nghiệm thu; người chưa dựng môi trường thực hiện theo README |

Q-01/Q-23 đã được trả lời: dùng Next.js/Express.js và PostgreSQL; chọn runner/API/E2E/load tools tương thích ở task nền tảng, ghi lệnh và lockfile chung. Mỗi API owner kiểm thử module; Anh review, tích hợp và kiểm chứng UI, có người khác rà luồng. Không đồng nhất mock thành công với API/DB đúng. Không viết test chỉ phản chiếu cấu trúc hàm; ưu tiên quy tắc, quyền và tính nhất quán.

## 2. Truy vết và bằng chứng kiểm thử

Giữ nguyên 19 test chức năng và 3 test NFR từ SRS. Bổ sung mã `TC-SEC-*`, `TC-CONC-*`, `TC-DATA-*`, `TC-UI-*` riêng. Mỗi test cần:

```text
Mã / tên:
Nguồn: FR-xx/ACxx, QT-xx, UC-xx, quyết định liên quan
Loại: MUST / SHOULD / bổ sung theo quyết định
Tiền điều kiện + dữ liệu giả + tài khoản/role:
Các bước và request nếu là API:
Kết quả HTTP/response/UI:
Kết quả DB và invariant:
Cách dọn dữ liệu/reset trong môi trường test:
Người thực hiện / ngày / môi trường / phiên bản contract:
Kết quả: NOT_RUN / PASS / FAIL / BLOCKED
Bằng chứng và mã lỗi theo dõi:
```

Không ghi PASS chỉ vì không thấy exception. Test nghiệp vụ cần kiểm tra cả trạng thái, số bản ghi và dữ liệu không được thay đổi khi thất bại.

## 3. Ma trận bảo mật bắt buộc

| Tình huống | Kết quả cần kiểm chứng |
|---|---|
| Chưa đăng nhập gọi API bảo vệ | Bị từ chối, không lộ dữ liệu |
| Sinh viên gọi API quản lý phòng/duyệt/thu phí/tài khoản | Bị từ chối ở API, dù tự sửa request hoặc ẩn/hiện nút UI |
| Sinh viên A đổi ID để xem hồ sơ/đơn/lưu trú/phiếu của B | Bị từ chối theo contract, không trả PII của B |
| Sinh viên gửi kèm studentId, role, giới tính, status, paidAt ngoài quyền | Từ chối trường lạ/trái allowlist bằng 422, không áp dụng một phần |
| Ban quản lý gọi API cấp/khóa/gán role | Bị từ chối |
| Quản trị viên gọi duyệt/nhận/trả/lập phiếu/thanh toán | Bị từ chối chỉ với role Quản trị viên |
| Tài khoản khóa đăng nhập | Bị chặn, dữ liệu sinh viên/đơn/lưu trú/phiếu còn nguyên |
| Phiên tồn tại sau khóa | Request bảo vệ kế tiếp bị 401 theo Q-27 dù trang chưa reload; không cần push logout |
| Phiên sau đổi mật khẩu hoặc cố đổi role | Thu hồi phiên khác, cấp lại phiên hiện tại theo baseline 12; không có endpoint đổi role sau tạo theo Q-07 |
| Phiên không hoạt động 30 phút | Server từ chối phiên hết hạn; test expiry phía server, không chỉ thời gian cookie; không cần chờ thật 30 phút nếu test clock/fixture chứng minh được |
| Hồ sơ SV chưa được cấp tài khoản | Không đăng nhập được chỉ vì có hồ sơ; Admin cấp sau theo QT-02/Q-26 |
| Login STUDENT/STAFF, role client giả hoặc role lạ | Chọn đúng kho account, role lấy DB; không cấp quyền theo lựa chọn UI hoặc giá trị lạ |
| Admin tự khóa, kể cả Admin hoạt động cuối | Cho phép theo Q-17, request bảo vệ sau đó bị 401; fixture khôi phục riêng, không thêm guard trái quyết định |
| Đăng xuất rồi dùng lại phiên | Hành vi theo contract phải chứng minh đã kết thúc phiên ở mức đã chốt |
| Xem DB/log/API | Mật khẩu không ở dạng rõ; hash không trả về response; không log mật khẩu/token |

Áp dụng baseline 12: 401 xác thực/khóa, 403 sai role, 404 không tồn tại hoặc ngoài ownership của SV, 409 trạng thái/trùng nghiệp vụ, 422 input. Đây là lựa chọn kỹ thuật theo ủy quyền Q-20; test không tự chọn mapping khác. Với hai kho account, kiểm tra password hash và không lộ hash ở cả hai.

## 4. Tình huống cạnh tranh và toàn vẹn dữ liệu

| Mã dự kiến | Thiết lập và thao tác cạnh tranh | Invariant sau khi cả thao tác kết thúc |
|---|---|---|
| TC-CONC-01 | Phòng còn 1 chỗ, hai BQL duyệt 2 sinh viên khác nhau đồng thời | Chỉ tối đa 1 hồ sơ mở mới; chỗ còn không âm; yêu cầu thất bại không để đơn Đã duyệt một mình |
| TC-CONC-02 | Hai request duyệt cùng đơn | Một kết quả nghiệp vụ duy nhất, không sinh 2 hồ sơ; thao tác đã hoàn thành trả 409 cho lần ghi mới |
| TC-CONC-03 | Hai request gửi đơn của cùng sinh viên | Chỉ một đơn chờ; không giữ chỗ |
| TC-CONC-04 | Duyệt phòng đồng thời giảm sức chứa/ngừng sử dụng | Mỗi kết quả đều thỏa QT-04/05/10; không có check dựa vào dữ liệu cũ rồi commit sai |
| TC-CONC-05 | Duyệt và từ chối cùng đơn | Chỉ một trạng thái kết thúc; từ chối không đồng thời sinh hồ sơ |
| TC-CONC-06 | Hai request lập phiếu cùng hồ sơ | Một phiếu duy nhất với giá snapshot; không xóa phiếu thắng |
| TC-CONC-07 | Hai request trả phòng hoặc hủy xếp cùng hồ sơ | Chỉ một lần kết thúc/giải phóng chỗ; lịch sử còn nguyên |
| TC-CONC-08 | Nhận phòng và hủy xếp cùng hồ sơ | Chỉ một chuyển trạng thái hợp lệ; không có hồ sơ Đang ở nhưng chỗ đã được trả |
| TC-CONC-09 | Lập phiếu đồng thời đổi giá phòng | Phiếu dùng một giá đã đọc/chốt nhất quán trong transaction; không bị cập nhật hồi tố |
| TC-CONC-10 | Gửi đơn đồng thời đóng kỳ | Kết quả có thứ tự nhất quán theo policy đã chốt; không lọt đơn sau điểm đóng đã xác nhận |
| TC-CONC-11 | Sửa giới tính hồ sơ/phòng đồng thời duyệt | Quy tắc tương thích tại Q-09 được giữ, không check bằng bản cũ |

Không chạy các bài cạnh tranh bằng cách chỉ gọi hai request tuần tự. Cần ghi cách tạo đồng thời và xác nhận dữ liệu cuối; dùng môi trường test có thể dựng lại. Giải pháp cụ thể có thể là khóa/constraint/transaction phù hợp, phải được review trong SQL plan.

## 5. Bộ dữ liệu giả và fixture

- Ba role SV/BQL/ADMIN, ít nhất 2 sinh viên để thử ownership; một tài khoản bị khóa và một hồ sơ chưa được cấp tài khoản. Dùng hai kho account theo baseline 12; mọi password demo được băm, nhập DB chỉ để khởi tạo theo Q-25/Q-26.
- Phòng đang sử dụng/ngừng sử dụng; phòng trống/đầy/còn đúng 1 chỗ; các nhóm giới tính tiếp nhận đã được chốt.
- Đơn chờ/duyệt/từ chối; hồ sơ ở đủ 4 trạng thái; phiếu chưa trả/đã trả.
- Hồ sơ kết thúc hoặc hủy có phiếu chưa thanh toán để chứng minh QT-16.
- Fixture chuẩn kiểm tra 6 chỗ với 2 đã xếp + 3 đang ở; fixture thống kê 2 x 6 chỗ theo TC-08.1.
- Dataset tải: **100 sinh viên và 100 phòng**, không thay bằng 100 đơn hoặc 100 record tổng cộng.
- Chỉ dữ liệu giả; ghi tài khoản demo/cách tạo an toàn trong README theo Q-06. Không đưa mật khẩu thật vào Git. Seed tách DDL; seed chạy lại không âm thầm xóa dữ liệu của thành viên khác.

## 6. Quy trình TC-N2 - hiệu năng

1. Q-23 đã nhận hướng kiểm chứng; người làm task chọn danh mục API tra cứu đại diện và cách chia 100 lượt, ghi rõ filter/role. Không mở lại tiêu chuẩn SRS.
2. Dựng môi trường có 100 sinh viên, 100 phòng; ghi cấu hình máy, phiên bản ứng dụng/DB và trạng thái cache.
3. Mô phỏng 20 người dùng đồng thời thực hiện **tổng 100 lượt**; loại trừ hay tính warm-up phải ghi riêng, không đổi tiêu chuẩn SRS.
4. Lưu số request thành công, lỗi, timeout và thời gian từng lượt. Không coi response lỗi nhanh là truy vấn nghiệp vụ đạt.
5. Đạt khi ít nhất 95/100 lượt tra cứu hợp lệ phản hồi **dưới 2 giây**, báo rõ số lượng; p95 là chỉ số bổ sung, không thay thế phép đếm này.
6. Nếu không đạt: xem query/index/pagination và lỗi trước; sau khi sửa mới chạy lại, lưu cả kết quả trước/sau.

## 7. Quy trình TC-N3 - cài đặt và demo

SRS cho phép chuẩn bị cấu hình trước khi tính số lệnh. README phải nói rõ bước đó gồm gì, tránh giấu các lệnh build/init thủ công trong mô tả.

- Chỉ yêu cầu máy kiểm chứng có Docker và Docker Compose; không cần Node.js hoặc PostgreSQL cài riêng.
- Cùng Next.js/Express.js/PostgreSQL khởi động bằng tối đa 2 lệnh theo README; câu lệnh chính thức viết ở task đóng gói sau chọn cấu trúc source. Docker đóng gói cuối dự án theo Q-01/Q-02; kiểm tra config sớm nếu nhóm chọn không thay mốc bàn giao.
- Init schema/migration tự động theo quy trình có kiểm soát; không để frontend chạy nhưng API/DB chưa sẵn sàng mà báo thành công.
- `.env.example` có tên biến và giá trị minh họa, không chứa khóa thật. Các port, đường dẫn gọi API, timezone, volume được giải thích.
- Kiểm tra restart không mất dữ liệu cần giữ; thao tác xóa/reset volume chỉ có hướng dẫn riêng cho môi trường thử, có cảnh báo tác động thực tế.
- Người kiểm chứng tạo phòng mới và duyệt một đơn sinh viên qua ứng dụng; ghi nhận trạng thái, hồ sơ mới và số chỗ.
- Hosting/domain cuối cùng chưa được Q-02 chọn; không chặn nghiệm thu Compose hoặc tự mua/triển khai dịch vụ. Không tự nâng cấp/chỉnh PostgreSQL trên máy người dùng ngoài repo để ép khớp phiên bản kế hoạch.

## 8. Kịch bản demo nghiệp vụ

1. Admin cấp tài khoản Sinh viên trên hồ sơ do BQL tạo, gán role; chứng minh không truy cập nghiệp vụ BQL.
2. BQL mở kỳ, có tòa/phòng phù hợp; sinh viên lọc phòng và gửi đơn; số chỗ chưa thay đổi.
3. BQL duyệt vào phòng nguyện vọng hoặc phòng khác hợp lệ; sinh một hồ sơ Đã xếp phòng, giữ đúng một chỗ.
4. BQL nhận phòng; chỗ còn không giảm tiếp.
5. Lập phiếu theo giá lúc lập; đổi giá phòng sau đó không đổi số tiền phiếu; thử lập trùng bị từ chối.
6. Sinh viên thấy phiếu riêng; BQL nhận đủ tiền và xác nhận, lưu người/ngày.
7. Dùng hồ sơ khác có phiếu chưa trả để trả phòng; hồ sơ kết thúc, chỗ tăng đúng một, phiếu chưa trả còn nguyên.
8. Dùng hồ sơ chưa nhận để hủy xếp; lịch sử giữ lại. Thử thao tác lần hai để chứng minh không trả chỗ lặp.
9. Nếu nhận FR-08: thống kê đúng fixture chuẩn, dữ liệu rỗng không lỗi.

## 9. Cổng rà soát trước bàn giao

### Bộ đặc tả (đầu ra đợt tiếp theo)

- Có Markdown contract cho ba role và auth chung, AGENTS từng phần, DDL PostgreSQL, quy tắc nghiệp vụ.
- Mọi field/enum/ràng buộc đều có định nghĩa thống nhất, không còn vấn đề OPEN bị dùng như đã chốt.
- Các đường dẫn/operation/constraint có trong traceability; trường bảo mật không lọt DTO.
- `schema.sql` khi được tạo phải kiểm tra trên DB sạch nếu công cụ phù hợp sẵn có; nếu chưa thể chạy, ghi rõ NOT_RUN và lý do, không khai đạt.

### Ứng dụng (chỉ khi được giao)

- 18 TC MUST chức năng + 3 NFR có kết quả; FR-08 đã được Q-22 nhận sau MUST với TC-08.1, hoãn cần quyết định mới.
- Các test cạnh tranh, quyền và giữ dữ liệu tương ứng thay đổi đều đã chạy với bằng chứng.
- Không còn lỗi chặn luồng đăng ký/duyệt/nhận/trả/thu phí hoặc lộ dữ liệu.
- Người review khác owner ký nhận checklist; chủ dự án kiểm tra và commit thủ công.

## 10. Rủi ro và cách xử lý

| Rủi ro | Dấu hiệu | Cách xử lý có chủ sở hữu |
|---|---|---|
| Các AI tự tạo mock khác nhau | UI chạy mock nhưng DB/API không map được | Owner contract review DTO/enum; test contract trước tích hợp |
| Sức chứa đếm bằng biến client | Hai thao tác chỗ cuối đều thành công | Owner DB/backend sửa transaction + test cạnh tranh |
| Mất lịch sử khi xóa/lock | Phiếu/hồ sơ biến mất sau thao tác tài khoản | Review FK/deletion và policy; test QT-02/16 |
| Seed demo khác dataset kiểm thử | Số lượng fixture sai hoặc giới tính không khớp | Version hóa fixture, ghi cách dựng lại |
| Báo NFR đạt thiếu bằng chứng | Chỉ có ảnh dashboard hoặc request đơn lẻ | Yêu cầu log điều kiện thực, số request, môi trường và kết quả |
| Mất thời gian cuối kỳ để ghép | Tuần cuối mới gọi frontend vào API thật | Tích hợp lát đơn giản ngay sau nền tảng, tăng dần mỗi mốc |
