# Kiểm chứng frontend ↔ backend — 05/11/2026

## Kết luận

Trên baseline main 872d1b817da5b9ce0ce79248092ef960daa96883, cả 51 operation đã trả response thành công qua Next.js thật → Express thật → PostgreSQL 18.6. Không phát hiện lỗi proxy/API cần đổi nghiệp vụ. Lỗi thiếu thư viện pg ban đầu được giải quyết bằng npm ci theo lockfile.

Đã tạo config/backend-frontend từ main, push nhánh, fetch và pull --ff-only trước khi sửa. Chủ dự án cho phép commit/push riêng nhánh; không merge/deploy.

## Thay đổi

- Thêm npm run test:frontend ở backend: tự chạy Next.js dev tại localhost:3200, trỏ BACKEND_ORIGIN đến Express fixture dùng PostgreSQL session store thật, dừng server sau kiểm tra. Không tái sử dụng server đã chiếm cổng.
- Harness đối chiếu OpenAPI: chỉ tính operation có response 2xx; thiếu bất kỳ operation nào trong 51 API sẽ fail. Luồng kiểm có tạo tài khoản, hồ sơ/phòng/kỳ, gửi/duyệt/từ chối đơn, nhận/hủy/trả phòng, lập/thu phiếu, thống kê và auth. Đổi mật khẩu, logout và đăng nhập bằng mật khẩu mới cũng được kiểm.
- Kiểm sai quyền, ownership và request cạnh tranh trên PostgreSQL thật qua proxy; cookie và CSRF được giữ/xoay theo response thực.
- Chrome headless kiểm đăng nhập từ form thật, redirect và tải trang bảo vệ của ADMIN/BQL/SV, sau đó xác minh auth/me bằng cookie browser. Không chặn hoặc giả API.
- Bổ sung bộ test consumer Student bị bỏ sót trong npm test chung của frontend.

## Kết quả thực tế

| Kiểm tra | Kết quả |
|---|---|
| backend npm run db:check | PASS, PostgreSQL 18.6; 11 đối tượng bắt buộc |
| backend npm run check | PASS, build + 100 unit |
| backend npm run test:integration | PASS, 27/27 |
| backend npm run test:system | PASS, 2/2; đủ 51 API trực tiếp |
| backend npm run test:frontend | PASS, 51/51 qua Next.js thật + login Chrome cả 3 role |
| frontend lint/typecheck/build | PASS |
| frontend npm test sau khi bổ sung SV | PASS, 92/92 |
| frontend npm run test:e2e | PASS, 41/41; suite hồi quy này dùng API giả |

Không cộng test mock vào bằng chứng DB thật. Kiểm qua proxy dùng Next.js dev; production build được kiểm riêng. Không chứng nhận mọi form/mọi tình huống UI với DB thật hoặc production/HTTPS/Docker/NFR-03. Không thay đổi dữ liệu public; fixture chỉ dùng namespace codex_review_* được xác nhận trước khi chạy. Dữ liệu test được giữ lại theo quy trình repo.

## Chạy lại

Cài thư viện backend và frontend bằng npm ci. Dùng Node 24/npm 11 theo chuẩn nhóm. Lần kiểm này máy có Node 24.18.0/npm 12.1.0; không thay lockfile/dependency. Cần PostgreSQL chạy và backend/.env.test trỏ tới vùng test riêng. Nếu chưa có, làm theo backend/README.md để chuẩn bị schema codex_review_*; không dùng DB nghiệp vụ.

Từ backend, với Chrome đã cài:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:frontend
```

Nếu không đặt channel, cần Chromium của Playwright. Để trống cổng 3200 và không chạy đồng thời các suite dùng cùng schema test vì có kỳ đăng ký singleton. Khi chạy ứng dụng thường: backend npm run dev ở cổng 3001; frontend npm run dev ở cổng 3000. APP_ORIGIN=http://localhost:3000 phải khớp URL browser, BACKEND_ORIGIN=http://127.0.0.1:3001. Cần schema/session table và tài khoản demo hợp lệ; không chạy lại schema.sql trên DB đã có bảng.
