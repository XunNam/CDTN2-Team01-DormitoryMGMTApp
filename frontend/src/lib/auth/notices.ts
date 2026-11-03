import { AuthError } from "./client.ts";
import type { FieldErrors } from "./types.ts";

export interface Notice {
  title: string;
  message: string;
  tone: "error" | "info";
}

export function getAuthNotice(error: unknown): Notice {
  const code = error instanceof AuthError ? error.code : "INTERNAL_ERROR";
  const messages: Record<string, [string, string]> = {
    INVALID_CREDENTIALS: ["Chưa thể đăng nhập", "Thông tin đăng nhập chưa đúng. Kiểm tra nhóm tài khoản, mã đăng nhập và mật khẩu."],
    ACCOUNT_LOCKED: ["Tài khoản đã bị khóa", "Liên hệ Ban quản lý ký túc xá để được hướng dẫn."],
    AUTH_REQUIRED: ["Vui lòng đăng nhập", "Sử dụng tài khoản đã được cấp để tiếp tục."],
    SESSION_EXPIRED: ["Phiên đăng nhập đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục."],
    CSRF_INVALID: ["Phiên đăng nhập cần làm mới", "Vui lòng nhập lại mật khẩu và thử lại. Nếu vẫn gặp lỗi, hãy tải lại trang."],
    ORIGIN_FORBIDDEN: ["Không thể gửi yêu cầu từ trang này", "Mở cổng DormFlow từ địa chỉ chính thức rồi thử lại."],
    VALIDATION_ERROR: ["Kiểm tra thông tin đăng nhập", "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường và thử lại."],
    SERVICE_UNAVAILABLE: ["Tạm thời chưa thể kết nối", "Hệ thống chưa thể xử lý yêu cầu. Vui lòng thử lại sau."],
    NETWORK_ERROR: ["Không thể kết nối", "Kiểm tra kết nối mạng rồi thử lại."],
    REQUEST_TIMEOUT: ["Yêu cầu mất nhiều thời gian hơn dự kiến", "Kiểm tra kết nối mạng rồi thử lại."],
    LOGIN_OUTCOME_UNKNOWN: ["Chưa xác định được kết quả đăng nhập", "Tải lại trang để kiểm tra phiên hiện tại trước khi đăng nhập lại."],
    LOGOUT_OUTCOME_UNKNOWN: ["Chưa xác định được kết quả đăng xuất", "Tải lại trang để kiểm tra lại phiên hiện tại."],
  };
  const [title, message] = messages[code] ?? ["Chưa thể xử lý yêu cầu", "Vui lòng thử lại sau."];
  return { title, message, tone: code === "SESSION_EXPIRED" ? "info" : "error" };
}

export function getServerFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof AuthError) || error.code !== "VALIDATION_ERROR") return {};
  const errors: FieldErrors = {};
  // Use reviewed client copy rather than arbitrary server text in the form.
  for (const issue of error.details) {
    if (issue.field === "identifier") errors.identifier = "Vui lòng kiểm tra mã đăng nhập (1–50 ký tự).";
    if (issue.field === "password") errors.password = "Mật khẩu cần từ 8 đến 128 ký tự.";
    if (issue.field === "accountType") errors.accountType = "Vui lòng chọn nhóm tài khoản.";
  }
  return errors;
}
