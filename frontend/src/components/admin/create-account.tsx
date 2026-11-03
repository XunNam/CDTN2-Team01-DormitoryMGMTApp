"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, isCancelled } from "@/lib/api/client";
import type { AccountType } from "@/lib/auth/types";
import type { Notice } from "@/lib/auth/notices";
import type { AccountCreate, CreationLookup, ProfileCandidate } from "@/lib/admin/types";
import { accountPath, accountRef } from "@/lib/admin/types";
import { validateCreate, type FormErrors } from "@/lib/admin/validation";
import { adminNotice, serverFields } from "@/lib/admin/notices";
import { useAdmin } from "./admin-context";
import { useTask } from "./hooks";
import { BackToAccounts, FieldError, Feedback, Icon, PageTitle, PasswordField, focusFirstError } from "./ui";
import { ProfilePicker } from "./profile-picker";
import styles from "./admin.module.css";

export function CreateAccount() {
  const { admin, api, auth, busy, handleError, saveResult } = useAdmin();
  const run = useTask();
  const router = useRouter();
  const [group, setGroup] = useState<AccountType>("STUDENT");
  const [student, setStudent] = useState<ProfileCandidate | null>(null);
  const [role, setRole] = useState<"BQL" | "ADMIN">("BQL");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordEpoch, setPasswordEpoch] = useState(0);
  const [candidateEpoch, setCandidateEpoch] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [errorCode, setErrorCode] = useState("");
  const [pending, setPending] = useState<CreationLookup | null>(null);
  const disabled = busy || pending !== null;
  function chooseGroup(next: AccountType) {
    setGroup(next); setStudent(null); setPassword(""); setPasswordEpoch((n) => n + 1); setErrors({}); setNotice(null); setErrorCode("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const form = event.currentTarget;
    const input: AccountCreate = group === "STUDENT"
      ? { accountType: "STUDENT", studentId: student?.id ?? "", role: "SV", password }
      : { accountType: "STAFF", username, displayName, role, password };
    const invalid = validateCreate(input);
    setErrors(invalid); setNotice(null);
    if (Object.keys(invalid).length) { focusFirstError(form, invalid); return; }
    const lookup: CreationLookup = { accountType: group, identifier: group === "STUDENT" ? student!.studentCode : username.trim().toLowerCase(), ...(group === "STUDENT" ? { studentId: student!.id } : {}) };
    setPassword(""); setPasswordEpoch((n) => n + 1);
    try {
      const account = await run((signal) => admin.createAccount(input, signal));
      saveResult({ account, action: "created" }); router.replace(accountPath(accountRef(account)) + "/result");
    } catch (error) {
      if (isCancelled(error) || handleError(error)) return;
      const fields = serverFields(error);
      setErrors(fields); focusFirstError(form, fields); setNotice(adminNotice(error));
      const code = error instanceof ApiError ? error.code : "";
      setErrorCode(code);
      if (code === "CREATE_OUTCOME_UNKNOWN") setPending(lookup);
    }
  }
  async function recover() {
    setNotice(null);
    try {
      if (pending) {
        const found = await run((signal) => admin.findCreatedAccount(pending, signal));
        if (found) { saveResult({ account: found, action: "verified" }); router.replace(accountPath(accountRef(found)) + "/result"); }
        else setNotice({ title: "Chưa tìm thấy tài khoản khớp", message: "Chưa thể kết luận yêu cầu trước thất bại. Kiểm tra lại trạng thái hoặc quay về danh sách trước khi cấp mới.", tone: "info" });
      } else if (errorCode === "CSRF_INVALID") {
        await run(async (signal) => { await api.getCsrfToken(signal); const current = await auth.getCurrentIdentity(signal); if (current.role !== "ADMIN") throw new ApiError("FORBIDDEN", 403); });
        setNotice({ title: "Phiên đã được làm mới", message: "Nhập lại mật khẩu, kiểm tra thông tin rồi chủ động cấp tài khoản.", tone: "info" }); setErrorCode("");
      } else {
        setStudent(null); setCandidateEpoch((n) => n + 1); setErrors({}); setErrorCode("");
        setNotice({ title: "Đã yêu cầu tải lại hồ sơ", message: "Chọn lại hồ sơ đủ điều kiện trước khi cấp.", tone: "info" });
      }
    } catch (error) { if (!isCancelled(error) && !handleError(error)) setNotice(adminNotice(error)); }
  }
  return <div className={styles.stack + " " + styles.narrow}><div><BackToAccounts /></div>
    <PageTitle title="Cấp tài khoản" description="Chọn nhóm tài khoản và điền thông tin để cấp quyền truy cập." />
    {notice && <Feedback notice={notice}>{(pending || errorCode === "ACCOUNT_ALREADY_EXISTS" || errorCode === "CSRF_INVALID" || errorCode === "NOT_FOUND") && <button type="button" className={styles.secondary} disabled={busy} onClick={() => void recover()}>{pending ? "Kiểm tra trạng thái" : errorCode === "CSRF_INVALID" ? "Làm mới phiên" : "Tải lại hồ sơ"}</button>}</Feedback>}
    <form className={styles.panel} noValidate onSubmit={submit} aria-busy={busy}>
      <fieldset className={styles.group} disabled={disabled}><legend>Cấp tài khoản cho</legend><div className={styles.groupChoices}>
        <label className={styles.groupChoice}><input type="radio" name="accountType" value="STUDENT" checked={group === "STUDENT"} onChange={() => chooseGroup("STUDENT")} /><span>Sinh viên</span><p>Liên kết với hồ sơ sinh viên đã có.</p></label>
        <label className={styles.groupChoice}><input type="radio" name="accountType" value="STAFF" checked={group === "STAFF"} onChange={() => chooseGroup("STAFF")} /><span>Nhân sự ký túc xá</span><p>Ban quản lý hoặc Quản trị viên.</p></label>
      </div></fieldset>
      <div className={styles.divider} />
      {group === "STUDENT" ? <>
        <ProfilePicker selected={student} onSelect={(candidate) => { setStudent(candidate); setErrors((current) => ({ ...current, studentId: undefined })); }} disabled={disabled} error={errors.studentId} epoch={candidateEpoch} />
        <div className={styles.readonly}><span>Vai trò được cấp</span><strong>Sinh viên</strong></div>
      </> : <>
        <div className={styles.twoColumns}>
          <div className={styles.field}><label htmlFor="staff-name">Họ và tên *</label><input id="staff-name" name="displayName" value={displayName} onChange={(event) => { setDisplayName(event.target.value); setErrors((current) => ({ ...current, displayName: undefined })); }} autoComplete="name" disabled={disabled} placeholder="Nhập họ tên nhân sự" aria-invalid={Boolean(errors.displayName)} aria-describedby={errors.displayName ? "display-name-error" : undefined} /><FieldError id="display-name-error" message={errors.displayName} /></div>
          <div className={styles.field}><label htmlFor="staff-username">Tên đăng nhập *</label><input id="staff-username" name="username" value={username} onChange={(event) => { setUsername(event.target.value); setErrors((current) => ({ ...current, username: undefined })); }} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={disabled} placeholder="Ví dụ: quanly.demo" aria-invalid={Boolean(errors.username)} aria-describedby="username-help username-error" /><p id="username-help" className={styles.muted}>3–50 ký tự: a–z, 0–9, dấu chấm, gạch dưới hoặc gạch ngang.</p><FieldError id="username-error" message={errors.username} /></div>
        </div>
        <fieldset className={styles.group} disabled={disabled}><legend>Vai trò *</legend><div className={styles.groupChoices}>
          <label className={styles.roleChoice}><input type="radio" name="role" value="BQL" checked={role === "BQL"} onChange={() => setRole("BQL")} />Ban quản lý ký túc xá</label>
          <label className={styles.roleChoice}><input type="radio" name="role" value="ADMIN" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} />Quản trị viên hệ thống</label>
        </div><FieldError id="role-error" message={errors.role} /></fieldset>
      </>}
      <div className={styles.formPassword}><PasswordField key={passwordEpoch} id="initial-password" name="password" label="Mật khẩu khởi tạo *" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} autoComplete="new-password" disabled={disabled} placeholder="Nhập mật khẩu khởi tạo" error={errors.password} aria-describedby="initial-password-help" /><p id="initial-password-help" className={styles.muted}>Từ 8 đến 128 ký tự. Mật khẩu không hiển thị lại sau khi cấp.</p></div>
      <p className={styles.note}><Icon name="shield" />Vai trò chỉ được chọn khi cấp tài khoản và không thể thay đổi sau đó.</p>
      <div className={styles.actions}><button type="submit" className={styles.primary} disabled={disabled} aria-busy={busy}>{busy ? "Đang cấp tài khoản…" : "Cấp tài khoản"}</button><BackToAccounts /></div>
    </form>
  </div>;
}
