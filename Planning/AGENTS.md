# Hướng dẫn biên soạn bộ kế hoạch

Đọc và tuân thủ `../AGENTS.md`. Thư mục này chỉ chứa tài liệu lập kế hoạch, câu hỏi, quyết định và bản sao SRS gốc trong giai đoạn hiện tại.

- Viết tiếng Việt rõ ràng; giữ mã FR, QT, UC, AC, TC của SRS. Q-01..Q-24 là câu trả lời gốc; Q-25..Q-27 đã được trả lời trong chat và ghi ở file 11; không đánh số lại hoặc hỏi lại các quyết định này.
- Phân biệt OWNER_CONFIRMED với DELEGATED_SELECTION. Dùng chuẩn kỹ thuật file 12; phương án chưa được quyết định hoặc chưa nằm trong ủy quyền ghi PROPOSED, không tự gán nhãn đã được chủ dự án trực tiếp chọn.
- Mỗi phần phải có phạm vi, đầu ra dự kiến, phụ thuộc/câu hỏi, thứ tự làm, tiêu chí hoàn tất và rủi ro tích hợp.
- Không sửa nội dung câu trả lời gốc trong `09-OWNER-QUESTIONS.md`; cập nhật metadata được phép. Khi chủ dự án trả lời thêm, lưu nguyên văn/nguồn trong file 11 và tác động trong file 10; không xóa phần trả lời cũ để che mâu thuẫn đã hòa giải.
- `Source/SRS_v2.pdf` là bản sao nguồn chỉ đọc; không chỉnh nội dung. Hash và nguồn được ghi trong `01-SRS-BASELINE.md`.
- Liên kết file bằng đường dẫn tương đối trong tài liệu repo; đặt đường dẫn có khoảng trắng trong `<...>` khi dùng Markdown.
- Không tạo DDL, code, migration hoặc contract chính thức trong đợt lập kế hoạch. Cây thư mục tương lai trong kế hoạch chỉ là đề xuất đầu ra cho bước tiếp theo.
