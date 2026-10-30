# Cơ sở yêu cầu từ SRS_v2.pdf

Trạng thái: phần tóm tắt yêu cầu dưới đây là `SRS_CONFIRMED`; đây là bản ghi điều có trong SRS, không phải danh sách câu hỏi vẫn chưa được trả lời. Quyết định hiện hành sau Q-01..Q-27 xem [sổ quyết định](10-DECISIONS-AND-HANDOFF.md), [kết quả rà soát](11-ANSWER-REVIEW.md) và [chuẩn kỹ thuật](12-SHARED-TECHNICAL-BASELINE.md). Bản PDF giữ nguyên để đối chiếu.

## 1. Nguồn và tính toàn vẹn

- Bản dùng trong repo: [Source/SRS_v2.pdf](Source/SRS_v2.pdf), 21 trang, 682.279 byte.
- SHA-256: `14f09bfa0ace45f07694b5fa4209a92cce1c1a7109c0918c085a5b44ca419d69`.
- Hai bản đã đối chiếu: `C:\Users\buith\OneDrive\Van Lang University\Chuyên đề tốt nghiệp 2\SRS_v2.pdf` và `C:\Users\buith\OneDrive\Tài liệu\ChatGPT\Chuyên đề tốt nghiệp 2\BT-Tuan\T05\SRS_v2.pdf`. Hai bản giống nhau theo hash.
- Đã đọc nội dung 21 trang; đối chiếu trực quan sơ đồ UC trang 18 và bảng trạng thái/quy tắc trang 20-21. Số trang dưới đây là trang PDF, trùng nhãn trang in trong tài liệu.
- Không chỉnh PDF để phản ánh quyết định mới. Thay đổi phải nằm trong decision log và tài liệu có phiên bản.

## 2. Mục tiêu, vai trò và phạm vi

Ứng dụng web phục vụ xuyên suốt đăng ký lưu trú → xét duyệt/xếp phòng → nhận phòng → lập phiếu/ghi nhận thanh toán → trả phòng. Thu phí có thể thực hiện ở giai đoạn đã xếp phòng hoặc đang ở; không bắt buộc phải sau nhận phòng (QT-14).

| Vai trò | Được làm | Giới hạn đã xác định |
|---|---|---|
| Sinh viên | Đăng nhập/đăng xuất/đổi mật khẩu; xem hồ sơ riêng, sửa liên hệ; xem/lọc phòng; gửi và theo dõi đơn; xem khoản phí riêng; tra cứu thông tin lưu trú của mình ở mức mô tả phạm vi | Không tự đăng ký tài khoản, hủy đơn, sửa giới tính, xếp phòng, xác nhận thanh toán hoặc xem dữ liệu riêng của sinh viên khác |
| Ban quản lý ký túc xá | Hồ sơ sinh viên; tòa nhà/phòng; kỳ đăng ký; xét duyệt/xếp phòng; nhận/hủy xếp/trả phòng; lịch sử; lập phiếu và xác nhận đủ tiền; thống kê SHOULD | Không cấp/khóa tài khoản, không quản lý phân quyền; không vượt sức chứa hoặc bỏ kiểm tra giới tính/trùng hồ sơ |
| Quản trị viên hệ thống | Cấp tài khoản theo 3 vai trò; gán vai trò; khóa/mở khóa | Quyền quản trị tài khoản không bao gồm quyền nghiệp vụ Ban quản lý |

Các thao tác dùng chung của ba vai trò không tạo thành một vai trò thứ tư. UC-19 là kiểm tra điều kiện của hệ thống, không suy ra cần API công khai riêng.

## 3. Truy vết chức năng và tiêu chí chấp nhận

Mã AC gắn với FR, ví dụ `FR-05/AC02`; không dùng `AC02` trần vì nhiều FR trùng số AC. Test case theo bảng SRS trang 17.

