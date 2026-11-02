# Kiểm thử PostgreSQL

Test role nằm trong admin/, management/, student/ tùy nhánh; Shared nằm trong shared/. Không chạy DB test trong unit. Dùng npm run test:integration theo [backend README](../../README.md), với .env.test trỏ DB test hoặc schema codex_review_* riêng, không fallback public. Runner chạy file nối tiếp; ca race chủ động tạo request đồng thời.

Fixtures dùng dữ liệu giả, giữ lịch sử theo trigger và không DROP/TRUNCATE/tắt constraint. Test Shared dùng session PostgreSQL và login HTTP thật; test ADMIN chuyên biệt có seed session để cô lập nghiệp vụ. Chỉ test có DB thật mới là bằng chứng SQL. Kết quả hiện hành tại [review 02/11/2026](../../../Coordination/reports/2026-11-02-backend-readiness.md).
