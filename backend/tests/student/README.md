# Kiểm thử role student

Test độc lập tại thư mục này: `<operationId>.test.ts`, dùng mock/fake và chạy bằng npm run check trên máy thành viên chỉ có Node/npm. Không connect PostgreSQL hoặc import server.ts khi load test.

Test cần DB thật đặt tại `backend/tests/integration/student/<operationId>.test.ts`, do thành viên viết và bàn giao fixture/lệnh/expected result cho Anh chạy. Ghi NOT_RUN_PENDING_OWNER tới khi có kết quả thật. Xem [phân công](../../../Coordination/testing-responsibilities.md).