| FR | Ưu tiên | UC | QT được liệt kê tại FR | Trang | TC |
|---|---|---|---|---|---|
| FR-01 Tài khoản/quyền | MUST | 01-06 | 01, 02 | 8 | TC-01.1 đến TC-01.3 |
| FR-02 Hồ sơ sinh viên | MUST | 07-10 | 02, 03 | 9 | TC-02.1, TC-02.2 |
| FR-03 Tòa nhà/phòng/tra cứu | MUST | 11-13 | 04, 05 | 9-10 | TC-03.1 đến TC-03.3 |
| FR-04 Đăng ký lưu trú | MUST | 14-16 | 06, 07, 08 | 10-11 | TC-04.1, TC-04.2 |
| FR-05 Xét duyệt/xếp phòng | MUST | 17-19 | 05, 08, 09, 10 | 11 | TC-05.1 đến TC-05.3 |
| FR-06 Quá trình lưu trú | MUST | 20-23 | 11, 12, 13, 16 | 12 | TC-06.1 đến TC-06.3 |
| FR-07 Phiếu thu/thanh toán | MUST | 24-26 | 14, 15, 16 | 13 | TC-07.1, TC-07.2 |
| FR-08 Thống kê | SHOULD | 27 | 17 | 13-14 | TC-08.1 |

Các ràng buộc ở nội dung AC có thể rộng hơn cột QT của FR: ví dụ FR-04/AC02 cũng yêu cầu từ chối gửi đơn khi đã có hồ sơ lưu trú chưa kết thúc. Không chỉ triển khai theo bảng liên kết QT mà bỏ nội dung AC.

| Test gốc | Kết quả phải bảo toàn khi viết đặc tả/test |
|---|---|
| TC-01.1 | Admin cấp tài khoản, một trong 3 vai trò; đăng nhập đúng thành công, truy cập ngoài quyền bị từ chối |
| TC-01.2 | Khóa chặn đăng nhập; mở khóa cho đăng nhập lại; không mất dữ liệu liên quan |
| TC-01.3 | Đổi mật khẩu bằng mật khẩu hiện tại đúng; đăng xuất kết thúc phiên; mật khẩu cũ không đăng nhập được |
| TC-02.1 | Tạo hồ sơ mã mới, tìm theo mã/tên được; mã sinh viên trùng bị từ chối |
| TC-02.2 | Sinh viên sửa điện thoại/email riêng; trường khác không đổi; không xem/sửa hồ sơ người khác |
| TC-03.1 | Phòng 6 chỗ, 2 đã xếp + 3 đang ở thì còn 1 chỗ |
| TC-03.2 | Có 5 chỗ đã phân bổ thì không giảm sức chứa xuống 4 hoặc ngừng sử dụng |
| TC-03.3 | Bộ lọc tòa/giới tính/còn chỗ kết hợp đồng thời; chỉ hiện phòng đang sử dụng |
| TC-04.1 | Đang mở kỳ, không đơn chờ/không hồ sơ mở, phòng phù hợp còn chỗ: tạo đơn Chờ duyệt, chưa giảm chỗ |
| TC-04.2 | Kỳ đóng hoặc có đơn chờ hoặc có hồ sơ mở: không tạo đơn, giữ nguyên dữ liệu |
| TC-05.1 | Duyệt/xếp thành công: đơn Đã duyệt + hồ sơ Đã xếp phòng + giảm 1 chỗ |
| TC-05.2 | Hết chỗ, cạnh tranh chỗ cuối, sai giới tính, phòng dừng hoặc hồ sơ trùng: không tạo hồ sơ/giảm chỗ |
| TC-05.3 | Từ chối đơn chờ có lý do; không tạo hồ sơ hoặc giữ chỗ |
| TC-06.1 | Nhận phòng chỉ từ Đã xếp phòng → Đang ở; lưu ngày nhận, không giảm chỗ thêm |
| TC-06.2 | Hủy xếp vì không đến nhận: Đã xếp phòng → Đã hủy; hoàn lại 1 chỗ, giữ lịch sử |
| TC-06.3 | Trả phòng Đang ở → Đã kết thúc; lưu ngày trả, tăng 1 chỗ; giữ phiếu chưa thanh toán |
| TC-07.1 | Lập phiếu cho Đã xếp phòng/Đang ở với giá tại lúc lập; chặn phiếu thứ hai cùng hồ sơ |
| TC-07.2 | Xác nhận đủ tiền: Chưa thanh toán → Đã thanh toán; lưu ngày/người xác nhận; sinh viên thấy kết quả |
| TC-08.1 | 2 phòng x 6 chỗ, 2 đã xếp + 3 đang ở, 2 phiếu chưa trả: kết quả 2 phòng/7 chỗ/3 người/2 phiếu; dữ liệu rỗng → 0 |

