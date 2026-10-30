# Shared domain workflow

Chỉ người được Anh giao task Shared được bổ sung workflow vào đây. Role owner không sao chép quy tắc/phép tính sang role của mình khi cùng logic được hai role dùng. Chốt exported function, input/output và test trong task trước.

Mọi mutation dùng `withBusinessTransaction` tại `../db/transaction.ts`, lấy toàn bộ query từ client truyền vào. Shared workflow nhận `PoolClient` và actor; không tạo transaction lồng nhau hoặc `Pool` khác.

Đây là vị trí triển khai tương lai, chưa có workflow nghiệp vụ được code trong scaffold.
