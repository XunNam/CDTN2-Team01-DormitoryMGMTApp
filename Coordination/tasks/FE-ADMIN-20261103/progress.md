# FE-ADMIN-20261103 · Hiện thực luồng ADMIN

## Phạm vi và ủy quyền

- OWNER_CONFIRMED: ngày 03/11/2026, chủ dự án duyệt prototype ADMIN và yêu cầu code trong frontend, commit/push lên nhánh có sẵn frontend/admin-pages. Yêu cầu này cho phép Git ghi trong phạm vi task; không merge/triển khai.
- Phần frontend ADMIN của FE-01/FE-02; Codex thực hiện, chủ dự án review. FR-01, UC-01..06, QT-01/QT-02, TC-01.1..01.3, NFR-01; contract 1.0.0.
- Operation consumer: adminListAccounts/adminGetAccount/adminListProfileCandidates/adminCreateAccount/adminSetAccountLock, auth Shared me/csrf/login/logout/changePassword.
- Chỉ sửa frontend/** và hồ sơ task này; prototype đã duyệt tại designs/dormflow-admin và kit designs/dormflow-admin-system giữ riêng. Không sửa backend/SQL/contract.
- Nhánh ADMIN ban đầu từ main 94ded016, chưa có frontend. Dùng lại source frontend đã được chủ dự án commit trên 8560202414953cbb35859121a3b442abf4202e53 (frontend/login-page) làm nền, chỉ chép các tệp frontend không ghi đè tệp tồn tại, không merge/cherry-pick và không đổi nhánh.

## Kế hoạch trong phiên

1. Nền dùng chung: giữ login, thêm HTTP client dùng chung cookie/CSRF/abort/no-store và route /admin có kiểm tra Identity. Tra cứu account, chi tiết, filter AND và phân trang; chỉ metadata đúng DTO.
2. Cấp STUDENT/STAFF, chọn hồ sơ chưa có account; SV/BQL/ADMIN; khóa/mở xác nhận/kết quả/self-lock, lỗi 409/422/503/CSRF và xử lý kết quả request không rõ. Không replay mutation.
3. Đổi password cá nhân, CSRF rotation, đăng xuất/hết phiên/sai quyền; giữ giao diện responsive được duyệt. Nối login ADMIN sang /admin.
4. Lint/typecheck/unit với HTTP giả/build, kiểm tra giao diện phù hợp bằng response giả nếu có công cụ. Không cần dùng dữ liệu thật hoặc gọi mutation backend thật để nghiệm thu task frontend. Ghi rõ kiểm chứng nào chưa chạy.
5. Review diff, loại credentials/artifact tạm, ký commit và push không force lên frontend/admin-pages. Chỉ stage frontend và hồ sơ task, không tự stage designs.

## Checkpoint

- Repo ở frontend/admin-pages, remote đầu lượt cùng 94ded016dfadfd69d336e4e54bc5f8b0ffde1572. Có designs/ untracked từ lượt thiết kế.
- Đã đọc prototype/contract/validation/controller/router/DTO/auth Shared và xác nhận source login ở nhánh riêng.
- Đang đưa nền login vào frontend để tiếp tục; chưa gọi API/database thật.
- Đã đưa nền login từ commit 85602024, hoàn thiện consumer 5 API ADMIN và auth Shared trong frontend. Các route /admin/accounts/new, chi tiết theo namespace/UUID, lock/unlock/result, /admin/security đã có; login ADMIN chuyển /admin, reauth=1 hỗ trợ kiểm tra password khi kết quả đổi chưa rõ.
- Đã thêm SessionClient dùng chung CSRF/credentials/no-store/timeout/abort; không tự replay mutation. Cấp/mở/khóa không cập nhật thành công lạc quan; self-lock dùng response hiện tại trước khi request bảo vệ tiếp theo từ chối.
- Typecheck và 46 test độc lập đã đạt. Đã thêm 14 ca Playwright bằng route mock toàn bộ /api/v1; đang build/chạy trình duyệt, chưa nghiệm thu API/database thật.

## Kết quả bàn giao · READY_FOR_OWNER_REVIEW

- Hoàn tất 5 consumer ADMIN và auth Shared, toàn bộ luồng prototype được duyệt: tìm/lọc/phân trang, chi tiết, cấp SV/BQL/ADMIN, khóa/mở/xác nhận/kết quả/self-lock, đổi password, đăng xuất, sai quyền/hết phiên và responsive.
- `npm run check` đạt: lint không lỗi/cảnh báo, typecheck, 46 unit tests, production build. Có đầy đủ 11 route (kể cả login/root/not-found), route tham số lấy đúng namespace/UUID.
- Playwright: 14/14 đạt trên Chrome headless, API route được mock hoàn toàn và không forward backend. Đã xem screenshot desktop/mobile; trang không tràn ngang, bảng có vùng cuộn riêng. Screenshot/trace/report nằm trong frontend/test-results/ và bị ignore.
- Đã kiểm tra conflict 409 phải đọc lại trước xác nhận mới; tự khóa hiển thị response 200 trước khi protected request kế tiếp trả 401; xác thực lại sau password chưa rõ không dùng phiên cũ làm bằng chứng mật khẩu đã đúng.
- Code không có fixture/demo data hoặc import API mock trong src/. Phần khởi tạo source login lấy nguyên từ commit đã có, sau đó chỉ chỉnh tích hợp ADMIN/reauth/chung transport và tài liệu.
- Backend, SQL và API contract giữ nguyên. Kiểm chứng với API/database thật: NOT_RUN_PENDING_OWNER, không tuyên bố NFR toàn hệ thống đã đạt từ test giả.
- Commit/push do chủ dự án ủy quyền vào frontend/admin-pages sau kiểm tra; chỉ stage frontend/** và hồ sơ task này. designs/, node_modules, .next, .env local, test-results và .qa không đưa vào commit. Không force/merge/triển khai hoặc sửa cấu hình Git đã lưu.

## Tiếp tục review

Chạy `npm --prefix frontend run dev`, mở http://localhost:3000/login với backend hiện có và APP_ORIGIN khớp origin trình duyệt. Review code rồi kiểm chứng tích hợp bằng tài khoản demo được phép: tạo đủ SV/BQL/ADMIN, lookup/profile race, khóa/mở/self-lock, request tiếp theo khi bị khóa, phiên hết hạn, password rotation/logout. BQL/SV workspace và nghiệp vụ khác ngoài ADMIN chưa thuộc task này. README frontend chứa lệnh build/test và cấu hình proxy.
