# Quy trình triển khai một API

Revision: 1.0.0. Đọc [bản đồ code](code-ownership.md) cùng contract operation cụ thể. Không triển khai chỉ dựa vào tên màn hình hoặc mã kế hoạch API-P/API-S/API-M/API-A.

## Nhận việc và xác định phạm vi

Nếu chưa biết role, hỏi chính người dùng AI role SV/BQL/ADMIN và task. Nếu chỉ biết role nhưng chưa có operation, hỏi operationId trong danh mục được giao. Không tự phân công toàn bộ backend; không gọi role của người code là role của tài khoản runtime. Ví dụ người được giao role ADMIN vẫn phải kiểm thử BQL/SV gọi API ADMIN bị từ chối.

Task cần khóa revision, method/path, input/output schema, FR/QT/AC/TC, danh sách file và dependency. Shared auth hoặc schema chưa sẵn phải được ghi trước khi nói có thể hoàn tất integration.

## Từng bước code

1. Viết test theo contract: đúng dữ liệu, thiếu/thừa/null/rỗng, sai enum/UUID, chưa login, khóa, sai role, dữ liệu của SV khác, sai trạng thái, retry và cạnh tranh nếu có mutation.
2. Viết validation strict trong `validation.ts`. Mật khẩu không trim; mã nghiệp vụ normalize một lần theo chuẩn. Unknown field là 422. Query được parse đúng kiểu, không dùng truthy cho chuỗi `"false"`.
3. Viết repository tham số hóa và mapper row → DTO. BIGINT VND giữ chuỗi; ngày DATE trả `YYYY-MM-DD`, timestamp UTC ISO; không `SELECT *` rồi trả row; không có hash trong DTO.
4. Service lấy actor từ middleware đã kiểm tra DB, không từ body. Mutation dùng transaction helper, giữ khóa và kiểm tra lại tại thời điểm ghi. Không dùng một lần `SELECT` từ UI thay bảo vệ cạnh tranh.
5. Controller chỉ trả response theo envelope chuẩn. Khi thất bại ném `AppError` có code đã định nghĩa; không tự trả HTTP 200 với cờ `success:false`.
6. Router nối validation/controller trong đúng folder role. App đã mount prefix; không thêm lần nữa `/api/v1/student` ở route con. Đăng nhập/xuất/đổi mật khẩu nằm Shared auth, không sao chép sang từng role.
7. Kiểm tra code mới không tạo thêm app/listen/pool/auth store. Kiểm thử DB thật cho constraint và cạnh tranh; mock đơn thuần không chứng minh không vượt sức chứa.
8. Chạy build, test tự động và kiểm tra tích hợp phù hợp. Ghi lệnh/kết quả thực tế, giới hạn chưa chạy, file thay đổi và task nhận ảnh hưởng.

## Mẫu controller đúng envelope

```ts
// Minh họa tầng controller; tên hàm và DTO phải lấy từ contract operation.
export async function getResource(req: Request, res: Response): Promise<void> {
  const result = await service.getResource(res.locals.actor, req.params.id);
  sendData(res, 200, result);
}
```

Ví dụ này không cấp quyền hoặc thay thế validation. `res.locals.actor` do shared guard đọc lại account từ DB ở request hiện tại. Repository phải thêm ownership vào query đối với SV; bản ghi ngoài ownership trả 404. Role không được phép gọi chức năng trả 403. Thiếu/hết phiên/tài khoản khóa trả 401.

## Xử lý thay đổi và hoàn tất

Nếu nhận thấy contract thiếu field/error/điều kiện, ghi đề xuất có ví dụ và tác động tới UI/schema/test. Không tự mở rộng response cho “tiện frontend”. Với mutation retry, trả 409 khi trạng thái đã xử lý, trừ logout 204. Sau mất response, đọc lại trạng thái; không tự gửi lại tác vụ tạo vô hạn.

Handoff phải cho phép Anh mở đúng file và chạy test. Không báo “xong API” khi chỉ có route stub, mock hoặc test happy path. Không báo NFR-02/03 đạt trước khi chạy đúng kịch bản SRS trên hệ thống đã ghép.
