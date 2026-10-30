# Kiểm chứng schema và giới hạn hiện tại

Revision 1.0.0. Tài liệu phân biệt kiểm tra cấu trúc với kết quả thực thi PostgreSQL.

| Kiểm tra | Trạng thái lúc biên soạn | Bằng chứng hoặc cách chạy |
|---|---|---|
| Đọc SRS, các quyết định Q-25..27, baseline kỹ thuật | Đã thực hiện | Đối chiếu FR/QT/TC trong dictionary và Business Rules |
| DDL có 10 bảng, 1 view, FK/partial unique/lifecycle trigger | Đã kiểm tra cấu trúc văn bản | `schema.sql`; dictionary sinh từ khai báo cột |
| Phân tích cú pháp PostgreSQL và PL/pgSQL bằng pglast8.7 | Đã chạy, không lỗi | schema:50 SQL statements/14 PL/pgSQL blocks; integrity test:36 SQL statements/10 PL/pgSQL blocks; không kết nối database |
| Dựng schema trên PostgreSQL mới | NOT_RUN | Không có psql/postgres trên PATH; Docker daemon không hoạt động |
| Chạy assertions integrity | NOT_RUN | `psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f SQL/tests/invariants.sql` |
| Kiểm hai transaction chồng lấp | NOT_RUN | [concurrency](tests/concurrency.md) |
| NFR-01 phân quyền API và hash thực | NOT_RUN | Cần implementation/auth + DB thật; SQL CHECK prefix không chứng minh Argon2id hợp lệ |
| NFR-02 100 SV/100 phòng,20 user,100 request,>=95 dưới2s | NOT_RUN | Cần ứng dụng; không suy từ index/khóa ghi là đạt hiệu năng |
| NFR-03 Docker frontend+API+DB tối đa2 lệnh | NOT_RUN | Frontend và nghiệp vụ chưa triển khai ở bộ đặc tả này |

## Tiêu chí khi có runtime

1. Schema COMMIT không lỗi trên DB mới đúng revision.
2. Integrity script kết thúc bằng thông báo assertions rồi ROLLBACK, không có ERROR.
3. Test trùng MSSV/account/đơn/residence/phiếu phải bị chặn; trạng thái không hợp lệ và ngày tương lai bị từ chối; cặp approval-residence không được COMMIT dở.
4. Test số chỗ/giá chốt/giữ nợ và hai client độc lập đạt invariants. Lưu output đã loại secrets, phiên bản server và task.
5. Một người khác rà soát schema/quyền/sức chứa/tiền trước tích hợp; không tự tuyên bố “frozen/reviewed” chỉ vì đã có DDL.

`SQL/tests/invariants.sql` là fixture giả để kiểm DB; hash có prefix Argon2id minh họa, không dùng đăng nhập. Demo login phải sinh hash thật theo [bootstrap](seeds/README.md).
