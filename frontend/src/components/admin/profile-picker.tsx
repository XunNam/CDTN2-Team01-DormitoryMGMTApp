"use client";

import { useCallback, useState } from "react";
import type { CandidateQuery, ProfileCandidate } from "@/lib/admin/types";
import { useAdmin } from "./admin-context";
import { useResource } from "./hooks";
import { FieldError, LoadState } from "./ui";
import styles from "./admin.module.css";

export function ProfilePicker({ selected, onSelect, disabled, error, epoch }: {
  selected: ProfileCandidate | null; onSelect: (candidate: ProfileCandidate | null) => void; disabled: boolean; error?: string; epoch: number;
}) {
  const { admin } = useAdmin();
  const [draft, setDraft] = useState("");
  const [searchError, setSearchError] = useState("");
  const [query, setQuery] = useState<CandidateQuery>({ page: 1, pageSize: 3 });
  const load = useCallback((signal: AbortSignal) => admin.listCandidates(query, signal), [admin, query]);
  const resource = useResource(JSON.stringify(query) + ":" + epoch, load);
  const page = resource.data;
  function search() {
    if ([...draft].length > 100) { setSearchError("Từ khóa không được vượt quá 100 ký tự."); return; }
    setSearchError(""); setQuery({ page: 1, pageSize: 3, q: draft.trim() || undefined });
  }
  return <fieldset className={styles.group} disabled={disabled} aria-describedby="candidate-hint">
    <legend>Chọn hồ sơ sinh viên *</legend>
    <div className={styles.candidates}>
      <div className={styles.searchRow}><div className={styles.field}><label className={styles.srOnly} htmlFor="candidate-query">Tìm hồ sơ sinh viên</label><input id="candidate-query" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tìm bằng MSSV hoặc họ tên" aria-invalid={Boolean(searchError)} aria-describedby={searchError ? "candidate-query-error" : undefined} /><FieldError id="candidate-query-error" message={searchError} /></div><button type="button" className={styles.secondary} onClick={search}>Tìm hồ sơ</button></div>
      <p id="candidate-hint" className={styles.muted}>Chỉ hiển thị hồ sơ chưa được cấp tài khoản.</p>
      <LoadState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {page?.data.map((candidate) => <label className={styles.candidate} key={candidate.id}>
        <input type="radio" name="studentId" value={candidate.id} checked={selected?.id === candidate.id} onChange={() => onSelect(candidate)} />
        <span><strong>{candidate.studentCode}</strong><span>{candidate.fullName}</span></span>
      </label>)}
      {page && !page.data.length && <div className={styles.impact}><strong>Không tìm thấy hồ sơ phù hợp</strong><p>Kiểm tra MSSV hoặc liên hệ Ban quản lý để tạo hồ sơ trước.</p></div>}
      {page && <div className={styles.actions}><span className={styles.muted}>{page.data.length ? `Hồ sơ ${(page.meta.page - 1) * page.meta.pageSize + 1}–${(page.meta.page - 1) * page.meta.pageSize + page.data.length} / ${page.meta.totalItems}` : "Không có hồ sơ đủ điều kiện"}</span><button type="button" className={styles.secondary} disabled={disabled || resource.loading || page.meta.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Trước</button><button type="button" className={styles.secondary} disabled={disabled || resource.loading || page.meta.page >= page.meta.totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Sau</button></div>}
      {selected && <div className={styles.readonly}><span>Đã chọn</span><strong>{selected.studentCode} · {selected.fullName}</strong><button type="button" className={styles.secondary} onClick={() => onSelect(null)}>Bỏ chọn</button></div>}
      <FieldError id="student-error" message={error} />
    </div>
  </fieldset>;
}
