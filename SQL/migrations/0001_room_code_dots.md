# Mở rộng mã phòng có dấu chấm

Nguồn OWNER_CONFIRMED ngày 14/11/2026: chủ dự án yêu cầu mã phòng `I.XX.YY`, cho phép sửa code, commit local và cập nhật database để tạo phòng. Người thực hiện: Codex. Người rà soát: Bùi Thế Anh. Liên quan FR-03, operation `managementCreateRoom` và DTO Room cho SV/BQL.

Áp dụng `0001_room_code_dots.sql` đúng một lần trên baseline có constraint `rooms_code_check` ban đầu. Không chạy lại snapshot trên DB đã có dữ liệu. Migration dùng transaction, thay riêng CHECK của mã phòng, không đổi mã tòa hoặc sinh viên, không thay sức chứa hay tiền. Khóa bảng tồn tại tới COMMIT. Dữ liệu cũ đều hợp lệ theo quy tắc mới.

Đã áp dụng trên database local theo yêu cầu vận hành của chủ dự án. Kiểm tra trước chạy xác nhận constraint cũ. `db:verify` sau chạy xác nhận cấu trúc khớp snapshot mới. Fixture rollback kiểm tra mã có dấu chấm và trùng mã trong cùng tòa. Không thay dữ liệu có sẵn.

Nếu transaction thất bại, PostgreSQL rollback toàn bộ DDL. Muốn quay lại sau COMMIT phải kiểm tra và xử lý các mã có dấu chấm trước khi khôi phục CHECK cũ, không tự xóa phòng. Đây là bản nâng cấp hẹp local, việc bổ sung ledger migration theo chính sách chung còn chờ điều phối, chưa tuyên bố là hệ thống migration tự động.
