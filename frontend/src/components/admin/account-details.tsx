"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError, isCancelled } from "@/lib/api/client";
import type { AccountRef } from "@/lib/admin/types";
import { accountKey, accountPath, accountRef } from "@/lib/admin/types";
import type { AccountType } from "@/lib/auth/types";
import type { Notice } from "@/lib/auth/notices";
import { ROLE_LABELS } from "@/lib/auth/types";
import { adminNotice } from "@/lib/admin/notices";
import { useAdmin } from "./admin-context";
import { useResource, useTask } from "./hooks";
import { AdminLink } from "./admin-shell";
import { AccountFacts, BackToAccounts, Feedback, Icon, LoadState, PageTitle, StatusBadge } from "./ui";
import styles from "./admin.module.css";

function useAccountReference() {
  const params = useParams<{ actorKind: string; accountId: string }>();
  return useMemo<AccountRef>(() => ({ actorKind: params.actorKind as AccountType, accountId: params.accountId }), [params.actorKind, params.accountId]);
}
function useAccount() {
  const ref = useAccountReference();
  const { admin } = useAdmin();
  const load = useCallback((signal: AbortSignal) => admin.getAccount(ref, signal), [admin, ref]);
  return { ...useResource(accountKey(ref), load), ref };
}
export function AccountDetail() {
  const resource = useAccount();
  const account = resource.data;
  return <div className={styles.stack + " " + styles.narrow}><div><BackToAccounts /></div>
    <PageTitle title={account?.displayName ?? "Thông tin tài khoản"} description="Kiểm tra danh tính và quyền truy cập." />
    <LoadState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {account && <section className={styles.panel}><div className={styles.accountHeader}><h2>{account.identifier}</h2><StatusBadge locked={account.isLocked} /></div><AccountFacts account={account} /><p className={styles.muted}>Vai trò được gán khi cấp tài khoản và không thể thay đổi.</p><div><AdminLink href={accountPath(resource.ref) + (account.isLocked ? "/unlock" : "/lock")} className={account.isLocked ? styles.unlockButton : styles.lockButton}>{account.isLocked ? "Mở khóa" : "Khóa tài khoản"}</AdminLink></div></section>}
  </div>;
}
export function AccountLock({ targetLocked }: { targetLocked: boolean }) {
  const resource = useAccount();
  const { admin, identity, busy, handleError, saveResult } = useAdmin();
  const run = useTask();
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const account = resource.data;
  const isSelf = account?.actorKind === identity.actorKind && account?.id === identity.accountId;
  const alreadyMatches = account?.isLocked === targetLocked;
  async function submit() {
    if (!account || alreadyMatches || uncertain || needsRefresh || busy) return;
    setNotice(null);
    try {
      const updated = await run((signal) => admin.setAccountLock(resource.ref, targetLocked, signal));
      saveResult({ account: updated, action: targetLocked ? "locked" : "unlocked" });
      router.replace(accountPath(resource.ref) + "/result");
    } catch (error) {
      if (isCancelled(error) || handleError(error)) return;
      setNotice(adminNotice(error));
      if (error instanceof ApiError && error.code === "LOCK_OUTCOME_UNKNOWN") setUncertain(true);
      if (error instanceof ApiError && error.code === "INVALID_STATE") setNeedsRefresh(true);
    }
  }
  async function verify() {
    setNotice(null);
    try {
      const current = await run((signal) => admin.getAccount(resource.ref, signal));
      if (current.isLocked === targetLocked) {
        saveResult({ account: current, action: "verified" });
        router.replace(accountPath(resource.ref) + "/result");
      } else {
        setUncertain(false); resource.reload();
        setNotice({ title: "Đã kiểm tra trạng thái", message: "Trạng thái hiện tại chưa khớp yêu cầu trước. Kiểm tra thông tin và chỉ xác nhận lại nếu bạn muốn tiếp tục.", tone: "info" });
      }
    } catch (error) { if (!isCancelled(error) && !handleError(error)) setNotice(adminNotice(error)); }
  }
  return <div className={styles.stack + " " + styles.narrow}><div><BackToAccounts /></div>
    <PageTitle title={targetLocked ? "Khóa tài khoản?" : "Mở khóa tài khoản?"} description="Kiểm tra đúng người dùng trước khi tiếp tục." />
    {notice && <Feedback notice={notice}><button type="button" className={styles.secondary} disabled={busy} onClick={uncertain ? () => void verify() : () => { setNotice(null); setNeedsRefresh(false); resource.reload(); }}>{uncertain ? "Kiểm tra trạng thái" : "Tải lại thông tin"}</button></Feedback>}
    <LoadState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {account && <section className={styles.panel}>
      <div className={styles.identityHeading}><Icon name="lock" /><div><h2>{account.identifier}</h2><p className={styles.muted}>{account.displayName}</p></div></div>
      <div className={styles.twoColumns}><div><p className={styles.muted}>Vai trò</p><strong>{ROLE_LABELS[account.role]}</strong></div><div><p className={styles.muted}>Trạng thái hiện tại</p><StatusBadge locked={account.isLocked} /></div></div>
      <div className={styles.impact} data-danger={targetLocked}><strong>{targetLocked ? "Ngăn các thao tác tiếp theo" : "Cho phép truy cập trở lại"}</strong><p>{targetLocked ? "Người dùng bị từ chối khi thực hiện thao tác bảo vệ tiếp theo. Hồ sơ, lịch sử lưu trú và phiếu thu được giữ nguyên." : "Người dùng có thể đăng nhập bằng thông tin hiện có. Hồ sơ và dữ liệu lưu trú không thay đổi."}</p></div>
      {targetLocked && isSelf && <Feedback notice={{ title: "Đây là tài khoản bạn đang sử dụng.", message: "Sau khi khóa, thao tác tiếp theo của bạn sẽ bị từ chối. Bạn vẫn có thể xác nhận nếu muốn tiếp tục.", tone: "error" }} />}
      {alreadyMatches && <Feedback notice={{ title: "Trạng thái đã thay đổi", message: targetLocked ? "Tài khoản hiện đã bị khóa. Không cần gửi lại thao tác khóa." : "Tài khoản hiện đang hoạt động. Không cần gửi lại thao tác mở khóa.", tone: "info" }} />}
      <div className={styles.actions}><button type="button" className={targetLocked ? styles.danger : styles.primary} disabled={busy || alreadyMatches || uncertain || needsRefresh} aria-busy={busy} onClick={() => void submit()}>{busy ? "Đang cập nhật…" : targetLocked ? isSelf ? "Khóa tài khoản của tôi" : "Xác nhận khóa" : "Xác nhận mở khóa"}</button><AdminLink className={styles.secondary} href={accountPath(resource.ref)}>Quay lại thông tin tài khoản</AdminLink></div>
    </section>}
  </div>;
}
export function AccountResultPage() {
  const ref = useAccountReference();
  const { admin, result } = useAdmin();
  const confirmed = result && accountKey(accountRef(result.account)) === accountKey(ref) ? result : null;
  const load = useCallback((signal: AbortSignal) => confirmed ? Promise.resolve(confirmed.account) : admin.getAccount(ref, signal), [admin, ref, confirmed]);
  const resource = useResource(accountKey(ref) + ":" + (confirmed?.action ?? "current"), load);
  const account = resource.data;
  const action = confirmed?.action;
  const title = action === "created" ? "Cấp tài khoản thành công" : action === "locked" ? "Khóa tài khoản thành công" : action === "unlocked" ? "Mở khóa thành công" : "Trạng thái tài khoản hiện tại";
  return <div className={styles.stack + " " + styles.narrow}>
    <PageTitle title={title} description={confirmed && action !== "verified" ? "Thay đổi đã được ghi nhận." : "Thông tin được đọc lại từ hệ thống."} />
    <LoadState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {account && <section className={styles.panel}>
      <div className={styles.successHeading}><span className={styles.successIcon}><Icon name="check" /></span><div><h2>{account.identifier}</h2><p>{account.displayName}</p></div></div>
      <p role="status">{action === "created" ? "Tài khoản đã sẵn sàng đăng nhập. Mật khẩu không hiển thị lại trên màn hình này." : account.isLocked ? "Tài khoản đang bị khóa. Người dùng bị từ chối ở thao tác bảo vệ tiếp theo." : "Tài khoản hiện đang hoạt động."}</p>
      {action === "verified" && <p className={styles.muted}>Đã tìm thấy trạng thái tương ứng. Kết quả đọc lại không xác định ai đã thực hiện thay đổi.</p>}
      <div className={styles.summary}><div><span className={styles.muted}>Vai trò</span><strong>{ROLE_LABELS[account.role]}</strong></div><div><span className={styles.muted}>Trạng thái</span><span><StatusBadge locked={account.isLocked} /></span></div></div>
      <div className={styles.actions}><AdminLink href="/admin/accounts" className={styles.primary}>Về danh sách tài khoản</AdminLink><AdminLink href={accountPath(ref)} className={styles.secondary}>Xem tài khoản</AdminLink><AdminLink href={accountPath(ref) + (account.isLocked ? "/unlock" : "/lock")} className={styles.secondary}>{account.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}</AdminLink></div>
    </section>}
  </div>;
}
