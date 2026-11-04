"use client";
import { useCallback, useState } from 'react';
import type { Collection, Entity, Query } from '@/lib/management/client';
import { labels } from '@/lib/management/presentation';
import { useManagement } from './management-context';
import { useResource } from './hooks';
import { summary, hydrate } from './data';
import { LoadState } from './ui';
import styles from './management.module.css';
export function Picker({ collection, label, value, onSelect, query = {}, eligible, disabled = false }: {
    collection: Collection;
    label: string;
    value: string;
    onSelect: (item: Entity) => void;
    query?: Query;
    eligible?: (item: Entity) => boolean;
    disabled?: boolean;
}) {
    const { management } = useManagement();
    const [page, setPage] = useState(1), [search, setSearch] = useState(''), [draft, setDraft] = useState(''), [state, setState] = useState(collection === 'residences' ? 'ALLOCATED' : '');
    const key = JSON.stringify(query);
    const searchable = ['student-profiles', 'buildings', 'rooms'].includes(collection);
    const load = useCallback(async (signal: AbortSignal) => { const result = await management.list(collection, { ...JSON.parse(key), page, pageSize: 5, ...(searchable && search ? { q: search } : {}), ...(collection === 'residences' ? { status: state } : {}) }, signal); return { ...result, related: await hydrate(management, collection, result.data, signal) }; }, [management, collection, key, page, searchable, search, state]);
    const resource = useResource(collection + key + page + search + state, load);
    return <fieldset className={styles.group} disabled={disabled}><legend>{label} *</legend>{searchable && <div className={styles.pickerSearch}><label className={styles.field}>Tìm {label.toLowerCase()}<input value={draft} maxLength={100} onChange={e => setDraft(e.target.value)}/></label><button className={styles.secondary} type="button" onClick={() => { setSearch(draft.trim()); setPage(1); }}>Tìm lựa chọn</button></div>}{collection === 'residences' && <div className={styles.field}><label htmlFor="picker-residence-status">Trạng thái lưu trú</label><select id="picker-residence-status" value={state} onChange={e => { setState(e.target.value); setPage(1); }}><option value="ALLOCATED">Đã xếp phòng</option><option value="CHECKED_IN">Đang ở</option></select></div>}
    <LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{resource.data?.data.map(item => { const text = summary(item, resource.data?.related); const valid = !eligible || eligible(item); return <label className={styles.candidate} key={item.id}><input type="radio" name={collection + '-choice'} checked={value === item.id} disabled={disabled || !valid} onChange={() => onSelect(item)}/><span><strong>{text[0]}</strong><span>{text[1]} · {labels[text[3]] ?? text[3]}{'feeVnd' in item ? ' · Còn ' + item.availablePlaces + '/' + item.capacity + ' chỗ' : ''}</span>{!valid && <span>Không đủ điều kiện lựa chọn</span>}</span></label>; })}
    {resource.data && !resource.data.data.length && <p className={styles.muted}>Không có lựa chọn phù hợp.</p>}{resource.data && <div className={styles.pager}><button type="button" className={styles.secondary} disabled={disabled || resource.loading || page <= 1} onClick={() => setPage(p => p - 1)}>Lựa chọn trước</button><span>Trang {page}/{Math.max(1, resource.data.meta.totalPages)}</span><button type="button" className={styles.secondary} disabled={disabled || resource.loading || page >= resource.data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Lựa chọn sau</button></div>}
  </fieldset>;
}
