# Hướng dẫn Shared backend

Tuân thủ [AGENTS gốc](../../../AGENTS.md) và [backend AGENTS](../../AGENTS.md). Chỉ sửa repo, AI không tự commit/push/merge.

Chỉ sửa Shared khi có task nền chung do Anh giao. Role task không tự sửa auth, DB, session, DTO, error hoặc transaction protocol. Code dùng chung có một owner task và người review liên phần; không nhân bản vào từng role.

Các auth operation đặt tại `auth/{router,validation,controller,service,repository}.ts`; helper guard/security có sẵn không chứng minh auth flow đã hoàn tất. Đọc contract auth và ngoại lệ logout hết phiên trước gắn middleware.

Đăng ký helper chung phải có test phù hợp trong `backend/tests/shared/`, nêu tác động ba role. Thay đổi dữ liệu/query/schema phải đồng bộ SQL và contract trước bàn giao.
