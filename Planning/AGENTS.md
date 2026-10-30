# Hướng dẫn biên soạn bộ kế hoạch

Đọc và tuân thủ `../AGENTS.md`. Thư mục này giữ kế hoạch lịch sử, câu hỏi, quyết định và baseline đặc tả mới. Giai đoạn hiện tại theo AGENTS gốc; không dùng phạm vi lượt kế hoạch cũ để chặn yêu cầu tạo đặc tả mới.

- Viết tiếng Việt rõ ràng; giữ mã FR, QT, UC, AC, TC của SRS. Q-01..Q-24 là câu trả lời gốc; Q-25..Q-27 đã được trả lời trong chat và ghi ở file 11; không đánh số lại hoặc hỏi lại các quyết định này.
- Phân biệt OWNER_CONFIRMED với DELEGATED_SELECTION. Dùng chuẩn kỹ thuật file 12; phương án chưa được quyết định hoặc chưa nằm trong ủy quyền ghi PROPOSED, không tự gán nhãn đã được chủ dự án trực tiếp chọn.
- Mỗi phần phải có phạm vi, đầu ra dự kiến, phụ thuộc/câu hỏi, thứ tự làm, tiêu chí hoàn tất và rủi ro tích hợp.
- Không sửa nội dung câu trả lời gốc trong `09-OWNER-QUESTIONS.md`; cập nhật metadata được phép. Khi chủ dự án trả lời thêm, lưu nguyên văn/nguồn trong file 11 và tác động trong file 10; không xóa phần trả lời cũ để che mâu thuẫn đã hòa giải.
- `Source/SRS_v2.pdf` là bản sao nguồn chỉ đọc; không chỉnh nội dung. Hash và nguồn được ghi trong `01-SRS-BASELINE.md`.
- Liên kết file bằng đường dẫn tương đối trong tài liệu repo; đặt đường dẫn có khoảng trắng trong `<...>` khi dùng Markdown.
- Những file kế hoạch cũ được giữ để truy vết; baseline mới ở file13 chỉ tới API/SQL/backend thực tế. Không sửa câu trả lời lịch sử để hợp thức hóa lựa chọn mới.
