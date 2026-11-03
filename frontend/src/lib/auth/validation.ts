import type { FieldErrors, LoginInput } from "./types.ts";

export function validateLogin(input: LoginInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.accountType !== "STUDENT" && input.accountType !== "STAFF") {
    errors.accountType = "Vui lòng chọn nhóm tài khoản.";
  }
  const identifierLength = [...input.identifier.trim()].length;
  if (identifierLength === 0) {
    errors.identifier = "Vui lòng nhập mã đăng nhập.";
  } else if (identifierLength > 50) {
    errors.identifier = "Mã đăng nhập không được vượt quá 50 ký tự.";
  }
  const passwordLength = [...input.password].length;
  if (passwordLength === 0) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (passwordLength < 8 || passwordLength > 128) {
    errors.password = "Mật khẩu cần từ 8 đến 128 ký tự.";
  }
  return errors;
}
