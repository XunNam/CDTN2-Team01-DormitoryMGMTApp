"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import type { AccountType, Role } from "@/lib/auth/types";
import { ROLE_LABELS } from "@/lib/auth/types";
import { accountPath, accountRef } from "@/lib/admin/types";
import { useAdmin } from "./admin-context";
import { useResource } from "./hooks";
import { AdminLink } from "./admin-shell";
import { Icon, PageTitle, LoadState, StatusBadge, dateLabel } from "./ui";
import styles from "./admin.module.css";

export function AccountsList() {
  const { admin, identity, busy, accountQuery: query, setAccountQuery: setQuery } = useAdmin();
  const [draft, setDraft] = useState(query.q ?? "");
  const [searchError, setSearchError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const load = useCallback((signal: AbortSignal) => admin.listAccounts(query, signal), [admin, query]);
  const resource = useResource(JSON.stringify(query), load);
  const { data, meta } = resource.data ?? { data: [], meta: null };
  function reset() { setDraft(""); setSearchError(""); setQuery({ page: 1, pageSize: query.pageSize }); }
  function search(event: FormEvent) {
    event.preventDefault();
    if ([...draft].length > 100) { setSearchError("Nhập tối đa 100 ký tự để tìm tài khoản."); searchRef.current?.focus(); return; }
    setSearchError(""); setQuery({ ...query, q: draft.trim() || undefined, page: 1 });
  }
  return <div className={styles.stack}>
    <PageTitle title="Tài khoản người dùng" description="Tra cứu, cấp và quản lý quyền truy cập vào DormFlow." action={<AdminLink href="/admin/accounts/new" className={styles.primary}><Icon name="plus" />Cấp tài khoản</AdminLink>} />
    <section className={styles.panel} aria-label="Tìm kiếm và bộ lọc">
      <form onSubmit={search} className={styles.searchRow} noValidate>
        <div className={styles.field}><label htmlFor="account-query">Tìm tài khoản</label><input ref={searchRef} id="account-query" value={draft} disabled={busy} onChange={(event) => setDraft(event.target.value)} placeholder="Tìm theo tên hoặc mã đăng nhập" aria-invalid={Boolean(searchError)} aria-describedby={searchError ? "account-query-error" : undefined} />{searchError && <p id="account-query-error" className={styles.fieldError}>{searchError}</p>}</div>
        <button type="submit" className={styles.primary} disabled={busy}><Icon name="search" />Tìm kiếm</button>
      </form>
      <div className={styles.filters}>
        <div className={styles.field}><label htmlFor="source-filter">Nhóm tài khoản</label><select id="source-filter" value={query.actorKind ?? ""} disabled={busy} onChange={(event) => setQuery({ ...query, actorKind: (event.target.value || undefined) as AccountType | undefined, page: 1 })}><option value="">Tất cả nhóm</option><option value="STUDENT">Sinh viên</option><option value="STAFF">Nhân sự</option></select></div>
        <div className={styles.field}><label htmlFor="role-filter">Vai trò</label><select id="role-filter" value={query.role ?? ""} disabled={busy} onChange={(event) => setQuery({ ...query, role: (event.target.value || undefined) as Role | undefined, page: 1 })}><option value="">Tất cả vai trò</option><option value="SV">Sinh viên</option><option value="BQL">Ban quản lý</option><option value="ADMIN">Quản trị viên</option></select></div>
        <div className={styles.field}><label htmlFor="status-filter">Trạng thái</label><select id="status-filter" value={query.isLocked === undefined ? "" : String(query.isLocked)} disabled={busy} onChange={(event) => setQuery({ ...query, isLocked: event.target.value === "" ? undefined : event.target.value === "true", page: 1 })}><option value="">Tất cả trạng thái</option><option value="false">Hoạt động</option><option value="true">Bị khóa</option></select></div>
        <button type="button" className={styles.secondary} onClick={reset} disabled={busy}>Xóa bộ lọc</button>
      </div>
    </section>
    <section className={styles.panel + " " + styles.tablePanel} aria-label="Kết quả tra cứu tài khoản">
      <header className={styles.tableHeading}><h2>Danh sách tài khoản</h2><span className={styles.muted} aria-live="polite">{meta ? meta.totalItems + " tài khoản" : "Chưa có dữ liệu cập nhật"}</span></header>
      <LoadState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {!resource.loading && !resource.error && data.length === 0 && <div className={styles.empty}><h3>Không tìm thấy tài khoản</h3><p className={styles.muted}>{meta && meta.totalItems > 0 ? "Trang này không còn dữ liệu. Quay về trang đầu để tiếp tục." : "Thử từ khóa khác hoặc xóa bớt điều kiện lọc."}</p><button type="button" className={styles.secondary} disabled={busy} onClick={meta && meta.totalItems > 0 ? () => setQuery({ ...query, page: 1 }) : reset}>{meta && meta.totalItems > 0 ? "Về trang đầu" : "Xóa bộ lọc"}</button></div>}
      {!resource.loading && !resource.error && data.length > 0 && <div className={styles.tableRegion} role="region" aria-label="Bảng tài khoản, cuộn ngang để xem đầy đủ" tabIndex={0}>
        <table className={styles.table}><caption className={styles.srOnly}>Tài khoản khớp điều kiện tìm kiếm</caption><thead><tr><th scope="col">Người dùng</th><th scope="col">Nhóm</th><th scope="col">Vai trò</th><th scope="col">Trạng thái</th><th scope="col">Ngày cấp</th><th scope="col">Thao tác</th></tr></thead>
          <tbody>{data.map((account) => {
            const path = accountPath(accountRef(account));
            const isMe = identity.actorKind === account.actorKind && identity.accountId === account.id;
            return <tr key={account.actorKind + ":" + account.id}>
              <td><AdminLink className={styles.accountName} href={path} aria-label={"Xem tài khoản " + account.identifier}><strong>{account.displayName}</strong><span>{account.identifier}{isMe && <em> · Bạn</em>}</span></AdminLink></td>
              <td>{account.actorKind === "STUDENT" ? "Sinh viên" : "Nhân sự"}</td><td>{ROLE_LABELS[account.role]}</td><td><StatusBadge locked={account.isLocked} /></td><td className={styles.tableDate}>{dateLabel(account.createdAt)}</td>
              <td><AdminLink href={path + (account.isLocked ? "/unlock" : "/lock")} className={account.isLocked ? styles.unlockButton : styles.lockButton}>{account.isLocked ? "Mở khóa" : "Khóa tài khoản"}</AdminLink></td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
      {meta && <footer className={styles.pagination}><span className={styles.muted}>{data.length ? `Hiển thị ${(meta.page - 1) * meta.pageSize + 1}–${(meta.page - 1) * meta.pageSize + data.length} trong ${meta.totalItems} tài khoản` : "Không có kết quả trên trang này"}</span><div className={styles.pager}>
        <label htmlFor="page-size">Mỗi trang</label><select id="page-size" className={styles.compactSelect} value={query.pageSize} disabled={busy} onChange={(event) => setQuery({ ...query, page: 1, pageSize: Number(event.target.value) })}><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option></select>
        <button type="button" className={styles.secondary} aria-label="Trang trước" disabled={busy || resource.loading || meta.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>‹</button><span>Trang {meta.page}/{Math.max(1, meta.totalPages)}</span>
        <button type="button" className={styles.secondary} aria-label="Trang sau" disabled={busy || resource.loading || meta.page >= meta.totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>›</button>
      </div></footer>}
    </section>
    <p className={styles.note}><Icon name="shield" />Khóa tài khoản ngăn truy cập; hồ sơ sinh viên, lịch sử lưu trú và phiếu thu được giữ nguyên.</p>
  </div>;
}
