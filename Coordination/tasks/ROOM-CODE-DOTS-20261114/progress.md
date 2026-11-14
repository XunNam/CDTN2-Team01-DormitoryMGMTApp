# ROOM-CODE-DOTS-20261114

Người thực hiện: Codex. Người rà soát: Bùi Thế Anh. Nguồn: yêu cầu chủ dự án ngày 14/11/2026, FR-03. Phạm vi: mã phòng trong managementCreateRoom, Shared Room/RoomCreate, consumer frontend và SQL. Chủ dự án cho phép tạo nhánh, commit local, không push.

Kế hoạch: sửa dấu chấm xuyên API/frontend/SQL, kiểm thử và commit riêng task này, sau đó tạo 50 phòng qua API BQL. Task thực hiện trong một phiên. Thay đổi Node 26 có trước được giữ ngoài commit.

Đã tạo nhánh local codex/room-code-dots. Không có nhánh GitHub remote vì không push. Mã phòng chấp nhận dấu chấm sau ký tự đầu, tối đa 32 ký tự, giữ trim/uppercase. Mã sinh viên và tòa vẫn giữ regex cũ. Contract canonical, OpenAPI, schema frontend BQL/SV và dictionary đã đồng bộ.

Backend build và 101/101 unit PASS. Frontend lint/typecheck, 93/93 unit và production build PASS. PostgreSQL thật: migration CHECK đã áp, db:verify PASS với snapshot mới. Fixture transaction kiểm mã I.01.01 và duplicate cùng tòa PASS, rollback dữ liệu test. Các lần fixture đầu bị guard advisory lock và chữ thường mã tòa chặn, đã sửa fixture, không nới quy tắc ứng dụng. Chưa chạy lại toàn bộ integration/system/browser suite. Chi tiết giới hạn migration tại SQL/migrations/0001_room_code_dots.md.

Tạo phòng đã hoàn tất sau commit code `c1a4a71`: đăng nhập BQL qua CSRF/session của ứng dụng, tra cứu đúng tòa I, kiểm tra trùng trước ghi, POST tạo 50 phòng rồi GET xác minh lại đủ 50 phòng. Tầng 1/3/5 FEMALE, 2/4 MALE. Chọn ngẫu nhiên capacity 4 hoặc 6 bằng crypto.randomInt. Phí theo người/kỳ: 4 người = 3000000 VND, 6 người = 3500000 VND. Trạng thái ACTIVE. Mã I.01.01 tới I.05.10. Đã logout phiên BQL sau xác minh. Không ghi trực tiếp SQL để tạo phòng.

| Tầng | Giới tính | Phòng 4 người | Phòng 6 người |
|---|---|---|---|
| 1 | Nữ | 7 | 3 |
| 2 | Nam | 4 | 6 |
| 3 | Nữ | 5 | 5 |
| 4 | Nam | 3 | 7 |
| 5 | Nữ | 5 | 5 |

Tổng 24 phòng 4 người và 26 phòng 6 người. Kết quả local chi tiết tại .qa/tower-i-room-result.json. Không lưu mật khẩu/token trong biên bản. Không push hoặc tạo nhánh remote GitHub. Thay đổi Node 26 có trước vẫn chưa commit và được giữ nguyên.
