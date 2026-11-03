"use client";

import { useState, type FormEvent } from "react";
import { ApiError, isCancelled } from "@/lib/api/client";
import type { Notice } from "@/lib/auth/notices";
import { adminNotice, serverFields } from "@/lib/admin/notices";
import { validatePasswordChange, type FormErrors } from "@/lib/admin/validation";
import { useAdmin } from "./admin-context";
import { useTask } from "./hooks";
import { BackToAccounts, Feedback, Icon, PageTitle, PasswordField, focusFirstError } from "./ui";
import styles from "./admin.module.css";

export function SecurityPage() {
  const { auth, api, identity, busy, handleError, setSessionError } = useAdmin();
  const run = useTask();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [csrfError, setCsrfError] = useState(false);
  const [changed, setChanged] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const invalid = validatePasswordChange(currentPassword, newPassword, repeat);
    setErrors(invalid); setNotice(null); setChanged(false);
    if (Object.keys(invalid).length) { focusFirstError(form, invalid); return; }
    const input = { currentPassword, newPassword };
    setCurrent(""); setNew(""); setRepeat(""); setEpoch((n) => n + 1);
    try {
      const response = await run((signal) => auth.changePassword(input, signal));
      setChanged(true);
      setCsrfError(!response.csrfReady);
      setNotice({ title: "Đã đổi mật khẩu", message: response.csrfReady ? "Mật khẩu mới đã được cập nhật. Các phiên đăng nhập khác sẽ hết hiệu lực." : "Mật khẩu mới đã được cập nhật. Kết nối chưa ổn định; hãy làm mới phiên trước thao tác tiếp theo.", tone: "info" });
    } catch (error) {
      if (isCancelled(error) || handleError(error)) return;
      if (error instanceof ApiError && error.code === "PASSWORD_OUTCOME_UNKNOWN") { setSessionError(error); return; }
      setCsrfError(error instanceof ApiError && error.code === "CSRF_INVALID");
      const fields = serverFields(error); setErrors(fields); focusFirstError(form, fields); setNotice(adminNotice(error));
    }
  }
  async function refresh() {
    try {
      await run(async (signal) => { await api.getCsrfToken(signal); const current = await auth.getCurrentIdentity(signal); if (current.role !== "ADMIN") throw new ApiError("FORBIDDEN", 403); });
      setCsrfError(false); setNotice({ title: "Phiên đã được làm mới", message: changed ? "Bạn có thể tiếp tục sử dụng. Không cần gửi lại thao tác đổi mật khẩu đã thành công." : "Kiểm tra thông tin và nhập lại mật khẩu trước khi chủ động gửi lại yêu cầu.", tone: "info" });
    } catch (error) { if (!isCancelled(error) && !handleError(error)) setNotice(adminNotice(error)); }
  }
  return <div className={styles.stack + " " + styles.narrow}>
    <PageTitle title="Đổi mật khẩu" description={"Cập nhật mật khẩu cho tài khoản " + identity.identifier + "."} />
    {notice && <Feedback notice={notice}>{csrfError && <button type="button" className={styles.secondary} disabled={busy} onClick={() => void refresh()}>Làm mới phiên</button>}</Feedback>}
    <form className={styles.panel} noValidate onSubmit={submit} aria-busy={busy}>
      <div className={styles.formPassword}><PasswordField key={"current-" + epoch} id="current-password" name="currentPassword" label="Mật khẩu hiện tại" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrent(event.target.value); setErrors((value) => ({ ...value, currentPassword: undefined })); }} disabled={busy} error={errors.currentPassword} /></div>
      <div className={styles.formPassword}><PasswordField key={"new-" + epoch} id="new-password" name="newPassword" label="Mật khẩu mới" autoComplete="new-password" value={newPassword} onChange={(event) => { setNew(event.target.value); setErrors((value) => ({ ...value, newPassword: undefined })); }} disabled={busy} error={errors.newPassword} aria-describedby="new-password-help" /><p id="new-password-help" className={styles.muted}>8–128 ký tự và khác mật khẩu hiện tại.</p></div>
      <div className={styles.formPassword}><PasswordField key={"repeat-" + epoch} id="repeat-password" name="repeatPassword" label="Xác nhận mật khẩu mới" autoComplete="new-password" value={repeat} onChange={(event) => { setRepeat(event.target.value); setErrors((value) => ({ ...value, repeatPassword: undefined })); }} disabled={busy} error={errors.repeatPassword} /></div>
      <div className={styles.impact}><p className={styles.note}><Icon name="shield" />Sau khi đổi thành công, các phiên đăng nhập khác sẽ hết hiệu lực. Phiên hiện tại được giữ để bạn tiếp tục sử dụng.</p></div>
      <div className={styles.actions}><button type="submit" className={styles.primary} disabled={busy || csrfError} aria-busy={busy}>{busy ? "Đang đổi mật khẩu…" : "Đổi mật khẩu"}</button><BackToAccounts /></div>
    </form>
  </div>;
}
