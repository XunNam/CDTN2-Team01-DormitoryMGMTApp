"use client";
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api/client';
import { studentNotice, labels } from '@/lib/student/presentation';
import { StudentLink } from './student-shell';
import { useStudent } from './student-context';
import { Feedback } from '../admin/ui';
import styles from './student.module.css';
export { Icon, PageTitle, Feedback, PasswordField, FieldError, focusFirstError } from '../admin/ui';
export function BackToHome() { return <StudentLink href="/student" className={styles.secondary}>Về trang chính</StudentLink>; }
export function Badge({ value }: {
    value: string;
}) { return <span className={styles.badge} data-warn={['PENDING', 'REJECTED', 'UNPAID', 'CANCELLED', 'CLOSED'].includes(value)}>{labels[value] ?? value}</span>; }
export function LoadState({ loading, error, retry }: {
    loading: boolean;
    error: unknown;
    retry: () => void;
}) { const { busy } = useStudent(); if (loading)
    return <div className={styles.loading} role="status" aria-busy="true"><p>Đang tải dữ liệu…</p><span /><span /></div>; if (error)
    return <Feedback notice={studentNotice(error)}><button type="button" className={styles.secondary} disabled={busy} onClick={retry}>Tải lại thông tin</button></Feedback>; return null; }
export function Facts({ items }: {
    items: [
        string,
        ReactNode
    ][];
}) { return <dl className={styles.facts}>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'Chưa có thông tin'}</dd></div>)}</dl>; }
export function serverFields(error: unknown) { const fields: Record<string, string> = {}; if (error instanceof ApiError)
    for (const issue of error.details)
        fields[issue.field] = 'Kiểm tra lại thông tin của trường này.'; return fields; }
export function Pager({ meta, loading, onPage, onSize, id }: {
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
    };
    loading: boolean;
    onPage: (page: number) => void;
    onSize: (size: number) => void;
    id: string;
}) { const { busy } = useStudent(); return <footer className={styles.pagination}><span className={styles.muted}>{meta.totalItems} kết quả</span><div className={styles.pager}><label htmlFor={id}>Mỗi trang</label><select id={id} className={styles.compactSelect} disabled={busy || loading} value={meta.pageSize} onChange={e => onSize(Number(e.target.value))}>{[5, 10, 20, 50, 100].map(n => <option key={n}>{n}</option>)}</select><button type="button" className={styles.secondary} disabled={busy || loading || meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Trang trước</button><span>Trang {meta.page}/{Math.max(1, meta.totalPages)}</span><button type="button" className={styles.secondary} disabled={busy || loading || meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Trang sau</button></div></footer>; }
