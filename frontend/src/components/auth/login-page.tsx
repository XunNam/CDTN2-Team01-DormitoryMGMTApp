"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthError, createAuthClient } from "@/lib/auth/client";
import { getAuthNotice, getServerFieldErrors, type Notice } from "@/lib/auth/notices";
import { ROLE_LABELS, type AccountType, type FieldErrors, type Identity } from "@/lib/auth/types";
import { validateLogin } from "@/lib/auth/validation";
import styles from "./login-page.module.css";

function BrandName() {
  return <span className={styles.brand}><span>VLU</span><span className={styles.brandDivider} /><span>DormFlow</span></span>;
}

function ArrowIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.75" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>;
}

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Feedback({ notice }: { notice: Notice }) {
  return (
    <div className={styles.feedback} data-tone={notice.tone} role={notice.tone === "error" ? "alert" : "status"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" /><path d="M12 7v6m0 3v1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
      <div><strong>{notice.title}</strong><p>{notice.message}</p></div>
    </div>
  );
}

function Introduction() {
  return (
    <aside className={styles.hero} aria-label="Giới thiệu DormFlow">
      <BrandName />
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>Không gian số cho đời sống ký túc xá</p>
        <h2>Đăng ký chỗ ở.<br /><span>Theo dõi<br />dễ dàng.</span></h2>
        <p className={styles.heroDescription}>Tra cứu phòng, gửi đăng ký và theo dõi kết quả lưu trú tại một nơi.</p>
      </div>
      <div className={styles.buildings} aria-hidden="true">
        <div className={styles.smallTower}>{Array.from({ length: 4 }, (_, i) => <span key={i} />)}</div>
        <div className={styles.mainTower}>{Array.from({ length: 11 }, (_, i) => <span key={i} className={i === 4 ? styles.door : undefined} />)}</div>
        <div className={styles.accentTower}><span /><span /></div>
      </div>
    </aside>
  );
}

export default function LoginPage() {
  const [client] = useState(() => createAuthClient());
  const [accountType, setAccountType] = useState<AccountType>("STUDENT");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const requestController = useRef<AbortController | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    requestController.current = controller;
    async function checkSession() {
      try {
        const current = await client.getCurrentIdentity(controller.signal);
        if (!controller.signal.aborted) setIdentity(current);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!(error instanceof AuthError && error.code === "AUTH_REQUIRED")) {
          setNotice(getAuthNotice(error));
        }
      } finally {
        if (!controller.signal.aborted) setInitializing(false);
      }
    }
    void checkSession();
    return () => controller.abort();
  }, [client]);

  const busy = initializing || submitting || loggingOut;
  const isStudent = accountType === "STUDENT";

  function focusError(errors: FieldErrors) {
    if (errors.accountType) accountRef.current?.focus();
    else if (errors.identifier) identifierRef.current?.focus();
    else if (errors.password) passwordRef.current?.focus();
  }

  function chooseAccountType(kind: AccountType) {
    setAccountType(kind);
    setPassword("");
    setShowPassword(false);
    setFieldErrors({});
    if (!outcomeUnknown) setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || inFlight.current || identity || outcomeUnknown) return;
    const input = { accountType, identifier, password };
    const errors = validateLogin(input);
    setFieldErrors(errors);
    setNotice(null);
    if (Object.keys(errors).length > 0) {
      focusError(errors);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setPassword("");
    setShowPassword(false);
    const signal = requestController.current?.signal;
    try {
      const result = await client.login(input, signal);
      if (signal?.aborted) return;
      setIdentity(result.identity);
      if (!result.csrfReady) {
        setNotice({ title: "Bạn đã đăng nhập", message: "Kết nối chưa ổn định. Vui lòng thử lại nếu thao tác tiếp theo chưa hoàn tất.", tone: "info" });
      }
    } catch (error) {
      if (signal?.aborted) return;
      setNotice(getAuthNotice(error));
      const serverErrors = getServerFieldErrors(error);
      setFieldErrors(serverErrors);
      focusError(serverErrors);
      if (error instanceof AuthError && error.code === "LOGIN_OUTCOME_UNKNOWN") {
        setOutcomeUnknown(true);
      }
    } finally {
      inFlight.current = false;
      if (!signal?.aborted) setSubmitting(false);
    }
  }

  async function handleLogout() {
    if (busy || inFlight.current) return;
    inFlight.current = true;
    setLoggingOut(true);
    setNotice(null);
    const signal = requestController.current?.signal;
    try {
      await client.logout(signal);
      if (signal?.aborted) return;
      setIdentity(null);
      setPassword("");
      setIdentifier("");
      setFieldErrors({});
      setOutcomeUnknown(false);
      setNotice({ title: "Đã đăng xuất", message: "Bạn có thể đăng nhập bằng tài khoản khác.", tone: "info" });
    } catch (error) {
      if (!signal?.aborted) setNotice(getAuthNotice(error));
    } finally {
      inFlight.current = false;
      if (!signal?.aborted) setLoggingOut(false);
    }
  }

  return (
    <main className={styles.page}>
      <Introduction />
      <section className={styles.authSide} aria-labelledby="login-title">
        <div className={styles.mobileBrand}><BrandName /></div>
        <div className={styles.formContainer}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Cổng thông tin ký túc xá</p>
            <h1 id="login-title">{identity ? "Đăng nhập thành công" : "Đăng nhập"}</h1>
            <p>{identity ? `Xin chào, ${identity.displayName}.` : "Sử dụng tài khoản đã được cấp để tiếp tục."}</p>
          </header>
          {identity ? (
            <div className={styles.accountSummary} aria-label="Tài khoản đã đăng nhập">
              <div className={styles.successHeading} role="status"><CheckIcon /><span>Bạn đang đăng nhập.</span></div>
              <dl><div><dt>Tài khoản</dt><dd>{identity.identifier}</dd></div><div><dt>Vai trò</dt><dd>{ROLE_LABELS[identity.role]}</dd></div></dl>
              {notice && <Feedback notice={notice} />}
              <button type="button" className={styles.primaryButton} onClick={() => void handleLogout()} disabled={loggingOut} aria-busy={loggingOut}>{loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}</button>
            </div>
          ) : (
            <form className={styles.form} noValidate onSubmit={handleSubmit} aria-busy={busy}>
              <fieldset className={styles.accountGroup} disabled={busy} aria-describedby={fieldErrors.accountType ? "account-error" : "account-hint"}>
                <legend>Nhóm tài khoản</legend>
                <div className={styles.accountOptions}>
                  {(["STUDENT", "STAFF"] as const).map((kind) => (
                    <label key={kind} className={styles.accountChoice}>
                      <input ref={kind === "STUDENT" ? accountRef : undefined} type="radio" name="accountType" value={kind} checked={accountType === kind} onChange={() => chooseAccountType(kind)} className={styles.accountInput} />
                      <span>{accountType === kind && <CheckIcon />}{kind === "STUDENT" ? "Sinh viên" : "Nhân sự"}</span>
                    </label>
                  ))}
                </div>
                <p id="account-hint" className={styles.hint}>{isStudent ? "Đăng nhập bằng mã số sinh viên của bạn." : "Dành cho Ban quản lý và Quản trị viên."}</p>
                {fieldErrors.accountType && <p id="account-error" className={styles.fieldError}>{fieldErrors.accountType}</p>}
              </fieldset>
              {notice && <Feedback notice={notice} />}
              <div className={styles.field}>
                <label htmlFor="identifier">{isStudent ? "Mã số sinh viên" : "Tên đăng nhập"}</label>
                <input ref={identifierRef} id="identifier" name="identifier" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={isStudent ? "Nhập mã số sinh viên" : "Nhập tên đăng nhập"} value={identifier} onChange={(event) => { setIdentifier(event.target.value); setFieldErrors((current) => ({ ...current, identifier: undefined })); }} disabled={busy} aria-invalid={Boolean(fieldErrors.identifier)} aria-describedby={fieldErrors.identifier ? "identifier-error" : undefined} required />
                {fieldErrors.identifier && <p id="identifier-error" className={styles.fieldError}>{fieldErrors.identifier}</p>}
              </div>
              <div className={styles.field}>
                <label htmlFor="password">Mật khẩu</label>
                <div className={styles.passwordField}>
                  <input ref={passwordRef} id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: undefined })); }} disabled={busy} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : undefined} required />
                  <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-controls="password" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword} disabled={busy}>{showPassword ? "Ẩn" : "Hiện"}</button>
                </div>
                {fieldErrors.password && <p id="password-error" className={styles.fieldError}>{fieldErrors.password}</p>}
              </div>
              {outcomeUnknown ? (
                <button type="button" className={styles.primaryButton} onClick={() => window.location.reload()}>Kiểm tra lại phiên <ArrowIcon /></button>
              ) : (
                <button type="submit" className={styles.primaryButton} disabled={busy} aria-busy={busy}>
                  {initializing ? "Đang kiểm tra phiên…" : submitting ? "Đang đăng nhập…" : "Đăng nhập"}{!busy && <ArrowIcon />}
                </button>
              )}
            </form>
          )}
          {!identity && <div className={styles.support}><p>Chưa có tài khoản hoặc tài khoản bị khóa?</p><p>Liên hệ Ban quản lý ký túc xá để được hướng dẫn.</p></div>}
        </div>
        <div className={styles.sessionNote}><LockIcon /><p>Phiên đăng nhập kết thúc sau 30 phút không hoạt động.</p></div>
      </section>
    </main>
  );
}

