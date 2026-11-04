"use client";
import { useCallback, useState, type ReactNode } from 'react';
import type { StudentClient, Entity, Collection } from '@/lib/student/client';
import type { Room, Residence, Receipt } from '@/lib/student/schema';
import { labels, money, date } from '@/lib/student/presentation';
import { useStudent } from './student-context';
import { useResource } from './hooks';
import { StudentLink } from './student-shell';
import { Badge, Facts, LoadState, PageTitle, Pager } from './ui';
import styles from './student.module.css';
export type HistoryCollection = Exclude<Collection, 'rooms'>;
const titles: Record<HistoryCollection, string> = { applications: 'Đơn đăng ký của tôi', residences: 'Lưu trú của tôi', receipts: 'Khoản phí của tôi' };
const options: Record<HistoryCollection, string[]> = { applications: ['PENDING', 'APPROVED', 'REJECTED'], residences: ['ALLOCATED', 'CHECKED_IN', 'ENDED', 'CANCELLED'], receipts: ['UNPAID', 'PAID'] };
interface Related {
    rooms: Record<string, Room | null>;
    residences: Record<string, Residence>;
}
async function hydrate(student: StudentClient, entities: Entity[], signal: AbortSignal): Promise<Related> { const residences: Record<string, Residence> = {}; await Promise.all([...new Set(entities.flatMap(e => 'residenceId' in e ? [e.residenceId] : []))].map(async (id) => { residences[id] = await student.get('residences', id, signal); })); const roomIds = [...new Set([...entities, ...Object.values(residences)].flatMap(e => 'preferredRoomId' in e ? [e.preferredRoomId] : 'roomId' in e ? [e.roomId] : []))]; const rooms: Record<string, Room | null> = {}; await Promise.all(roomIds.map(async (id) => { rooms[id] = await student.roomOrUnavailable(id, signal); })); return { rooms, residences }; }
function roomLabel(id: string, related: Related) { const room = related.rooms[id]; return room ? room.code + ' · ' + room.buildingName : 'Phòng không còn công khai'; }
export function HistoryList({ collection }: {
    collection: HistoryCollection;
}) { const { student, busy } = useStudent(), [status, setStatus] = useState(''), [page, setPage] = useState(1), [pageSize, setSize] = useState(5); const load = useCallback(async (signal: AbortSignal) => { const result = await student.list(collection, { page, pageSize, status: status || undefined }, signal); return { ...result, related: await hydrate(student, result.data, signal) }; }, [student, collection, status, page, pageSize]); const resource = useResource(collection + status + page + ':' + pageSize, load); return <div className={styles.stack}><PageTitle title={titles[collection]} description="Theo dõi thông tin và lịch sử thuộc hồ sơ của bạn." action={<button className={styles.secondary} disabled={busy} onClick={resource.reload}>Cập nhật trạng thái</button>}/><section className={styles.panel}><div className={styles.field}><label htmlFor="history-status">Trạng thái</label><select id="history-status" value={status} disabled={busy} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{options[collection].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></div></section><section className={styles.panel + ' ' + styles.tablePanel}><header className={styles.tableHeading}><h2>{collection === 'applications' ? 'Các đơn đã gửi' : collection === 'residences' ? 'Hồ sơ lưu trú' : 'Phiếu thu tiền phòng'}</h2></header><LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{resource.data && <>{resource.data.data.length ? <div className={styles.tableRegion} role="region" tabIndex={0} aria-label="Bảng lịch sử, cuộn ngang để xem đầy đủ"><table className={styles.table}><thead><tr><th scope="col">{collection === 'applications' ? 'Phòng nguyện vọng' : collection === 'residences' ? 'Phòng thực tế' : 'Số tiền đã chốt'}</th><th scope="col">{collection === 'applications' ? 'Thời điểm gửi' : collection === 'residences' ? 'Ngày nhận phòng' : 'Ngày nhận tiền'}</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead><tbody>{resource.data.data.map(entity => <tr key={entity.id}><td>{'amountVnd' in entity ? money(entity.amountVnd) : 'preferredRoomId' in entity ? roomLabel(entity.preferredRoomId, resource.data!.related) : 'roomId' in entity ? roomLabel(entity.roomId, resource.data!.related) : ''}</td><td>{'preferredRoomId' in entity ? date(entity.createdAt, true) : 'checkInDate' in entity ? date(entity.checkInDate) : 'paymentDate' in entity ? date(entity.paymentDate) : ''}</td><td><Badge value={entity.status}/></td><td><StudentLink className={styles.secondary} href={'/student/' + collection + '/' + entity.id}>{collection === 'receipts' && entity.status === 'PAID' ? 'Xem biên nhận' : 'Xem chi tiết'}</StudentLink></td></tr>)}</tbody></table></div> : <div className={styles.empty}><h3>Chưa có thông tin phù hợp</h3><p className={styles.muted}>{collection === 'applications' ? 'Tìm phòng và gửi nguyện vọng khi kỳ đăng ký đang mở.' : collection === 'residences' ? 'Hồ sơ lưu trú xuất hiện khi Ban quản lý duyệt và xếp phòng.' : 'Phiếu thu xuất hiện sau khi Ban quản lý lập phiếu cho lưu trú của bạn.'}</p><button className={styles.secondary} onClick={() => { setStatus(''); setPage(1); }} disabled={busy}>Xem tất cả</button></div>}<Pager id="history-size" meta={resource.data.meta} loading={resource.loading} onPage={setPage} onSize={size => { setSize(size); setPage(1); }}/></>}</section><p className={styles.note}>{collection === 'applications' ? 'Gửi đơn chưa giữ chỗ. Bạn không thể tự hủy hoặc sửa đơn. Khi được duyệt, phòng thực tế có thể khác nguyện vọng.' : collection === 'residences' ? 'Nhận phòng, hủy xếp và trả phòng do Ban quản lý xác nhận. Lịch sử được giữ nguyên.' : 'Phiếu chưa thanh toán vẫn được giữ sau khi trả phòng hoặc hủy xếp. Liên hệ Ban quản lý để được hướng dẫn nộp tiền.'}</p>{collection === 'applications' && <StudentLink href="/student/rooms" className={styles.secondary}>Tìm phòng đăng ký</StudentLink>}</div>; }
export function HistoryDetail({ collection, id }: {
    collection: HistoryCollection;
    id: string;
}) {
    const { student, busy } = useStudent();
    const load = useCallback(async (signal: AbortSignal) => { const entity = await student.get(collection, id, signal); const related = await hydrate(student, [entity], signal); let residence: Residence | null = null, receipt: Receipt | null = null; if ('preferredRoomId' in entity && entity.status === 'APPROVED') {
        residence = await student.find('residences', r => r.applicationId === entity.id, signal);
        if (residence)
            related.rooms[residence.roomId] = await student.roomOrUnavailable(residence.roomId, signal);
    } if ('applicationId' in entity)
        receipt = await student.find('receipts', r => r.residenceId === entity.id, signal); return { entity, related, residence, receipt }; }, [student, collection, id]);
    const resource = useResource(collection + id, load), result = resource.data;
    let facts: [
        string,
        ReactNode
    ][] = [], title = 'Thông tin chi tiết', note = '';
    const links: {
        label: string;
        href: string;
    }[] = [];
    if (result) {
        const { entity, related, residence, receipt } = result;
        facts = [['Mã bản ghi', entity.id], ['Trạng thái', <Badge key="status" value={entity.status}/>]];
        if ('preferredRoomId' in entity) {
            title = 'Chi tiết đơn đăng ký';
            facts.push(['Phòng nguyện vọng', roomLabel(entity.preferredRoomId, related)], ['Thời điểm gửi', date(entity.createdAt, true)], ['Thời điểm xét duyệt', date(entity.reviewedAt, true)], ['Lý do từ chối', entity.rejectionReason]);
            if (residence) {
                facts.push(['Phòng được xếp thực tế', roomLabel(residence.roomId, related)], ['Tình trạng lưu trú', labels[residence.status]]);
                links.push({ label: 'Xem hồ sơ lưu trú', href: '/student/residences/' + residence.id });
            }
            if (entity.status === 'REJECTED')
                links.push({ label: 'Tìm phòng và đăng ký lại', href: '/student/rooms' });
            note = entity.status === 'PENDING' ? 'Đơn đang chờ xét duyệt và chưa giữ chỗ. Không thể tự hủy hoặc sửa đơn.' : entity.status === 'REJECTED' ? 'Lý do từ chối được giữ trong lịch sử. Bạn có thể gửi đơn mới khi đủ điều kiện.' : 'Phòng được xếp thực tế có thể khác nguyện vọng. Xem hồ sơ lưu trú để biết thông tin nhận phòng.';
        }
        if ('applicationId' in entity) {
            title = 'Chi tiết lưu trú';
            facts.push(['Phòng thực tế', roomLabel(entity.roomId, related)], ['Mã phòng', entity.roomId], ['Ngày xếp phòng', date(entity.allocatedAt, true)], ['Ngày nhận phòng', date(entity.checkInDate)], ['Ngày trả phòng', date(entity.checkOutDate)], ['Lý do hủy xếp', entity.cancellationReason]);
            links.push({ label: 'Xem đơn đăng ký', href: '/student/applications/' + entity.applicationId }, receipt ? { label: 'Xem phiếu thu', href: '/student/receipts/' + receipt.id } : { label: 'Xem khoản phí của tôi', href: '/student/receipts' });
            note = entity.status === 'ALLOCATED' ? 'Bạn đã được giữ chỗ. Liên hệ Ban quản lý để được hướng dẫn nhận phòng.' : 'Lịch sử được giữ nguyên kể cả khi phòng không còn công khai. Khoản chưa thanh toán vẫn được giữ sau khi kết thúc lưu trú.';
        }
        if ('amountVnd' in entity) {
            title = entity.status === 'PAID' ? 'Biên nhận thanh toán' : 'Chi tiết phiếu thu';
            const res = related.residences[entity.residenceId];
            facts.push(['Mã phiếu thu', entity.id], ['Hồ sơ lưu trú', entity.residenceId], ['Phòng', res ? roomLabel(res.roomId, related) : 'Chưa có thông tin'], ['Số tiền đã chốt', money(entity.amountVnd)], ['Ngày lập', date(entity.createdAt, true)], ['Ngày nhận tiền', date(entity.paymentDate)], ['Mã nhân viên xác nhận', entity.paidBy]);
            links.push({ label: 'Xem hồ sơ lưu trú', href: '/student/residences/' + entity.residenceId });
            note = entity.status === 'PAID' ? 'Ban quản lý đã xác nhận nhận đủ tiền. Số tiền không thay đổi theo giá phòng hiện tại.' : 'Liên hệ Ban quản lý ký túc xá để được hướng dẫn nộp đủ số tiền trên phiếu. Trạng thái cập nhật sau khi Ban quản lý xác nhận.';
        }
    }
    return <div className={styles.stack}><StudentLink className={styles.backLink} href={'/student/' + collection}>← {titles[collection]}</StudentLink><PageTitle title={title} description="Thông tin thuộc hồ sơ của bạn." action={<button className={styles.secondary} disabled={busy} onClick={resource.reload}>Cập nhật trạng thái</button>}/><LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{result && <><section className={styles.panel}><h2>Thông tin chi tiết</h2><Facts items={facts}/><div className={styles.actions}>{links.map(link => <StudentLink className={styles.secondary} key={link.href} href={link.href}>{link.label}</StudentLink>)}</div></section><p className={styles.note}>{note}</p></>}</div>;
}
