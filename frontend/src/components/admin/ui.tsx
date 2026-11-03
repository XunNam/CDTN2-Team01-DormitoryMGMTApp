"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type InputHTMLAttributes } from "react";
import { useAdmin } from "./admin-context";
import type { Notice } from "@/lib/auth/notices";
import type { Account } from "@/lib/admin/types";
import { adminNotice } from "@/lib/admin/notices";
import { ROLE_LABELS } from "@/lib/auth/types";
import styles from "./admin.module.css";

export function Icon({ name, size = 20 }: { name: "users" | "plus" | "shield" | "logout" | "back" | "check" | "lock" | "search" | "alert"; size?: number }) {
  const paths = {
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    plus: "M12 5v14M5 12h14", shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4m-4 9 3 3 5-6",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5M21 12H9",
    back: "m12 19-7-7 7-7M5 12h14", check: "m5 12 4 4L19 6",
    lock: "M5 10h14v11H5V10m3 0V7a4 4 0 0 1 8 0v3m-4 4v3",
    search: "m21 21-4.5-4.5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    alert: "M12 3 2 21h20L12 3m0 6v5m0 3v1",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={paths[name]} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  return <header className={styles.pageTitle}><div><h1 ref={heading} tabIndex={-1}>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}
export function Feedback({ notice, children }: { notice: Notice; children?: ReactNode }) {
  return <div className={styles.feedback} data-tone={notice.tone} role={notice.tone === "error" ? "alert" : "status"}><Icon name="alert" /><div><strong>{notice.title}</strong><p>{notice.message}</p>{children && <div className={styles.actions}>{children}</div>}</div></div>;
}
export function LoadState({ loading, error, retry }: { loading: boolean; error: unknown; retry: () => void }) {
  if (loading) return <div className={styles.loading} role="status" aria-busy="true"><p>Đang tải dữ liệu…</p><span /><span /><span /></div>;
  if (error) return <Feedback notice={adminNotice(error)}><button type="button" className={styles.secondary} onClick={retry}>Tải lại thông tin</button></Feedback>;
  return null;
}
export function StatusBadge({ locked }: { locked: boolean }) {
  return <span className={styles.status} data-locked={locked}>{locked ? "⊗ Bị khóa" : "● Hoạt động"}</span>;
}
export function dateLabel(value: string, withTime = false) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(value));
}
export function AccountFacts({ account }: { account: Account }) {
  return <dl className={styles.facts}>
    <div><dt>Nhóm tài khoản</dt><dd>{account.actorKind === "STUDENT" ? "Sinh viên" : "Nhân sự"}</dd></div>
    <div><dt>Vai trò</dt><dd>{ROLE_LABELS[account.role]}</dd></div>
    <div><dt>Ngày cấp</dt><dd>{dateLabel(account.createdAt, true)}</dd></div>
    <div><dt>Cập nhật lần cuối</dt><dd>{dateLabel(account.updatedAt, true)}</dd></div>
  </dl>;
}
export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className={styles.fieldError}>{message}</p> : null;
}
export function PasswordField({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const id = props.id!;
  const [type, setType] = usePasswordVisibility();
  return <div className={styles.field}><label htmlFor={id}>{label}</label><div className={styles.passwordField}>
    <input {...props} ref={input} type={type} aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : props["aria-describedby"]} />
    <button type="button" disabled={props.disabled} aria-controls={id} aria-pressed={type === "text"} aria-label={type === "text" ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={setType}>{type === "text" ? "Ẩn" : "Hiện"}</button>
  </div><FieldError id={id + "-error"} message={error} /></div>;
}
function usePasswordVisibility(): ["text" | "password", () => void] {
  const [show, setShow] = useState(false);
  return [show ? "text" : "password", () => setShow((value) => !value)];
}
export function focusFirstError(form: HTMLFormElement, fields: Record<string, string | undefined>) {
  const first = Object.keys(fields).find((key) => fields[key]);
  const element = first ? form.elements.namedItem(first) : null;
  if (element instanceof HTMLElement) element.focus();
  else if (first === "studentId") (form.querySelector<HTMLInputElement>('input[name="studentId"]') ?? form.querySelector<HTMLInputElement>('#candidate-query'))?.focus();
}
export function BackToAccounts() {
  const { busy } = useAdmin();
  return <Link href="/admin/accounts" className={styles.secondary} aria-disabled={busy} onClick={(event) => { if (busy) event.preventDefault(); }}><Icon name="back" />Danh sách tài khoản</Link>;
}
