import { ApiError } from "../api/client.ts";
import type { Notice } from "../auth/notices.ts";
import type { FormErrors } from "./validation.ts";

const messages: Record<string, [string, string]> = {
  ACCOUNT_ALREADY_EXISTS: ["Hồ sơ đã có tài khoản", "Hồ sơ có thể vừa được cấp tài khoản. Tải lại danh sách hồ sơ và chọn lại."],
  DUPLICATE_USERNAME: ["Tên đăng nhập đã được sử dụng", "Chọn tên đăng nhập khác rồi thử lại."],
  INVALID_STATE: ["Trạng thái đã thay đổi", "Tải lại thông tin tài khoản và kiểm tra trước khi thao tác tiếp."],
  CSRF_INVALID: ["Phiên thao tác cần làm mới", "Làm mới phiên, kiểm tra thông tin rồi chủ động gửi lại yêu cầu."],
  NOT_FOUND: ["Không còn tìm thấy dữ liệu", "Tài khoản hoặc hồ sơ không còn khả dụng. Tải lại danh sách để tiếp tục."],
  VALIDATION_ERROR: ["Kiểm tra thông tin", "Có thông tin chưa hợp lệ. Kiểm tra các trường và thử lại."],
  ORIGIN_FORBIDDEN: ["Không thể gửi yêu cầu từ trang này", "Mở DormFlow từ địa chỉ chính thức rồi thử lại."],
  SERVICE_UNAVAILABLE: ["Tạm thời chưa thể xử lý", "Hệ thống chưa thể xử lý yêu cầu. Vui lòng thử lại sau."],
  NETWORK_ERROR: ["Không thể kết nối", "Kiểm tra kết nối mạng rồi thử lại."],
  REQUEST_TIMEOUT: ["Yêu cầu mất nhiều thời gian hơn dự kiến", "Vui lòng kiểm tra kết nối và thử lại."],
  CREATE_OUTCOME_UNKNOWN: ["Chưa xác định kết quả cấp tài khoản", "Yêu cầu có thể đã được ghi nhận. Kiểm tra trạng thái trước khi cấp lại."],
  LOCK_OUTCOME_UNKNOWN: ["Chưa xác định kết quả cập nhật", "Kiểm tra trạng thái tài khoản trước khi xác nhận thao tác khác."],
  PASSWORD_OUTCOME_UNKNOWN: ["Cần kiểm tra lại mật khẩu", "Mật khẩu có thể đã được đổi. Đăng nhập lại bằng mật khẩu mới trước; không gửi lại yêu cầu đổi mật khẩu."],
  PASSWORD_INCORRECT: ["Mật khẩu hiện tại không đúng", "Nhập lại mật khẩu hiện tại để tiếp tục."],
  PASSWORD_UNCHANGED: ["Mật khẩu mới chưa thay đổi", "Chọn mật khẩu khác mật khẩu hiện tại."],
  LOGOUT_OUTCOME_UNKNOWN: ["Chưa xác định kết quả đăng xuất", "Kiểm tra lại phiên trước khi tiếp tục."],
};
export function adminNotice(error: unknown): Notice {
  const [title, message] = messages[error instanceof ApiError ? error.code : ""] ?? ["Chưa thể xử lý yêu cầu", "Vui lòng thử lại sau."];
  return { title, message, tone: "error" };
}
export function serverFields(error: unknown): FormErrors {
  if (!(error instanceof ApiError)) return {};
  if (error.code === "DUPLICATE_USERNAME") return { username: "Tên đăng nhập đã được sử dụng." };
  if (error.code === "ACCOUNT_ALREADY_EXISTS") return { studentId: "Hồ sơ đã có tài khoản." };
  if (error.code === "PASSWORD_INCORRECT") return { currentPassword: "Mật khẩu hiện tại không đúng." };
  if (error.code === "PASSWORD_UNCHANGED") return { newPassword: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  const copy: FormErrors = {
    studentId: "Chọn hồ sơ sinh viên hợp lệ.", username: "Tên đăng nhập cần 3–50 ký tự hợp lệ.",
    displayName: "Họ tên cần từ 1 đến 150 ký tự.", password: "Mật khẩu cần từ 8 đến 128 ký tự.",
    currentPassword: "Kiểm tra mật khẩu hiện tại.", newPassword: "Kiểm tra mật khẩu mới.",
    role: "Chọn vai trò phù hợp nhóm tài khoản.", accountType: "Chọn nhóm tài khoản.",
  };
  const result: FormErrors = {};
  if (error.code === "VALIDATION_ERROR") for (const issue of error.details) {
    if (Object.hasOwn(copy, issue.field)) result[issue.field] = copy[issue.field];
  }
  return result;
}
