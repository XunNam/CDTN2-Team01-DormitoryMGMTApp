"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { useManagement } from './management-context';
import { Icon } from './ui';
import styles from './management.module.css';
export function ManagementLink({ children, onClick, ...props }: ComponentProps<typeof Link>) { const { busy } = useManagement(); return <Link {...props} aria-disabled={busy} onClick={e => { if (busy) {
    e.preventDefault();
    return;
} onClick?.(e); }}>{children}</Link>; }
const nav = [['', 'Tổng quan'], ['student-profiles', 'Hồ sơ sinh viên'], ['rooms', 'Tòa nhà và phòng'], ['applications', 'Đơn đăng ký'], ['residences', 'Quá trình lưu trú'], ['receipts', 'Phiếu thu'], ['registration-period', 'Kỳ đăng ký'], ['statistics', 'Thống kê']];
export function ManagementShell({ children }: {
    children: ReactNode;
}) { const path = usePathname(), { identity, busy, signOut } = useManagement(); return <div className={styles.shell}><a href="#management-main" className={styles.skipLink}>Đến nội dung chính</a><aside className={styles.sidebar}><div className={styles.brand}><strong>VLU · DormFlow</strong><span>Cổng ký túc xá</span></div><nav className={styles.mainNav} aria-label="Điều hướng Ban quản lý">{nav.map(([key, label]) => <ManagementLink key={key} href={'/management' + (key ? '/' + key : '')} className={styles.navItem} aria-current={(key ? path.startsWith('/management/' + key) || (key === 'rooms' && path.includes('/buildings')) : path === '/management') ? 'page' : undefined}><Icon name={key === 'student-profiles' ? 'users' : key === 'receipts' ? 'check' : 'shield'}/>{label}</ManagementLink>)}</nav><div className={styles.sidebarBottom}><div className={styles.sidebarIdentity}><strong>{identity.displayName}</strong><span>{identity.identifier}</span></div><ManagementLink href="/management/security" className={styles.navItem} aria-current={path === '/management/security' ? 'page' : undefined}><Icon name="lock"/>Đổi mật khẩu</ManagementLink><button className={styles.navItem} disabled={busy} onClick={() => void signOut()}><Icon name="logout"/>Đăng xuất</button></div></aside><div className={styles.workspace}><header className={styles.topbar}><p className={styles.breadcrumb}>DormFlow <span>/</span> Quản lý lưu trú</p><span className={styles.userLabel}>Ban quản lý ký túc xá</span></header><main id="management-main" className={styles.content}>{children}<footer className={styles.footer}><span>VLU · DormFlow / Ban quản lý</span><span>Hồ sơ · Lưu trú · Thu phí</span></footer></main></div></div>; }
