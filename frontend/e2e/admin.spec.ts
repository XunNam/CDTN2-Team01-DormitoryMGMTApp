import { test, expect } from "@playwright/test";
import { mockApi, ADMIN_ID, STUDENT_ID, ROTATED } from "./mock-api";

test("list search, AND filters, reset and pagination", async ({ page }) => {
  await mockApi(page); await page.goto("/admin");
  await expect(page.getByRole("heading",{name:"Tài khoản người dùng",exact:true})).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(6);
  await page.getByRole("button",{name:"Trang sau",exact:true}).click();
  await expect(page.getByText("Trang 2/3",{exact:true})).toBeVisible();
  await page.getByLabel("Nhóm tài khoản",{exact:true}).selectOption("STUDENT");
  await page.getByLabel("Vai trò",{exact:true}).selectOption("ADMIN");
  await expect(page.getByRole("heading",{name:"Không tìm thấy tài khoản"})).toBeVisible();
  await page.getByRole("button",{name:"Xóa bộ lọc",exact:true}).first().click();
  await page.getByLabel("Tìm tài khoản",{exact:true}).fill("quanly");
  await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();
  await page.getByLabel("Trạng thái",{exact:true}).selectOption("false");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
});
test("create student account once, clear password and display committed result", async ({ page }) => {
  const state=await mockApi(page,{createDelay:400});await page.goto("/admin/accounts/new");
  await page.getByRole("radio",{name:/SV0020/}).check();
  await page.getByLabel("Mật khẩu khởi tạo *",{exact:true}).fill("FakeOnly#2026");
  await page.getByRole("button",{name:"Cấp tài khoản",exact:true}).click();
  await expect(page.getByRole("button",{name:"Đang cấp tài khoản…"})).toBeDisabled();
  await expect(page.getByRole("heading",{name:"Cấp tài khoản thành công",exact:true})).toBeVisible();
  expect(state.calls.filter(c=>c.path==="/api/v1/admin/accounts"&&c.method==="POST")).toHaveLength(1);
  await expect(page.getByText("FakeOnly#2026",{exact:true})).toHaveCount(0);
  await page.getByRole("link",{name:"Về danh sách tài khoản",exact:true}).click();
  await expect(page.getByRole("link",{name:"Xem tài khoản SV0020",exact:true})).toBeVisible();
});
for(const role of ["BQL","ADMIN"] as const)test("create staff "+role+" and keep role read-only",async({page})=>{
  const state=await mockApi(page);await page.goto("/admin/accounts/new");
  await page.getByRole("radio",{name:/Nhân sự ký túc xá/}).check();
  await page.getByLabel("Họ và tên *",{exact:true}).fill("Nhân sự kiểm thử");
  await page.getByLabel("Tên đăng nhập *",{exact:true}).fill(" staff.new ");
  if(role==="ADMIN")await page.getByRole("radio",{name:"Quản trị viên hệ thống",exact:true}).check();
  await page.getByLabel("Mật khẩu khởi tạo *",{exact:true}).fill("FakeOnly#2026");
  await page.getByRole("button",{name:"Cấp tài khoản",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Cấp tài khoản thành công",exact:true})).toBeVisible();
  expect(state.accounts.find(a=>a.identifier==="staff.new")?.role).toBe(role);
  await page.getByRole("link",{name:"Xem tài khoản",exact:true}).click();
  await expect(page.getByText("Vai trò được gán khi cấp tài khoản và không thể thay đổi.")).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
});
test("confirm lock then unlock and show server status",async({page})=>{
  await mockApi(page);await page.goto("/admin/accounts/STUDENT/"+STUDENT_ID);
  await page.getByRole("link",{name:"Khóa tài khoản",exact:true}).click();
  await page.getByRole("button",{name:"Xác nhận khóa",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Khóa tài khoản thành công",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Mở khóa tài khoản",exact:true}).click();
  await page.getByRole("button",{name:"Xác nhận mở khóa",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Mở khóa thành công",exact:true})).toBeVisible();
});
test("self-lock shows successful response before the next protected request is refused",async({page})=>{
  await mockApi(page);await page.goto("/admin/accounts/STAFF/"+ADMIN_ID+"/lock");
  await expect(page.getByText("Đây là tài khoản bạn đang sử dụng.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Khóa tài khoản của tôi",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Khóa tài khoản thành công",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Về danh sách tài khoản",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Tài khoản đã bị khóa",exact:true})).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
test("concurrent state conflict requires a read before any next confirmation",async({page})=>{
  const state=await mockApi(page,{lockConflict:true});await page.goto("/admin/accounts/STUDENT/"+STUDENT_ID+"/lock");
  await page.getByRole("button",{name:"Xác nhận khóa",exact:true}).click();
  await expect(page.getByRole("alert").getByText("Trạng thái đã thay đổi",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Xác nhận khóa",exact:true})).toBeDisabled();
  await page.getByRole("button",{name:"Tải lại thông tin",exact:true}).click();
  await expect(page.getByRole("button",{name:"Xác nhận khóa",exact:true})).toBeDisabled();
  expect(state.calls.filter(c=>c.method==="PATCH")).toHaveLength(1);
});
test("lost create response freezes resubmission and verifies by GET only",async({page})=>{
  const state=await mockApi(page,{createMode:"lost"});await page.goto("/admin/accounts/new");
  await page.getByRole("radio",{name:/SV0020/}).check();await page.getByLabel("Mật khẩu khởi tạo *",{exact:true}).fill("FakeOnly#2026");
  await page.getByRole("button",{name:"Cấp tài khoản",exact:true}).click();
  await expect(page.getByRole("alert").getByText("Chưa xác định kết quả cấp tài khoản")).toBeVisible();
  await expect(page.getByRole("button",{name:"Cấp tài khoản",exact:true})).toBeDisabled();
  await page.getByRole("button",{name:"Kiểm tra trạng thái",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Trạng thái tài khoản hiện tại",exact:true})).toBeVisible();
  expect(state.calls.filter(c=>c.method==="POST"&&c.path==="/api/v1/admin/accounts")).toHaveLength(1);
});
test("CSRF failure never auto-replays, user refreshes then deliberately resubmits",async({page})=>{
  const state=await mockApi(page,{createMode:"csrf"});await page.goto("/admin/accounts/new");
  await page.getByRole("radio",{name:/SV0020/}).check();await page.getByLabel("Mật khẩu khởi tạo *",{exact:true}).fill("FakeOnly#2026");
  await page.getByRole("button",{name:"Cấp tài khoản",exact:true}).click();
  await expect(page.getByRole("alert").getByText("Phiên thao tác cần làm mới")).toBeVisible();
  expect(state.calls.filter(c=>c.method==="POST"&&c.path==="/api/v1/admin/accounts")).toHaveLength(1);
  await page.getByRole("button",{name:"Làm mới phiên",exact:true}).click();
  await expect(page.getByText("Phiên đã được làm mới",{exact:true})).toBeVisible();
  await page.getByLabel("Mật khẩu khởi tạo *",{exact:true}).fill("FakeOnly#2026");await page.getByRole("button",{name:"Cấp tài khoản",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Cấp tài khoản thành công",exact:true})).toBeVisible();
});
test("password rotation shares fresh CSRF with subsequent ADMIN mutation and logout",async({page})=>{
  const state=await mockApi(page);await page.goto("/admin/security");
  await page.getByLabel("Mật khẩu hiện tại",{exact:true}).fill("OldFake#2026");
  await page.getByLabel("Mật khẩu mới",{exact:true}).fill("NewFake#2026");
  await page.getByLabel("Xác nhận mật khẩu mới",{exact:true}).fill("NewFake#2026");
  await page.getByRole("button",{name:"Đổi mật khẩu",exact:true}).click();
  await expect(page.getByText("Đã đổi mật khẩu",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Danh sách tài khoản",exact:true}).click();
  await page.getByRole("link",{name:"Xem tài khoản SV0001",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Sinh viên mẫu A",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Khóa tài khoản",exact:true}).click();
  await page.getByRole("button",{name:"Xác nhận khóa",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Khóa tài khoản thành công",exact:true})).toBeVisible();
  expect(state.calls.find(c=>c.method==="PATCH")?.headers["x-csrf-token"]).toBe(ROTATED);
  await page.getByRole("button",{name:"Đăng xuất",exact:true}).click();
  await expect(page).toHaveURL(/\/login\?status=signed-out$/);
  await expect(page.getByText("Đã đăng xuất",{exact:true})).toBeVisible();
  expect(state.calls.find(c=>c.path==="/api/v1/auth/logout")?.body).toEqual({});
});
test("non-ADMIN identity cannot load account APIs even from a direct URL",async({page})=>{
  const state=await mockApi(page,{role:"BQL"});await page.goto("/admin/accounts");
  await expect(page.getByRole("heading",{name:"Bạn không có quyền truy cập",exact:true})).toBeVisible();
  expect(state.calls.some(c=>c.path.startsWith("/api/v1/admin/"))).toBe(false);
});
test("expired session removes protected content on the next API read",async({page})=>{
  const state=await mockApi(page);await page.goto("/admin/accounts");
  await expect(page.getByRole("table")).toBeVisible();state.expired=true;
  await page.getByRole("link",{name:"Xem tài khoản SV0001",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Phiên đăng nhập đã hết hạn",exact:true})).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
test("uncertain password outcome requires reauthentication without an existing-session redirect loop",async({page})=>{
  await mockApi(page,{passwordUnknown:true});await page.goto("/admin/security");
  await page.getByLabel("Mật khẩu hiện tại",{exact:true}).fill("OldFake#2026");await page.getByLabel("Mật khẩu mới",{exact:true}).fill("NewFake#2026");await page.getByLabel("Xác nhận mật khẩu mới",{exact:true}).fill("NewFake#2026");
  await page.getByRole("button",{name:"Đổi mật khẩu",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Cần kiểm tra lại mật khẩu",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Về trang đăng nhập",exact:true}).click();
  await expect(page).toHaveURL(/reauth=1/);
  await expect(page.getByRole("heading",{name:"Đăng nhập",exact:true})).toBeVisible();
  await expect(page.getByLabel("Mã số sinh viên",{exact:true})).toBeVisible();
});
test("responsive desktop/mobile contain overflow within the table and remain operable",async({page})=>{
  await mockApi(page);await page.goto("/admin/accounts");
  await expect(page.getByRole("table")).toBeVisible();
  await page.screenshot({path:"test-results/screens/admin-desktop.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole("link",{name:"Tài khoản",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/screens/admin-mobile.png",fullPage:true});
  await page.getByRole("link",{name:"Cấp tài khoản",exact:true}).first().click();
  await expect(page.getByRole("heading",{name:"Cấp tài khoản",exact:true})).toBeVisible();
});
