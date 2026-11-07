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

**Backend đã được review và kiểm tra trên PostgreSQL ngày 02/11/2026.** Mỗi nhánh chứa module role của mình và Shared; bản ghép kiểm chứng đủ 51 operation, sẵn sàng để chủ dự án review/tích hợp trước frontend. Xem [báo cáo sẵn sàng](Coordination/reports/2026-11-02-backend-readiness.md) để biết phiên bản, kết quả, nơi giữ source từng nhánh và phần NFR-03 còn chờ.

## Bắt đầu

### Chạy backend và frontend cùng lúc

Chuẩn bị Node.js 24, PostgreSQL và `backend/.env` theo [hướng dẫn backend](backend/README.md). Cài thư viện một lần từ thư mục gốc:

```powershell
npm ci
npm --prefix backend ci
npm --prefix frontend ci
```

Sau đó, mỗi lần chạy chỉ cần:

```powershell
npm run dev
```

Mở [trang đăng nhập](http://localhost:3000/login). Backend mặc định chạy cổng 3001, frontend cổng 3000; giữ hai cổng này trống. Nhấn **Ctrl+C** để dừng cả hai. Nếu một tiến trình kết thúc, lệnh chung cũng dừng tiến trình còn lại. Lệnh không tự khởi động PostgreSQL hay tạo dữ liệu/tài khoản; cần chuẩn bị DB trước. `APP_ORIGIN` ở backend phải khớp `http://localhost:3000`.

### Tài liệu cộng tác

1. AI đọc [AGENTS gốc](AGENTS.md), xác định role và task với chính người giao việc.
2. Đọc [hướng dẫn cộng tác](Coordination/README.md) và [baseline đặc tả](Planning/13-SPECIFICATION-BASELINE.md).
3. Tra [danh mục API](<API Endpoint/README.md>), [chuẩn Shared](<API Endpoint/Shared/00-conventions.md>), [schema](SQL/schema.sql) và contract role.
4. Code theo [khung backend](backend/README.md), kiểm thử rồi bàn giao cho Anh review. Không tự commit/push/merge.

| Role | Contract | Code |
|---|---|---|
| SV | [Sinh viên](<API Endpoint/Student/API-Contract.md>) | backend/src/roles/student/ |
| BQL | [Ban quản lý](<API Endpoint/Dormitory Management/API-Contract.md>) | backend/src/roles/management/ |
| ADMIN | [Quản trị viên](<API Endpoint/System Admin/API-Contract.md>) | backend/src/roles/admin/ |
| Shared được giao | [Auth dùng chung](<API Endpoint/Shared/01-authentication.md>) | backend/src/shared/ |

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

## Môi trường cộng tác

Ba thành viên chỉ cần Node.js 24/npm 11 để viết backend, chạy build/unit và bàn giao test tích hợp. Bùi Thế Anh chuẩn bị PostgreSQL và chạy test DB/tích hợp sau bàn giao. Đọc [phân công kiểm thử](Coordination/testing-responsibilities.md); không cần cài DB trên máy thành viên.
