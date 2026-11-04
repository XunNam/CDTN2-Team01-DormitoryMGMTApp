"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Collection, Entity, Operation } from '@/lib/management/client';
import type { ApprovalResult, RegistrationPeriod } from '@/lib/management/schema';
import { labels, money, date } from '@/lib/management/presentation';
import { useManagement } from './management-context';
import { useResource } from './hooks';
import { ManagementLink } from './management-shell';
import { hydrate, summary, titles } from './data';
import { PageTitle, LoadState, Facts, Badge, Feedback } from './ui';
import { Editor, actionTitles } from './editor';
import { EntityList } from './entity-list';
import styles from './management.module.css';
export function EntityDetail({ collection, id }: {
    collection: Collection;
    id: string;
}) {
    const { management, busy } = useManagement(), [operation, setOperation] = useState<Operation | null>(null), [result, setResult] = useState<Entity | ApprovalResult | RegistrationPeriod | null>(null);
    const load = useCallback(async (signal: AbortSignal) => { const entity = await management.get(collection, id, signal); return { entity, related: await hydrate(management, collection, [entity], signal) }; }, [management, collection, id]);
    const resource = useResource(collection + id, load), entity = resource.data?.entity, related = resource.data?.related;
    const pendingFocus = useRef<Operation | null>(null);
    useEffect(() => { if (!resource.loading && pendingFocus.current) {
        const action = pendingFocus.current;
        pendingFocus.current = null;
        const target = document.querySelector<HTMLButtonElement>('button[data-operation="' + action + '"]') ?? document.querySelector<HTMLHeadingElement>('main h1');
        target?.focus({ preventScroll: true });
    } }, [resource.loading]);
    let facts: [
        string,
        ReactNode
    ][] = [], actions: Operation[] = [], title = titles[collection], note = '';
    if (entity) {
        const line = summary(entity, related);
        title = line[0];
        facts = [['Mã bản ghi', entity.id]];
        if ('studentCode' in entity) {
            facts.push(['Mã số sinh viên', entity.studentCode], ['Họ và tên', entity.fullName], ['Giới tính', labels[entity.gender]], ['Lớp', entity.className], ['Khoa', entity.faculty], ['Số điện thoại', entity.phone], ['Email', entity.email], ['Ngày sinh', entity.dateOfBirth ? date(entity.dateOfBirth) : null], ['Địa chỉ thường trú', entity.permanentAddress]);
            actions = ['profileUpdate'];
            note = 'Hồ sơ sinh viên không cấp quyền đăng nhập. Tài khoản do Quản trị viên cấp riêng.';
        }
        else if ('buildingName' in entity) {
            title = 'Phòng ' + entity.code;
            facts.push(['Phòng', entity.code], ['Tòa nhà', <ManagementLink key="building" href={'/management/buildings/' + entity.buildingId}>{entity.buildingName}</ManagementLink>], ['Giới tính tiếp nhận', labels[entity.gender]], ['Sức chứa', entity.capacity + ' người'], ['Đã phân bổ', entity.allocatedPlaces + ' chỗ'], ['Còn trống', entity.availablePlaces + ' chỗ'], ['Phí mỗi kỳ / người', money(entity.feeVnd)], ['Trạng thái', <Badge key="status" value={entity.status}/>]);
            actions = ['roomUpdate'];
            note = 'Chỗ đã xếp và sinh viên đang ở đều chiếm sức chứa. Không ngừng sử dụng phòng còn hồ sơ lưu trú mở.';
        }
        else if ('name' in entity) {
            facts.push(['Mã tòa', entity.code], ['Tên tòa nhà', entity.name]);
            actions = ['buildingUpdate'];
            note = 'Mã tòa nhà không thay đổi sau khi tạo.';
        }
        else if ('preferredRoomId' in entity) {
            title = 'Đơn đăng ký · ' + line[0];
            facts.push(['Sinh viên', <ManagementLink key="student" href={'/management/student-profiles/' + entity.studentId}>{line[0] + ' · ' + line[1]}</ManagementLink>], ['Phòng nguyện vọng', <ManagementLink key="room" href={'/management/rooms/' + entity.preferredRoomId}>{line[2]}</ManagementLink>], ['Giới tính', labels[related?.profiles[entity.studentId]?.gender ?? '']], ['Trạng thái', <Badge key="status" value={entity.status}/>], ['Ngày gửi', date(entity.createdAt)], ['Ngày xét duyệt', date(entity.reviewedAt)], ['Lý do từ chối', entity.rejectionReason]);
            if (entity.status === 'PENDING')
                actions = ['approve', 'reject'];
            note = 'Đơn chỉ là nguyện vọng. Khi duyệt, có thể chọn phòng thực tế khác nếu phù hợp và còn chỗ.';
        }
        else if ('applicationId' in entity) {
            title = 'Lưu trú · ' + line[0];
            facts.push(['Sinh viên', <ManagementLink key="student" href={'/management/student-profiles/' + entity.studentId}>{line[0] + ' · ' + line[1]}</ManagementLink>], ['Phòng', <ManagementLink key="room" href={'/management/rooms/' + entity.roomId}>{line[2]}</ManagementLink>], ['Đơn đăng ký', <ManagementLink key="application" href={'/management/applications/' + entity.applicationId}>Xem đơn nguồn</ManagementLink>], ['Trạng thái', <Badge key="status" value={entity.status}/>], ['Ngày xếp phòng', date(entity.allocatedAt)], ['Ngày nhận phòng', date(entity.checkInDate)], ['Ngày trả phòng', date(entity.checkOutDate)], ['Lý do hủy xếp', entity.cancellationReason]);
            if (entity.status === 'ALLOCATED')
                actions = ['checkIn', 'cancel'];
            if (entity.status === 'CHECKED_IN')
                actions = ['checkOut'];
            note = 'Nhận phòng không trừ thêm chỗ. Hủy xếp hoặc trả phòng giải phóng đúng một chỗ, giữ lịch sử và phiếu thu.';
        }
        else if ('amountVnd' in entity) {
            title = entity.status === 'PAID' ? 'Biên nhận thanh toán' : 'Phiếu thu tiền phòng';
            facts.push(['Sinh viên', line[0] + ' · ' + line[1]], ['Phòng', line[2]], ['Hồ sơ lưu trú', <ManagementLink key="residence" href={'/management/residences/' + entity.residenceId}>Xem hồ sơ lưu trú</ManagementLink>], ['Tổng số tiền', money(entity.amountVnd)], ['Trạng thái', <Badge key="status" value={entity.status}/>], ['Ngày lập', date(entity.createdAt)], ['Ngày nhận tiền', date(entity.paymentDate)], ['Mã nhân viên xác nhận', entity.paidBy]);
            if (entity.status === 'UNPAID')
                actions = ['pay'];
            note = 'Số tiền được chốt khi lập phiếu. Lịch sử và khoản chưa thanh toán được giữ kể cả khi lưu trú kết thúc.';
        }
    }
    function saved(value: Entity | ApprovalResult | RegistrationPeriod) { setResult(value); setOperation(null); resource.reload(); }
    return <div className={styles.stack}><ManagementLink href={'/management/' + collection} className={styles.backLink}>← Về danh sách {titles[collection].toLowerCase()}</ManagementLink><PageTitle title={title} description="Kiểm tra thông tin trước khi thực hiện thao tác."/>{result && <Feedback notice={{ title: 'Đã hoàn tất thao tác', message: 'Dữ liệu đã được hệ thống ghi nhận. Thông tin bên dưới được tải lại từ hệ thống.', tone: 'info' }}>{'residence' in result && <ManagementLink href={'/management/residences/' + result.residence.id} className={styles.secondary}>Xem hồ sơ lưu trú</ManagementLink>}</Feedback>}<LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{entity && !resource.loading && !resource.error && <><section className={styles.panel}><h2>Thông tin chi tiết</h2><Facts items={facts}/><div className={styles.actions}>{actions.map(action => <button className={['reject', 'cancel'].includes(action) ? styles.danger : styles.primary} key={action} data-operation={action} disabled={busy} onClick={() => setOperation(action)}>{actionTitles[action]}</button>)}{'applicationId' in entity && ['ALLOCATED', 'CHECKED_IN'].includes(entity.status) && <ManagementLink href={'/management/receipts/new?residenceId=' + entity.id} className={styles.secondary}>Lập phiếu thu</ManagementLink>}</div></section><p className={styles.note}>{note}</p>{collection === 'buildings' && <EntityList key={entity.id} collection="rooms" fixed={{ buildingId: entity.id }} embedded/>}{collection === 'rooms' && <EntityList key={entity.id} collection="residences" fixed={{ roomId: entity.id }} embedded/>}{collection === 'student-profiles' && <EntityList key={entity.id} collection="residences" fixed={{ studentId: entity.id }} embedded/>}{collection === 'applications' && 'studentId' in entity && entity.status === 'APPROVED' && <EntityList key={entity.id} collection="residences" fixed={{ studentId: entity.studentId }} embedded/>}{collection === 'residences' && <EntityList key={entity.id} collection="receipts" fixed={{ residenceId: entity.id }} embedded/>}</>}{operation && entity && <Editor modal operation={operation} record={entity} student={'studentId' in entity ? related?.profiles[entity.studentId] : undefined} onSaved={saved} onClose={() => { pendingFocus.current = operation; setOperation(null); resource.reload(); }}/>}</div>;
}
