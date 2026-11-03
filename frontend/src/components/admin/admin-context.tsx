"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { ApiError, createSessionClient, isCancelled } from "@/lib/api/client";
import { createAuthClient } from "@/lib/auth/client";
import { createAdminClient } from "@/lib/admin/client";
import { adminNotice } from "@/lib/admin/notices";
import type { Identity } from "@/lib/auth/types";
import type { AccountQuery, AccountResult } from "@/lib/admin/types";
import type { Notice } from "@/lib/auth/notices";
import styles from "./admin.module.css";

function createServices() {
  const api = createSessionClient();
  return { api, auth: createAuthClient(fetch, 15_000, api), admin: createAdminClient(api) };
}
type Services = ReturnType<typeof createServices>;
interface AdminContextValue extends Services {
  identity: Identity; busy: boolean; result: AccountResult | null;
  saveResult: (result: AccountResult) => void;
  accountQuery: AccountQuery; setAccountQuery: Dispatch<SetStateAction<AccountQuery>>;
  handleError: (error: unknown) => boolean;
  begin: () => boolean; end: () => void;
  signOut: () => Promise<void>;
  setSessionError: (error: ApiError) => void;
}
const AdminContext = createContext<AdminContextValue | null>(null);
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("Admin components require the protected ADMIN layout.");
  return context;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [services] = useState(createServices);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [sessionError, setSessionError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, saveResult] = useState<AccountResult | null>(null);
  const [accountQuery, setAccountQuery] = useState<AccountQuery>({ page: 1, pageSize: 5 });
  const [attempt, setAttempt] = useState(0);
  const [logoutNotice, setLogoutNotice] = useState<Notice | null>(null);
  const work = useRef(false);
  const router = useRouter();

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && (error.status === 401 || (error.status === 403 && error.code === "FORBIDDEN"))) {
      setIdentity(null); saveResult(null); setSessionError(error); services.api.clearCsrf();
      return true;
    }
    return false;
  }, [services]);
  const begin = useCallback(() => { if (work.current) return false; work.current = true; setBusy(true); return true; }, []);
  const end = useCallback(() => { work.current = false; setBusy(false); }, []);
  const setSessionFailure = useCallback((error: ApiError) => {
    setIdentity(null); saveResult(null); setSessionError(error); services.api.clearCsrf();
  }, [services]);

  useEffect(() => {
    const controller = new AbortController();
    void services.auth.getCurrentIdentity(controller.signal).then((current) => {
      if (controller.signal.aborted) return;
      if (current.actorKind !== "STAFF" || current.role !== "ADMIN") {
        setSessionError(new ApiError("FORBIDDEN", 403));
        return;
      }
      setIdentity(current); setSessionError(null);
    }).catch((error: unknown) => {
      if (!isCancelled(error) && !controller.signal.aborted) {
        setSessionError(error instanceof ApiError ? error : new ApiError("INTERNAL_ERROR"));
      }
    });
    return () => controller.abort();
  }, [services, attempt]);

  const signOut = useCallback(async () => {
    if (!begin()) return;
    setLogoutNotice(null);
    try { await services.auth.logout(); saveResult(null); setIdentity(null); router.replace("/login?status=signed-out"); }
    catch (error) { if (!isCancelled(error) && !handleError(error)) setLogoutNotice(adminNotice(error)); }
    finally { end(); }
  }, [begin, end, handleError, router, services]);

  const value = useMemo(() => identity ? {
    ...services, identity, busy, result, saveResult, accountQuery, setAccountQuery, handleError, begin, end, signOut, setSessionError: setSessionFailure,
  } : null, [services, identity, busy, result, accountQuery, handleError, begin, end, signOut, setSessionFailure]);

  if (!identity) {
    const code = sessionError?.code;
    const access: Record<string, [string, string]> = {
      FORBIDDEN: ["Bạn không có quyền truy cập", "Tài khoản hiện tại không có quyền quản trị tài khoản. Sử dụng tài khoản được cấp vai trò Quản trị viên."],
      AUTH_REQUIRED: ["Vui lòng đăng nhập", "Đăng nhập bằng tài khoản nhân sự để tiếp tục."],
      SESSION_EXPIRED: ["Phiên đăng nhập đã hết hạn", "Đăng nhập lại để tiếp tục quản trị."],
      ACCOUNT_LOCKED: ["Tài khoản đã bị khóa", "Bạn không thể tiếp tục thao tác. Liên hệ người quản trị hệ thống để được hỗ trợ."],
      PASSWORD_OUTCOME_UNKNOWN: ["Cần kiểm tra lại mật khẩu", "Mật khẩu có thể đã được đổi. Đăng nhập lại bằng mật khẩu mới trước khi gửi yêu cầu khác."],
    };
    const copy = code ? access[code] ?? ["Chưa thể kiểm tra phiên", "Kết nối chưa ổn định. Kiểm tra mạng rồi thử lại."] : ["Đang kiểm tra phiên…", "Vui lòng đợi trong giây lát."];
    return <main className={styles.access}><div className={styles.accessInner}>
      <p className={styles.accessBrand}>VLU · DormFlow</p>
      <section className={styles.panel} aria-busy={!sessionError}>
        <h1>{copy[0]}</h1><p className={styles.muted} role={sessionError ? "alert" : "status"}>{copy[1]}</p>
        {sessionError && <Link className={styles.primary} href={code === "PASSWORD_OUTCOME_UNKNOWN" ? "/login?reauth=1" : "/login"}>Về trang đăng nhập</Link>}
        {sessionError && <button type="button" className={styles.secondary} onClick={() => { setSessionError(null); setAttempt((n) => n + 1); }}>Kiểm tra lại phiên</button>}
      </section>
    </div></main>;
  }
  return <AdminContext.Provider value={value!}>
    {logoutNotice && <div className={styles.globalNotice} role="alert"><strong>{logoutNotice.title}</strong><p>{logoutNotice.message}</p><button className={styles.secondary} type="button" onClick={() => { setIdentity(null); setSessionError(null); setAttempt((n) => n + 1); }}>Kiểm tra lại phiên</button></div>}
    {children}
  </AdminContext.Provider>;
}
