# Test tích hợp do Anh chạy

Thành viên viết test tại `<role>/<operationId>.test.ts` cùng fixture và README setup. Chạy npm run test:integration từ backend trên máy Anh, có TEST_DATABASE_URL trỏ DB test đã chuẩn bị. Không fallback mock, không tự DROP/TRUNCATE/áp schema lúc import. Không ghi secret vào repo.

Nhóm này tách khỏi npm test/npm run check, vì máy ba thành viên chưa có PostgreSQL. Hiện chưa có test nghiệp vụ trong thư mục này. Trạng thái bàn giao trước khi Anh chạy: NOT_RUN_PENDING_OWNER. [Quy trình](../../../Coordination/testing-responsibilities.md).
