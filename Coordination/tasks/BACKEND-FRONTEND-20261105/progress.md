# BACKEND-FRONTEND-20261105 — kiểm chứng tích hợp

Nguồn: chủ dự án yêu cầu kiểm tra toàn bộ API giữa frontend/backend; cho phép tạo nhánh từ main, fetch/pull, sửa, commit và push riêng nhánh config/backend-frontend. Không merge/deploy.

Phạm vi Shared/integration: 51 operation theo contract revision 1.0.0 (Shared 5, ADMIN 5, BQL 28, SV 13), test harness, npm scripts và tài liệu chạy. Người thực hiện: Codex theo yêu cầu chủ dự án; người review: chủ dự án. Không đổi nghiệp vụ/quyền/schema. Bao phủ FR-01/02 và luồng đăng ký, xét duyệt, lưu trú, thu phí hiện có.

Kế hoạch: (1) đối chiếu main và tạo/push/fetch/pull nhánh; (2) cài dependency và kiểm DB; (3) chạy 51 API qua Next.js thật, kiểm session/CSRF/ownership/concurrency và đăng nhập Chrome; (4) hồi quy/build, báo cáo, commit/push nhánh.

Baseline main: 872d1b817da5b9ce0ce79248092ef960daa96883. Branch đã tạo/push/fetch/pull trước khi sửa. designs/ có sẵn được giữ riêng. next dev tự sinh frontend/AGENTS.md; không đưa file sinh tự động này vào commit.

Kết quả: backend build + 100 unit PASS; PostgreSQL integration 27/27 PASS; backend system 2/2 PASS; 51/51 API thành công qua Next.js proxy thật; Chrome đăng nhập và tải trang bảo vệ ADMIN/BQL/SV PASS. Frontend lint/typecheck/build PASS; browser regression 41/41 PASS (API giả, ghi riêng). Đã bổ sung student-client.test.ts vào npm test để kiểm đủ consumer SV khi chạy check chung.

Môi trường: Node 24.18.0, npm 12.1.0 (khác chuẩn nhóm npm 11), PostgreSQL 18.6. npm ci theo lockfile, không nâng dependency. Dùng schema codex_review_* đã có trong .env.test; không ghi public, không lưu secret/cookie/hash trong báo cáo. Bằng chứng và hướng dẫn: ../../reports/2026-11-05-backend-frontend-integration.md.

Giới hạn: 51 API được kiểm qua HTTP proxy với payload/status thật và DTO; không đồng nghĩa từng form GUI đã chạy đầu cuối với DB thật. Chrome kiểm login, redirect, tải trang và cookie của ba role. Không chứng nhận production/HTTPS/Docker/NFR-03. Một lần browser smoke thất bại do tên heading SV mong đợi sai; đã sửa selector theo giao diện thực tế và chạy lại đạt.

Kiểm tra cuối: npm test frontend sau khi bổ sung Student đạt 92/92. npm test:e2e đạt 41/41. Thay đổi sẵn sàng commit/push nhánh được giao; chủ dự án review trước merge.

## Bổ sung theo yêu cầu hash length 64 byte

Chủ dự án giao đổi Argon2id hashLength từ 32 lên 64 byte và commit/push tiếp cùng nhánh. Phạm vi: service ADMIN cấp mọi loại tài khoản, Shared đổi mật khẩu/dummy hash, bootstrap ADMIN và công cụ chuẩn bị DB test. Giữ thông số memory/time/parallelism và khả năng verify hash cũ. Cập nhật contract và baseline theo nguồn OWNER_CONFIRMED; không sửa public hay mật khẩu đang lưu.

Đã thêm kiểm tra digest decode đủ 64 byte cho tài khoản SV/BQL/ADMIN và đổi mật khẩu; fixture 32 byte được giữ rõ ràng để kiểm tương thích đăng nhập. Test bootstrap mới dùng namespace codex_review_bootstrap_* riêng, kiểm hash 64 byte và từ chối ghi đè staff. Backend build/100 unit và PostgreSQL 28 integration PASS; kiểm lại 51/51 API qua frontend thật và Chrome login cả ba role PASS. Sẵn sàng commit/push bổ sung cùng nhánh.
