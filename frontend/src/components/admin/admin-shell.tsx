"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { useAdmin } from "./admin-context";
import { Icon } from "./ui";
import styles from "./admin.module.css";

export function AdminLink({ children, onClick, ...props }: ComponentProps<typeof Link>) {
  const { busy } = useAdmin();
  return <Link {...props} aria-disabled={busy} onClick={(event) => { if (busy) { event.preventDefault(); return; } onClick?.(event); }}>{children}</Link>;
}
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { identity, busy, signOut } = useAdmin();
  const creating = pathname === "/admin/accounts/new";
  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><strong>VLU · DormFlow</strong><span>Quản trị hệ thống</span></div>
      <nav className={styles.mainNav} aria-label="Điều hướng quản trị">
        <AdminLink href="/admin/accounts" className={styles.navItem} aria-current={pathname.startsWith("/admin/accounts") && !creating ? "page" : undefined}><Icon name="users" />Tài khoản</AdminLink>
        <AdminLink href="/admin/accounts/new" className={styles.navItem} aria-current={creating ? "page" : undefined}><Icon name="plus" />Cấp tài khoản</AdminLink>
      </nav>
      <div className={styles.sidebarBottom}>
        <div className={styles.sidebarIdentity}><strong>{identity.displayName}</strong><span>{identity.identifier}</span></div>
        <AdminLink href="/admin/security" className={styles.navItem} aria-current={pathname === "/admin/security" ? "page" : undefined}><Icon name="shield" />Đổi mật khẩu</AdminLink>
        <button type="button" className={styles.navItem} disabled={busy} onClick={() => void signOut()}><Icon name="logout" />Đăng xuất</button>
      </div>
    </aside>
    <div className={styles.workspace}>
      <header className={styles.topbar}><p className={styles.breadcrumb}>DormFlow <span>/</span> Không gian quản trị</p><span className={styles.userLabel}>Quản trị viên hệ thống</span></header>
      <main className={styles.content}>{children}<footer className={styles.footer}><span>VLU · DormFlow</span><span>Chỉ quản lý tài khoản và quyền truy cập</span></footer></main>
    </div>
  </div>;
}
