"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { useStudent } from './student-context';
import { Icon } from './ui';
import styles from './student.module.css';
export function StudentLink({ children, onClick, ...props }: ComponentProps<typeof Link>) { const { busy } = useStudent(); return <Link {...props} aria-disabled={busy} onClick={e => { if (busy) {
    e.preventDefault();
    return;
} onClick?.(e); }}>{children}</Link>; }
const nav = [['', 'Trang chính', 'M3 11 12 3l9 8 M5 10v11h14V10 M9 21v-7h6v7'], ['rooms', 'Tìm phòng', 'M4 21V3h16v18 M8 7h2 M14 7h2 M8 11h2 M14 11h2 M9 21v-6h6v6'], ['applications', 'Đơn đăng ký', 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5'], ['residences', 'Lưu trú của tôi', 'M3 18V8h18v10 M3 14h18 M7 8V5h10v3 M3 18v3 M21 18v3'], ['receipts', 'Khoản phí của tôi', 'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 7h6 M9 11h6 M9 15h4'], ['profile', 'Hồ sơ cá nhân', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0']];
export function StudentShell({ children }: {
    children: ReactNode;
}) { const path = usePathname(), { identity, busy, signOut } = useStudent(); return <div className={styles.shell}><a href="#student-main" className={styles.skipLink}>Đến nội dung chính</a><aside className={styles.sidebar}><div className={styles.brand}><strong>VLU · DormFlow</strong><span>Cổng ký túc xá</span></div><nav className={styles.mainNav} aria-label="Điều hướng Sinh viên">{nav.map(([key, label, svg]) => <StudentLink key={key} href={'/student' + (key ? '/' + key : '')} className={styles.navItem} aria-current={(key ? path.startsWith('/student/' + key) : path === '/student') ? 'page' : undefined}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={svg}/></svg>{label}</StudentLink>)}</nav><div className={styles.sidebarBottom}><div className={styles.sidebarIdentity}><strong>{identity.displayName}</strong><span>{identity.identifier}</span></div><StudentLink href="/student/security" className={styles.navItem} aria-current={path === '/student/security' ? 'page' : undefined}><Icon name="lock"/>Đổi mật khẩu</StudentLink><button className={styles.navItem} disabled={busy} onClick={() => void signOut()}><Icon name="logout"/>Đăng xuất</button></div></aside><div className={styles.workspace}><header className={styles.topbar}><p className={styles.breadcrumb}>DormFlow <span>/</span> Không gian Sinh viên</p><span className={styles.userLabel}>{identity.identifier}</span></header><main id="student-main" className={styles.content}>{children}<footer className={styles.footer}><span>VLU · DormFlow / Cổng Sinh viên</span><span>An tâm từng bước lưu trú</span></footer></main></div></div>; }
