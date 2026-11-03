import type { AccountCreate } from "./types.ts";
import { UUID_PATTERN } from "../auth/contracts.ts";

export type FormErrors = Record<string, string | undefined>;
export function passwordError(value: string): string | undefined {
  return [...value].length < 8 || [...value].length > 128 ? "Mật khẩu cần từ 8 đến 128 ký tự." : undefined;
}
export function validateCreate(input: AccountCreate): FormErrors {
  const errors: FormErrors = {};
  const password = passwordError(input.password);
  if (password) errors.password = password;
  if (input.accountType === "STUDENT") {
    if (!UUID_PATTERN.test(input.studentId)) errors.studentId = "Chọn một hồ sơ sinh viên trước khi cấp tài khoản.";
    if (input.role !== "SV") errors.role = "Tài khoản sinh viên chỉ có vai trò Sinh viên.";
  } else if (input.accountType === "STAFF") {
    if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(input.username.trim().toLowerCase())) {
      errors.username = "Tên đăng nhập cần 3–50 ký tự hợp lệ và bắt đầu bằng chữ hoặc số.";
    }
    if (!input.displayName.trim() || [...input.displayName.trim()].length > 150) errors.displayName = "Nhập họ tên từ 1 đến 150 ký tự.";
    if (input.role !== "BQL" && input.role !== "ADMIN") errors.role = "Chọn Ban quản lý hoặc Quản trị viên.";
  } else errors.accountType = "Chọn nhóm tài khoản.";
  return errors;
}
export function validatePasswordChange(current: string, next: string, repeat: string): FormErrors {
  const errors: FormErrors = {};
  const oldError = passwordError(current), newError = passwordError(next);
  if (oldError) errors.currentPassword = oldError;
  if (newError) errors.newPassword = newError;
  else if (current === next) errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại.";
  if (!repeat || next !== repeat) errors.repeatPassword = "Mật khẩu xác nhận chưa khớp.";
  return errors;
}