SRS có **19 TC chức năng** (18 MUST và 1 SHOULD), cộng 3 TC phi chức năng. Các test bổ sung sau này dùng mã riêng, không đổi tên test gốc.

## 4. Dữ liệu tối thiểu đã có

| Đối tượng | Dữ liệu/điều kiện được nêu | Chưa được SRS chốt |
|---|---|---|
| Tài khoản | Vai trò, trạng thái hoạt động/khóa, mật khẩu băm; tài khoản sinh viên gắn một hồ sơ có trước | Tên đăng nhập, thuật toán băm/cơ chế phiên, reset mật khẩu, xử lý đổi vai trò |
| Sinh viên | Mã duy nhất, họ tên, giới tính, lớp/khoa, điện thoại, email | Bắt buộc/null chi tiết, độ dài, định dạng, danh mục lớp/khoa, dữ liệu bổ sung |
| Tòa nhà/phòng | Mã phòng, tòa, sức chứa, giới tính tiếp nhận, phí theo kỳ, trạng thái; chỗ còn tính từ hồ sơ mở | Mã phòng duy nhất toàn hệ thống hay trong tòa, quy tắc đổi mã/giới tính, fee bằng 0 |
| Kỳ đăng ký | Hệ thống xử lý một kỳ; mở/đóng bởi Ban quản lý | Một bản ghi suốt prototype hay có lưu lịch sử kỳ đóng; đóng kỳ có chặn duyệt đơn chờ không |
| Đơn | Sinh viên, một phòng nguyện vọng, trạng thái, lý do từ chối | Trường lý do đăng ký/ghi chú có cần không; cho gửi lại trong cùng kỳ sau kết thúc thế nào |
| Hồ sơ lưu trú | Gắn sinh viên/phòng, sinh từ đơn duyệt; trạng thái, ngày nhận/trả, giữ lịch sử | Chính xác ngày hay timestamp, sửa ngày, lý do hủy bắt buộc, sinh viên xem mức nào |
| Phiếu thu | Một phiếu/hồ sơ; tiền snapshot lúc lập; trạng thái; ngày/người xác nhận đủ tiền | Mã phiếu, hạn thanh toán, ghi chú, phương thức thu; không mặc định thêm những trường này |

## 5. Trạng thái nghiệp vụ gốc

| Đối tượng | Trạng thái/chuyển đổi hợp lệ |
|---|---|
| Đơn | Chờ duyệt → Đã duyệt hoặc Bị từ chối |
| Hồ sơ lưu trú | Đã xếp phòng → Đang ở → Đã kết thúc; Đã xếp phòng → Đã hủy |
| Phiếu thu | Chưa thanh toán → Đã thanh toán |
| Tài khoản | Hoạt động ↔ Bị khóa |
| Phòng | Đang sử dụng ↔ Ngừng sử dụng theo điều kiện QT-04 |
| Kỳ | Đang mở ↔ Đã đóng do Ban quản lý |

Không tự thêm trạng thái đơn "Đã hủy", "Đã nhận phòng" cho đơn hoặc "Chờ thanh toán" cho hồ sơ. Chuỗi enum tiếng Anh ở bước đặc tả cần được chốt một lần, không lấy từ framework riêng của từng người.

