# Frontend Sinh viên

04/11/2026 — OWNER_CONFIRMED: chủ dự án duyệt prototype Students, giao hiện thực toàn bộ frontend, commit/push nhánh có sẵn frontend/student-pages; tránh conflict với Management chưa merge main. Owner/reviewer Bùi Thế Anh; thực hiện Codex. Contract 1.0.0, 13 operation SV, Shared auth tái dùng. FR-02/03/04/06/07, QT-03/05/06/07/08/16.

Baseline origin/main và origin/frontend/student-pages cùng 595d8185. Management ở 76072882, chưa merge. Không nhập commit Management vào Student. Chỉ tạo src/app/student, components/student, lib/student, script/test/docs riêng; không sửa package.json/README chung đang đổi ở Management. Tích hợp đăng nhập SV bằng effect riêng ở vị trí khác các hunk BQL. Dùng merge-tree kiểm khả năng ghép cuối phiên, không merge branch hoặc thay refs main/Management. Kiểm định cây kết hợp khi có thể, không khẳng định miễn conflict với thay đổi tương lai.

Kế hoạch: 1) schema/consumer/context và hồ sơ/tra cứu phòng; 2) gửi/theo dõi đơn, lịch sử lưu trú/phiếu; 3) lỗi/reconcile, security, responsive; 4) lint/typecheck/unit/build, browser tests, đối chiếu ghép hai nhánh; 5) commit/push đúng nhánh. Không backend/SQL/auth protocol, không dữ liệu thật, không stage designs/. Task hiện là frontend, không nhận triển khai lại 13 API backend.

Checkpoint bắt đầu: role/task và phạm vi đã rõ; working tree chỉ có designs/ untracked từ prototype. Chưa ghi PASS trước khi chạy kiểm tra.

## Đã hoàn tất source và kiểm chứng riêng nhánh

13/13 consumer SV và toàn bộ màn theo prototype đã hiện thực. Đăng ký với gate kỳ/pending/active/gender/chỗ, xác nhận nguyện vọng; không trừ chỗ khi gửi. Chi tiết approved tìm actual room qua lưu trú. Hồ sơ chỉ phone/email, tiền chuỗi snapshot, lịch sử vẫn đọc khi phòng 404, guard role/phiên và outcome không rõ phải GET. Shared security/logout dùng transport hiện có, không sửa giao thức. Không thay backend hoặc code Management.

Kiểm tra riêng Student: lint/typecheck/production build PASS; 64/64 unit/contract PASS; 29/29 browser PASS gồm 15 Student + 14 hồi quy Admin, không skip. Đã xem ảnh desktop/mobile, không tràn ngang viewport. Các lỗi selector trong test ban đầu đã được xử lý và chạy lại toàn suite. Build dùng kết nối Google Fonts hiện có; không đổi root layout. Chưa kiểm frontend với API/PostgreSQL thật: NOT_RUN_PENDING_OWNER.

Source/test/docs sẵn sàng review. Bước tiếp theo: kiểm ghép tĩnh với 76072882 và chạy bản ghép tạm ngoài nhánh, ghi kết quả; sau đó commit/push đúng frontend/student-pages theo ủy quyền của người dùng. Không merge main/Management, không stage designs/. Chi tiết chức năng/lệnh tại frontend/STUDENT.md.

## Kiểm tra tương thích Management — PASS

Ghép thử bằng merge-tree với origin/frontend/management-pages 76072882 tạo tree c60ea27401ff41776610ad4da425c00740135d52, exit 0, không conflict; file login tự ghép đúng redirect STUDENT/SV, STAFF/BQL, STAFF/ADMIN. Chỉ tạo object kiểm thử, không tạo merge commit trên nhánh và không đổi refs main/Management. Thư mục source/app/lib/components Management trong tree khớp nguyên 76072882.

Bản ghép tạm trong .qa/student-management-c60ea274: lint/typecheck/build PASS, 92/92 unit/contract PASS, 41/41 browser PASS (14 Admin + 12 Management + 15 Student), không skip. Dùng junction đến node_modules đã có; riêng next.config.ts của bản tạm khai báo Turbopack root là repository để resolver đọc junction ngoài thư mục copy. Cấu hình nguồn hai nhánh giữ nguyên. Mọi business source/test trong bản ghép lấy từ Git tree, không sửa để né test. Không đưa .qa hoặc designs vào commit.

Trạng thái cuối: READY_FOR_OWNER_REVIEW cho frontend Student. Chưa kiểm frontend nối API/PostgreSQL thật: NOT_RUN_PENDING_OWNER. Các bằng chứng tương thích áp dụng cho main 595d8185 và Management 76072882 hiện tại; không bảo đảm thay đổi tương lai. Đã được người dùng ủy quyền commit/push riêng Student; không merge/deploy. Bước review tiếp theo là chủ dự án tích hợp hai PR và kiểm thử backend thật.
