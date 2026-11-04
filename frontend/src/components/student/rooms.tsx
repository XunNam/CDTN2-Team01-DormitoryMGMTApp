"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, isCancelled } from '@/lib/api/client';
import { registrationBlock, type Query, type StudentClient } from '@/lib/student/client';
import { labels, money, studentNotice } from '@/lib/student/presentation';
import type { Room } from '@/lib/student/schema';
import type { Notice } from '@/lib/auth/notices';
import { useStudent } from './student-context';
import { useResource, useTask } from './hooks';
import { StudentLink } from './student-shell';
import { Badge, Facts, Feedback, LoadState, PageTitle, Pager } from './ui';
import styles from './student.module.css';
function BuildingFilter({ value, onChange, disabled }: {
    value: string;
    onChange: (id: string) => void;
    disabled: boolean;
}) {
    const { student } = useStudent(), [page, setPage] = useState(1);
    const load = useCallback((signal: AbortSignal) => student.list('buildings', { page, pageSize: 20 }, signal), [student, page]);
    const resource = useResource('buildings' + page, load);
    return <div className={styles.field}><label htmlFor="building">Tòa nhà</label><select id="building" disabled={disabled || resource.loading} value={value} onChange={e => onChange(e.target.value)}><option value="">Tất cả tòa nhà</option>{value && !resource.data?.data.some(b => b.id === value) && <option value={value}>Tòa đã chọn</option>}{resource.data?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>{!!resource.error && <button type="button" className={styles.secondary} onClick={resource.reload}>Tải lại tòa nhà</button>}{resource.data && resource.data.meta.totalPages > 1 && <div className={styles.actions}><button type="button" disabled={disabled || page <= 1} className={styles.secondary} onClick={() => setPage(n => n - 1)}>Tòa trước</button><span className={styles.muted}>{page}/{resource.data.meta.totalPages}</span><button type="button" disabled={disabled || page >= resource.data.meta.totalPages} className={styles.secondary} onClick={() => setPage(n => n + 1)}>Tòa sau</button></div>}</div>;
}
export function Rooms() {
    const { student, busy } = useStudent(), [query, setQuery] = useState<Query>({ page: 1, pageSize: 5, gender: 'SELF', hasAvailability: true }), [draft, setDraft] = useState(''), [error, setError] = useState('');
    const search = useRef<HTMLInputElement>(null), key = JSON.stringify(query);
    const load = useCallback(async (signal: AbortSignal) => { const context = await student.eligibility(signal); const q: Query = JSON.parse(key); if (q.gender === 'SELF')
        q.gender = context.student.gender; return { context, ...await student.list('rooms', q, signal) }; }, [student, key]);
    const resource = useResource(key, load);
    function submit(e: FormEvent) { e.preventDefault(); if ([...draft].length > 100) {
        setError('Nhập tối đa 100 ký tự.');
        search.current?.focus();
        return;
    } setError(''); setQuery({ ...query, q: draft.trim() || undefined, page: 1 }); }
    return <div className={styles.stack}><PageTitle title="Tìm phòng đăng ký" description="Chọn bộ lọc để tìm phòng phù hợp với nguyện vọng."/>{resource.data && <p className={styles.note}>{resource.data.context.registration.status === 'CLOSED' ? 'Kỳ đăng ký đang đóng. Bạn vẫn có thể xem thông tin phòng.' : resource.data.context.pending ? 'Bạn đã có đơn chờ duyệt. Theo dõi kết quả trong Đơn đăng ký.' : resource.data.context.active ? 'Bạn đã có hồ sơ lưu trú chưa kết thúc.' : 'Kỳ đăng ký đang mở. Chọn phòng phù hợp để gửi nguyện vọng.'}</p>}<section className={styles.panel}><form className={styles.searchRow} onSubmit={submit}><div className={styles.field}><label htmlFor="room-search">Tìm phòng</label><input ref={search} id="room-search" value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} placeholder="Mã phòng hoặc tên tòa" aria-invalid={!!error} aria-describedby="search-error"/>{error && <p id="search-error" className={styles.fieldError}>{error}</p>}</div><button className={styles.primary} disabled={busy}>Tìm phòng</button></form><div className={styles.filters}><BuildingFilter value={String(query.buildingId ?? '')} disabled={busy} onChange={id => setQuery({ ...query, buildingId: id || undefined, page: 1 })}/><div className={styles.field}><label htmlFor="gender">Giới tính tiếp nhận</label><select id="gender" disabled={busy} value={String(query.gender ?? '')} onChange={e => setQuery({ ...query, gender: e.target.value || undefined, page: 1 })}><option value="SELF">Theo hồ sơ của bạn</option><option value="">Tất cả</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select></div><div className={styles.field}><label htmlFor="places">Tình trạng chỗ</label><select id="places" disabled={busy} value={query.hasAvailability === undefined ? '' : String(query.hasAvailability)} onChange={e => setQuery({ ...query, hasAvailability: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 })}><option value="">Tất cả</option><option value="true">Còn chỗ</option><option value="false">Đã hết chỗ</option></select></div><button type="button" className={styles.secondary} disabled={busy} onClick={() => { setDraft(''); setError(''); setQuery({ page: 1, pageSize: query.pageSize }); }}>Đặt lại bộ lọc</button></div></section><section className={styles.panel + ' ' + styles.tablePanel}><header className={styles.tableHeading}><h2>Danh sách phòng</h2></header><LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{resource.data && <>{resource.data.data.length ? <div className={styles.tableRegion} role="region" tabIndex={0} aria-label="Bảng phòng, cuộn ngang để xem đầy đủ"><table className={styles.table}><thead><tr><th scope="col">Phòng / Tòa nhà</th><th scope="col">Giới tính</th><th scope="col">Còn / Tổng chỗ</th><th scope="col">Phí / kỳ / người</th><th scope="col">Thao tác</th></tr></thead><tbody>{resource.data.data.map(room => <tr key={room.id}><td><strong>{room.code}</strong><p className={styles.muted}>{room.buildingName}</p></td><td>{labels[room.gender]}</td><td>{room.availablePlaces} / {room.capacity}</td><td>{money(room.feeVnd)}</td><td><StudentLink className={styles.secondary} href={'/student/rooms/' + room.id}>Xem phòng {room.code}</StudentLink></td></tr>)}</tbody></table></div> : <div className={styles.empty}><h3>Chưa có phòng phù hợp</h3><p className={styles.muted}>Thử tòa nhà khác hoặc đặt lại bộ lọc.</p></div>}<Pager id="rooms-page-size" meta={resource.data.meta} loading={resource.loading} onPage={page => setQuery({ ...query, page })} onSize={pageSize => setQuery({ ...query, page: 1, pageSize })}/></>}</section><p className={styles.note}>Số chỗ có thể thay đổi trước khi được duyệt. Gửi đơn chưa giữ chỗ. Thông tin cá nhân của sinh viên khác được giữ riêng tư.</p></div>;
}
type Eligibility = Awaited<ReturnType<StudentClient['eligibility']>>;
function ApplyDialog({ room, context, onClose }: {
    room: Room;
    context: Eligibility;
    onClose: () => void;
}) {
    const { student, api, auth, busy, handleError } = useStudent(), run = useTask(), router = useRouter(), dialog = useRef<HTMLDialogElement>(null);
    const [confirmed, setConfirmed] = useState(false), [feedback, setFeedback] = useState<Notice | null>(null), [locked, setLocked] = useState(false), [unknown, setUnknown] = useState(false), [found, setFound] = useState<string | null>(null);
    useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
    async function submit(e: FormEvent) { e.preventDefault(); if (busy || locked)
        return; if (!confirmed) {
        setFeedback({ title: 'Kiểm tra thông tin', message: 'Vui lòng đọc và đánh dấu xác nhận.', tone: 'error' });
        return;
    } setFeedback(null); try {
        const application = await run(signal => student.apply(room.id, signal));
        router.push('/student/applications/' + application.id);
    }
    catch (error) {
        if (isCancelled(error) || handleError(error))
            return;
        setFeedback(studentNotice(error));
        if (error instanceof ApiError && (error.status === 409 || error.status === 404 || error.code === 'CSRF_INVALID' || error.ambiguous)) {
            setLocked(true);
            setUnknown(error.ambiguous);
        }
    } }
    async function check() { try {
        await run(async (signal) => { await api.getCsrfToken(signal); const identity = await auth.getCurrentIdentity(signal); if (identity.actorKind !== 'STUDENT' || identity.role !== 'SV')
            throw new ApiError('FORBIDDEN', 403); if (unknown) {
            const application = await student.find('applications', item => item.preferredRoomId === room.id, signal);
            if (application) {
                setFound(application.id);
                setFeedback({ title: 'Đã tìm thấy đơn khớp', message: 'Mở đơn để kiểm tra thông tin và trạng thái hiện tại. Kết quả này không xác định thao tác trước đã tạo đơn hay chưa.', tone: 'info' });
            }
            else
                setFeedback({ title: 'Chưa tìm thấy đơn khớp', message: 'Chưa thể kết luận yêu cầu trước thất bại. Kiểm tra danh sách đơn trước khi đăng ký lại.', tone: 'info' });
        }
        else {
            await student.eligibility(signal);
            onClose();
        } });
    }
    catch (error) {
        if (!isCancelled(error) && !handleError(error))
            setFeedback(studentNotice(error));
    } }
    return <dialog ref={dialog} className={styles.dialog} aria-labelledby="apply-title" onCancel={e => { e.preventDefault(); if (!busy)
        onClose(); }}><header className={styles.pageTitle}><h2 id="apply-title">Xác nhận đăng ký lưu trú</h2><button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>Đóng</button></header>{feedback && <Feedback notice={feedback}>{locked && <button type="button" className={styles.secondary} disabled={busy} onClick={() => void check()}>Kiểm tra đơn hiện tại</button>}{found && <StudentLink className={styles.secondary} href={'/student/applications/' + found}>Xem đơn hiện tại</StudentLink>}</Feedback>}<Facts items={[["Sinh viên", context.student.studentCode + ' · ' + context.student.fullName], ["Giới tính", labels[context.student.gender]], ["Phòng nguyện vọng", room.code + ' · ' + room.buildingName], ["Phí hiện tại / kỳ / người", money(room.feeVnd)]]}/><p className={styles.note}>Gửi đơn chưa giữ chỗ. Ban quản lý có thể xếp một phòng khác phù hợp. Bạn không thể tự hủy hoặc sửa đơn sau khi gửi.</p><form className={styles.stack} onSubmit={submit} aria-busy={busy}><label className={styles.check}><input type="checkbox" disabled={busy || locked} checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>Tôi đã kiểm tra thông tin và hiểu phòng đã chọn là nguyện vọng.</label><div className={styles.actions}><button type="submit" className={styles.primary} disabled={busy || locked}>{busy ? 'Đang gửi đơn…' : 'Gửi đơn đăng ký'}</button><button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>Quay lại</button></div></form></dialog>;
}
export function RoomDetail({ id }: {
    id: string;
}) { const { student, busy } = useStudent(), [confirming, setConfirming] = useState(false), restore = useRef(false); const load = useCallback(async (signal: AbortSignal) => { const [room, context] = await Promise.all([student.get('rooms', id, signal), student.eligibility(signal)]); return { room, context }; }, [student, id]); const resource = useResource(id, load); useEffect(() => { if (!resource.loading && restore.current) {
    restore.current = false;
    document.getElementById('choose-room')?.focus();
} }, [resource.loading]); const block = resource.data ? registrationBlock(resource.data.room, resource.data.context) : ''; return <div className={styles.stack}><StudentLink className={styles.backLink} href="/student/rooms">← Về kết quả tìm phòng</StudentLink><PageTitle title={resource.data ? 'Thông tin phòng ' + resource.data.room.code : 'Thông tin phòng'} description="Kiểm tra thông tin và số chỗ trước khi chọn nguyện vọng."/><LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{resource.data && <div className={styles.twoColumns}><section className={styles.panel}><div className={styles.tableHeading}><h2>Phòng {resource.data.room.code}</h2><Badge value={resource.data.room.availablePlaces + ' chỗ trống'}/></div><Facts items={[["Tòa nhà", resource.data.room.buildingName], ["Giới tính tiếp nhận", labels[resource.data.room.gender]], ["Sức chứa", resource.data.room.capacity + ' người'], ["Đã phân bổ", resource.data.room.allocatedPlaces + ' chỗ'], ["Còn trống", resource.data.room.availablePlaces + ' chỗ'], ["Phí mỗi kỳ / người", money(resource.data.room.feeVnd)]]}/></section><section className={styles.panel}><h2>Chọn nguyện vọng của bạn</h2><p className={styles.note}>{block || 'Phòng hiện phù hợp với hồ sơ của bạn và còn chỗ. Số chỗ được kiểm tra lại khi gửi đơn.'}</p><button id="choose-room" className={styles.primary} disabled={busy || !!block} onClick={() => setConfirming(true)}>Chọn đăng ký phòng này</button>{resource.data.context.pending && <StudentLink className={styles.secondary} href={'/student/applications/' + resource.data.context.pending.id}>Xem đơn đang chờ</StudentLink>}{resource.data.context.active && <StudentLink className={styles.secondary} href={'/student/residences/' + resource.data.context.active.id}>Xem lưu trú hiện tại</StudentLink>}<button className={styles.secondary} disabled={busy} onClick={resource.reload}>Cập nhật thông tin phòng</button><p className={styles.muted}>Chỉ công bố thông tin phòng và số lượng chỗ; không hiển thị danh sách sinh viên ở cùng phòng.</p></section></div>}{confirming && resource.data && <ApplyDialog room={resource.data.room} context={resource.data.context} onClose={() => { restore.current = true; setConfirming(false); resource.reload(); }}/>}</div>; }
