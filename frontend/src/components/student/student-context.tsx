"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, createSessionClient, isCancelled } from '@/lib/api/client';
import { createAuthClient } from '@/lib/auth/client';
import { createStudentClient, type StudentClient } from '@/lib/student/client';
import { studentNotice } from '@/lib/student/presentation';
import type { Identity } from '@/lib/auth/types';
import type { Notice } from '@/lib/auth/notices';
import styles from './student.module.css';
function services() { const api = createSessionClient(); return { api, auth: createAuthClient(fetch, 15000, api) }; }
interface Value extends ReturnType<typeof services> {
    student: StudentClient;
    identity: Identity;
    busy: boolean;
    begin: () => boolean;
    end: () => void;
    handleError: (e: unknown) => boolean;
    setSessionError: (e: ApiError) => void;
    signOut: () => Promise<void>;
}
const Context = createContext<Value | null>(null);
export function useStudent() { const value = useContext(Context); if (!value)
    throw new Error('Student requires protected SV layout.'); return value; }
export function StudentProvider({ children }: {
    children: ReactNode;
}) {
    const [clients] = useState(services), [identity, setIdentity] = useState<Identity | null>(null), [error, setError] = useState<ApiError | null>(null), [attempt, setAttempt] = useState(0), [busy, setBusy] = useState(false), [logoutError, setLogoutError] = useState<Notice | null>(null);
    const work = useRef(false), router = useRouter();
    const setSessionError = useCallback((e: ApiError) => { setIdentity(null); setError(e); clients.api.clearCsrf(); }, [clients]);
    const handleError = useCallback((e: unknown) => { if (e instanceof ApiError && (e.status === 401 || e.status === 403 && e.code === 'FORBIDDEN')) {
        setSessionError(e);
        return true;
    } return false; }, [setSessionError]);
    const begin = useCallback(() => { if (work.current)
        return false; work.current = true; setBusy(true); return true; }, []), end = useCallback(() => { work.current = false; setBusy(false); }, []);
    useEffect(() => { const controller = new AbortController(); void clients.auth.getCurrentIdentity(controller.signal).then(current => { if (controller.signal.aborted)
        return; if (current.role !== 'SV' || current.actorKind !== 'STUDENT' || !current.studentId) {
        setError(new ApiError('FORBIDDEN', 403));
        return;
    } setIdentity(current); setError(null); }).catch(e => { if (!controller.signal.aborted && !isCancelled(e))
        setError(e instanceof ApiError ? e : new ApiError('INTERNAL_ERROR')); }); return () => controller.abort(); }, [clients, attempt]);
    const signOut = useCallback(async () => { if (!begin())
        return; try {
        setLogoutError(null);
        await clients.auth.logout();
        setIdentity(null);
        router.replace('/login?status=signed-out');
    }
    catch (e) {
        if (!handleError(e))
            setLogoutError(studentNotice(e));
    }
    finally {
        end();
    } }, [begin, end, clients, handleError, router]);
    const student = useMemo(() => identity ? createStudentClient(clients.api, identity.studentId!) : null, [clients, identity]);
    const value = useMemo(() => identity && student ? { ...clients, student, identity, busy, begin, end, handleError, setSessionError, signOut } : null, [clients, student, identity, busy, begin, end, handleError, setSessionError, signOut]);
    if (!identity) {
        const messages: Record<string, [
            string,
            string
        ]> = { FORBIDDEN: ['Bạn không có quyền truy cập', 'Không gian này dành cho tài khoản Sinh viên.'], AUTH_REQUIRED: ['Vui lòng đăng nhập', 'Sử dụng tài khoản Sinh viên đã được cấp để tiếp tục.'], SESSION_EXPIRED: ['Phiên đăng nhập đã hết hạn', 'Đăng nhập lại để tiếp tục theo dõi hồ sơ.'], ACCOUNT_LOCKED: ['Tài khoản đã bị khóa', 'Liên hệ Ban quản lý ký túc xá để được hướng dẫn.'], PASSWORD_OUTCOME_UNKNOWN: ['Cần kiểm tra lại mật khẩu', 'Đăng nhập lại bằng mật khẩu mới trước khi thao tác tiếp.'] };
        const text = error ? (messages[error.code] ?? ['Chưa thể kiểm tra phiên', 'Kiểm tra kết nối rồi thử lại.']) : ['Đang kiểm tra phiên…', 'Vui lòng đợi trong giây lát.'];
        return <main className={styles.access}><div className={styles.accessInner}><p className={styles.accessBrand}>VLU · DormFlow</p><section className={styles.panel}><h1>{text[0]}</h1><p role={error ? 'alert' : 'status'}>{text[1]}</p>{error && <><Link className={styles.primary} href={error.code === 'PASSWORD_OUTCOME_UNKNOWN' ? '/login?reauth=1' : '/login'}>Về trang đăng nhập</Link><button className={styles.secondary} onClick={() => { setError(null); setAttempt(n => n + 1); }}>Kiểm tra lại phiên</button></>}</section></div></main>;
    }
    return <Context.Provider value={value!}>{logoutError && <div className={styles.globalNotice} role="alert"><strong>{logoutError.title}</strong><p>{logoutError.message}</p><button className={styles.secondary} onClick={() => { setIdentity(null); setError(null); setLogoutError(null); setAttempt(n => n + 1); }}>Kiểm tra lại phiên</button></div>}{children}</Context.Provider>;
}