## 6. Yêu cầu phi chức năng

| Mã | Chuẩn nghiệm thu từ SRS | Trang |
|---|---|---|
| NFR-01 / TC-N1 | Xác thực/phân quyền tại API; sinh viên chỉ dữ liệu riêng; không lưu mật khẩu dạng rõ; thử chưa đăng nhập, sai role, dữ liệu sinh viên khác | 15 |
| NFR-02 / TC-N2 | 100 sinh viên + 100 phòng, 20 người dùng đồng thời, tổng 100 lượt gọi API tra cứu; ít nhất 95 lượt dưới 2 giây | 15 |
| NFR-03 / TC-N3 | Máy có Docker/Compose; sau tải source và chuẩn bị cấu hình theo README, frontend+API+DB chạy trong tối đa 2 lệnh; không cần cài Node/PostgreSQL riêng; thử tạo phòng và duyệt đơn | 16 |

## 7. Ngoài phạm vi

Theo trang 5: thanh toán trực tuyến/ngân hàng/đối soát, điện nước, chia phí ngày, trả nhiều đợt/hoàn tiền, nhiều ký túc xá hoặc nhiều kỳ mở đồng thời, chuyển phòng/gia hạn/xếp tự động nhiều tiêu chí, sinh viên hủy đơn, sửa chữa phòng, hợp đồng/chữ ký/hóa đơn điện tử, khách/điểm danh/camera/IoT, mobile riêng/chat/SMS/email, tích hợp hệ thống sinh viên nhà trường.

## 8. Quy định bổ sung trong prompt ban đầu

`OWNER_CONFIRMED` theo yêu cầu ngày 30/10/2026:

1. Dùng PostgreSQL; sau khi chốt cần có `SQL/schema.sql` chi tiết.
2. Tài liệu API Markdown theo 3 vai trò và AGENTS để nhiều người/AI cộng tác.
3. Quy tắc nghiệp vụ đặt ở `Business Rules/`.
4. Toàn bộ đầu ra trong repo được chỉ định; không tự commit.
5. Đợt hiện tại chỉ lập kế hoạch và file câu hỏi; đợi chủ dự án trả lời và prompt tiếp theo mới thực hiện.

Mục 5 mô tả phạm vi đợt đầu, được kế thừa bằng giai đoạn hoàn thiện kế hoạch theo prompt mới; không phải yêu cầu tiếp tục chờ 24 câu hỏi đã được trả lời.

## 9. Cập nhật sau rà soát câu trả lời

- Q-25 giữ mật khẩu băm; Q-26 giữ đầy đủ FR-01/02 và QT-02, nhập DB chỉ để demo; Q-27 giữ kiểm role/ownership/khóa tại mỗi request API. Không loại các UC/TC gốc tương ứng.
- Next.js frontend, Express.js backend, PostgreSQL được chốt; số phiên bản/chuẩn kỹ thuật cụ thể có nguồn lựa chọn ở file 12.
- Role máy là SV/BQL/ADMIN, gán khi tạo rồi bất biến. Tự khóa Admin được phép; không thêm guard Admin cuối. Hồ sơ SV có trước tài khoản và không tự có quyền đăng nhập.
- Bổ sung ngày sinh, địa chỉ thường trú theo Q-18; không thay dữ liệu tối thiểu SRS. Thuật ngữ "chưa được SRS chốt" ở mục 4 chỉ nói nguồn PDF không có chi tiết đó; những quyết định mới đã được ghi ở file 10/12.
- Q-22 nhận FR-08 đúng bốn chỉ số sau MUST; mức ưu tiên SRS vẫn là SHOULD, không tự chuyển thành MUST hoặc lặng lẽ hoãn.
- Thành viên, hướng phân công, lịch thật và bàn giao module nằm ở 06/08, thay cho nhãn P1-P4/lịch tham chiếu của bản đầu.
