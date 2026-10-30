# VLU - DormFlow | Chuyên đề tốt nghiệp 2

Bộ kế hoạch cộng tác xây dựng ứng dụng web đăng ký lưu trú, quản lý phòng và thu phí ký túc xá cho nhóm 4 người.

## Thông tin đề tài và học phần

- **Tên đề tài:** Hệ thống web quản lý đăng ký lưu trú, phòng ở và thu phí ký túc xá.
- **Tên học phần:** Chuyên đề tốt nghiệp 2.
- **Mã học phần:** `261_71ITGR40303_01`.
- **Giảng viên hướng dẫn:** Thạc sĩ Hà Đồng Hưng.

## Thành viên nhóm

| STT | Họ và tên | MSSV |
|---|---|---|
| 1 | Bùi Thế Anh | 2374802010009 |
| 2 | Nguyễn Đỗ Tuấn Kiệt | 2374802010260 |
| 3 | Trần Quốc Vương | 2374802010577 |
| 4 | Trần Tuấn Kiệt | 2374802010263 |

## Trạng thái dự án

**Trạng thái: PLAN_RECONCILED - đã rà 24 câu trả lời và chốt thêm Q-25..Q-27.** Kế hoạch dùng Next.js, Express.js và PostgreSQL; giữ đủ SRS, mật khẩu băm, kiểm quyền/khóa tại API. Repo chưa có ứng dụng, API contract operation hay `SQL/schema.sql`; lượt hiện tại hoàn thiện bộ kế hoạch.

## Bắt đầu

1. Đọc [hướng dẫn cộng tác](AGENTS.md).
2. Đọc [mục lục và kế hoạch tổng thể](Planning/00-PLAN-INDEX.md).
3. Đọc [kết quả rà soát và ba xác nhận bổ sung](Planning/11-ANSWER-REVIEW.md), rồi [chuẩn kỹ thuật chung](Planning/12-SHARED-TECHNICAL-BASELINE.md).
4. Dùng sổ quyết định hiện hành; câu trả lời gốc đã được giữ để truy vết. Khi giao tạo bộ đặc tả hoặc code, ghi task/phạm vi cụ thể; không cần trả lời lại các câu đã chốt.

## Các tài liệu chính

| Nội dung | File |
|---|---|
| SRS gốc và các yêu cầu đã xác nhận | [SRS baseline](Planning/01-SRS-BASELINE.md), [bản PDF](Planning/Source/SRS_v2.pdf) |
| Cây thư mục dự kiến, trách nhiệm từng file | [Cấu trúc đầu ra](Planning/02-TARGET-STRUCTURE.md) |
| Kế hoạch API cho 3 vai trò | [API](Planning/03-API-PLAN.md) |
| Kế hoạch PostgreSQL và schema.sql | [Database](Planning/04-DATABASE-PLAN.md) |
| Kế hoạch chuẩn hóa quy tắc nghiệp vụ | [Business Rules](Planning/05-BUSINESS-RULES-PLAN.md) |
| Phối hợp 4 người và AI | [Cộng tác](Planning/06-COLLABORATION-PLAN.md) |
| Kiểm thử, bảo mật, Docker và nghiệm thu | [Kiểm chứng](Planning/07-QUALITY-AND-DELIVERY-PLAN.md) |
| Công việc, phụ thuộc và lịch tới 28/11, 19/12, 23/12/2026 | [Backlog](Planning/08-WORK-BREAKDOWN.md) |
| Câu trả lời nguyên gốc đã điền | [Câu hỏi cho chủ dự án](Planning/09-OWNER-QUESTIONS.md) |
| Quyết định, thay đổi và bàn giao | [Decision log](Planning/10-DECISIONS-AND-HANDOFF.md) |
| Mâu thuẫn đã giải quyết, nội dung Q-25..Q-27 | [Rà soát](Planning/11-ANSWER-REVIEW.md) |
| Auth, role, enum, JSON/SQL, tiền/ngày và retry thống nhất | [Chuẩn kỹ thuật](Planning/12-SHARED-TECHNICAL-BASELINE.md) |

Chỉ sửa file trong repo. **AI không tự commit/push/merge; chủ dự án kiểm tra và thực hiện thủ công.**
