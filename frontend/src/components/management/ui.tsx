"use client";
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api/client';
import { notice, labels } from '@/lib/management/presentation';
import { ManagementLink } from './management-shell';
import { useManagement } from './management-context';
import { Feedback } from '../admin/ui';
import styles from './management.module.css';
export { Icon, PageTitle, Feedback, PasswordField, FieldError, focusFirstError } from '../admin/ui';
export function BackToOverview() { return <ManagementLink href="/management" className={styles.secondary}>Về tổng quan</ManagementLink>; }
export function Badge({ value }: {
    value: string;
}) { return <span className={styles.badge} data-warn={['PENDING', 'UNPAID', 'REJECTED', 'INACTIVE', 'CANCELLED'].includes(value)}>{labels[value] ?? value}</span>; }
export function LoadState({ loading, error, retry }: {
    loading: boolean;
    error: unknown;
    retry: () => void;
}) { const { busy } = useManagement(); if (loading)
    return <div className={styles.loading} role="status" aria-busy="true"><p>Đang tải dữ liệu…</p><span /><span /></div>; if (error)
    return <Feedback notice={notice(error)}><button className={styles.secondary} disabled={busy} onClick={retry}>Tải lại thông tin</button></Feedback>; return null; }
export function Facts({ items }: {
    items: [
        string,
        ReactNode
    ][];
}) { return <dl className={styles.facts}>{items.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? 'Chưa có thông tin'}</dd></div>)}</dl>; }
export function serverFields(error: unknown) { const result: Record<string, string> = {}; if (error instanceof ApiError)
    for (const issue of error.details)
        result[issue.field] = 'Kiểm tra lại thông tin của trường này.'; return result; }
