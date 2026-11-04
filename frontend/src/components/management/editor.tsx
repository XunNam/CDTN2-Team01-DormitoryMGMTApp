"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, isCancelled } from '@/lib/api/client';
import { operations, type Entity, type Operation } from '@/lib/management/client';
import { UUID_PATTERN } from '@/lib/auth/contracts';
import { inputErrors, today } from '@/lib/management/contracts';
import { labels, money, notice } from '@/lib/management/presentation';
import type { ApprovalResult, RegistrationPeriod, StudentProfile } from '@/lib/management/schema';
import type { Notice } from '@/lib/auth/notices';
import { useManagement } from './management-context';
import { useResource, useTask } from './hooks';
import { ManagementLink } from './management-shell';
import { Picker } from './picker';
import { Feedback, FieldError, focusFirstError, LoadState } from './ui';
import styles from './management.module.css';
type Field = {
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: string[];
    help?: string;
};
const profileFields: Field[] = [{ key: 'fullName', label: 'Họ và tên', required: true }, { key: 'gender', label: 'Giới tính', options: ['MALE', 'FEMALE'], required: true }, { key: 'className', label: 'Lớp', required: true }, { key: 'faculty', label: 'Khoa', required: true }, { key: 'phone', label: 'Số điện thoại', type: 'tel', help: '7–20 chữ số, có thể bắt đầu bằng +.' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'dateOfBirth', label: 'Ngày sinh', type: 'date' }, { key: 'permanentAddress', label: 'Địa chỉ thường trú', type: 'textarea' }];
const roomFields: Field[] = [{ key: 'capacity', label: 'Sức chứa tối đa', type: 'number', required: true, help: 'Số nguyên từ 1 đến 10.000.' }, { key: 'gender', label: 'Giới tính tiếp nhận', options: ['MALE', 'FEMALE'], required: true }, { key: 'feeVnd', label: 'Phí mỗi kỳ / người (đồng)', required: true, help: 'Số nguyên đồng, không có dấu phân cách.' }, { key: 'status', label: 'Trạng thái sử dụng', options: ['ACTIVE', 'INACTIVE'], required: true }];
export const actionTitles: Record<Operation, string> = { profileCreate: 'Thêm hồ sơ sinh viên', profileUpdate: 'Cập nhật hồ sơ', buildingCreate: 'Thêm tòa nhà', buildingUpdate: 'Cập nhật tòa nhà', roomCreate: 'Thêm phòng', roomUpdate: 'Cập nhật phòng', approve: 'Duyệt và xếp phòng', reject: 'Từ chối đơn đăng ký', checkIn: 'Xác nhận nhận phòng', cancel: 'Hủy xếp phòng', checkOut: 'Xác nhận trả phòng', receiptCreate: 'Lập phiếu thu tiền phòng', pay: 'Xác nhận thu tiền', period: 'Thay đổi kỳ đăng ký' };
function fieldsFor(operation: Operation): Field[] { switch (operation) {
    case 'profileCreate': return [{ key: 'studentCode', label: 'Mã số sinh viên', required: true, help: '1–32 chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.' }, ...profileFields];
    case 'profileUpdate': return profileFields;
    case 'buildingCreate': return [{ key: 'code', label: 'Mã tòa nhà', required: true }, { key: 'name', label: 'Tên tòa nhà', required: true }];
    case 'buildingUpdate': return [{ key: 'name', label: 'Tên tòa nhà', required: true }];
    case 'roomCreate': return [{ key: 'code', label: 'Mã phòng', required: true }, ...roomFields];
    case 'roomUpdate': return roomFields;
    case 'reject':
    case 'cancel': return [{ key: 'reason', label: operation === 'reject' ? 'Lý do từ chối' : 'Lý do hủy xếp', type: 'textarea', required: true, help: '1–500 ký tự. Lý do được lưu trong lịch sử.' }];
    case 'checkIn': return [{ key: 'checkInDate', label: 'Ngày nhận phòng', type: 'date', required: true }];
    case 'checkOut': return [{ key: 'checkOutDate', label: 'Ngày trả phòng', type: 'date', required: true }];
    case 'pay': return [{ key: 'paymentDate', label: 'Ngày nhận tiền', type: 'date', required: true }];
    default: return [];
} }
function ReceiptPreview({ id }: {
    id: string;
}) { const { management } = useManagement(); const load = useCallback(async (signal: AbortSignal) => { const residence = await management.get('residences', id, signal); const [room, receipts] = await Promise.all([management.get('rooms', residence.roomId, signal), management.list('receipts', { residenceId: id, page: 1, pageSize: 5 }, signal)]); return { room, hasReceipt: receipts.data.length > 0 }; }, [management, id]); const resource = useResource(id, load); return <><LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{resource.data && <div className={styles.note}>{resource.data.hasReceipt ? 'Hồ sơ đã có phiếu thu. Chọn hồ sơ khác hoặc xem danh sách phiếu.' : <>Phòng {resource.data.room.code} · Giá hiện tại: <strong>{money(resource.data.room.feeVnd)}</strong>. Số tiền được chốt khi lập phiếu.</>}</div>}</>; }
export function Editor({ operation, record, student, onSaved, onClose, modal = false, initialResidenceId }: {
    initialResidenceId?: string;
    operation: Operation;
    record?: Entity | RegistrationPeriod;
    student?: StudentProfile;
    onSaved: (value: Entity | ApprovalResult | RegistrationPeriod) => void;
    onClose?: () => void;
    modal?: boolean;
}) {
    const { management, busy, handleError, api, auth } = useManagement(), run = useTask(), dialog = useRef<HTMLDialogElement>(null), formRef = useRef<HTMLFormElement>(null);
    const fields = fieldsFor(operation);
    const [values, setValues] = useState<Record<string, string>>(() => { const result: Record<string, string> = {}; for (const f of fields) {
        const value = record && f.key in record ? (record as unknown as Record<string, unknown>)[f.key] : undefined;
        result[f.key] = value === null ? '' : value === undefined ? '' : String(value);
    } if (operation === 'roomCreate')
        Object.assign(result, { capacity: '6', gender: 'MALE', feeVnd: '0', status: 'ACTIVE' }); for (const key of ['checkInDate', 'checkOutDate', 'paymentDate'])
        if (fields.some(f => f.key === key) && !result[key])
            result[key] = today(); if (operation === 'receiptCreate' && initialResidenceId && UUID_PATTERN.test(initialResidenceId))
        result.residenceId = initialResidenceId; if (operation === 'period')
        result.status = record && 'status' in record && record.status === 'OPEN' ? 'CLOSED' : 'OPEN'; return result; });
    const [errors, setErrors] = useState<Record<string, string>>({}), [feedback, setFeedback] = useState<Notice | null>(null), [locked, setLocked] = useState(false), [unknown, setUnknown] = useState(false), [confirmed, setConfirmed] = useState(false), [found, setFound] = useState<{
        collection: string;
        id: string;
    } | null>(null);
    const confirmation = ['approve', 'reject', 'cancel', 'checkIn', 'checkOut', 'pay', 'period'].includes(operation), disabled = busy || locked;
    useEffect(() => { if (modal) {
        const node = dialog.current;
        node?.showModal();
        return () => node?.close();
    } }, [modal]);
    function body() { const result: Record<string, unknown> = {}; for (const f of fields) {
        const v = (values[f.key] ?? '').trim();
        result[f.key] = f.type === 'number' ? (/^[0-9]+$/.test(v) ? Number(v) : NaN) : (!f.required && !v ? null : v);
    } if (operation === 'roomCreate')
        result.buildingId = values.buildingId ?? ''; if (operation === 'approve')
        result.roomId = values.roomId ?? ''; if (operation === 'receiptCreate')
        result.residenceId = values.residenceId ?? ''; if (operation === 'period')
        result.status = values.status; return result; }
    async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (disabled)
        return; const input = body(), invalid = inputErrors(operations[operation][2], input); if (operation === 'checkOut' && record && 'checkInDate' in record && record.checkInDate && String(input.checkOutDate) < record.checkInDate)
        invalid.checkOutDate = 'Ngày trả không được trước ngày nhận phòng.'; if (operation === 'roomUpdate' && record && 'allocatedPlaces' in record && Number(input.capacity) < record.allocatedPlaces)
        invalid.capacity = 'Sức chứa không được thấp hơn ' + record.allocatedPlaces + ' chỗ đã phân bổ.'; if (confirmation && !confirmed)
        invalid.confirmed = 'Vui lòng kiểm tra và đánh dấu xác nhận.'; setErrors(invalid); setFeedback(null); if (Object.keys(invalid).length) {
        focusFirstError(event.currentTarget, invalid);
        return;
    } try {
        const result = await run(signal => management.write(operation, input, record ? String(record.id) : undefined, signal));
        onSaved(result);
    }
    catch (e) {
        if (isCancelled(e) || handleError(e))
            return;
        const issues: Record<string, string> = {};
        if (e instanceof ApiError) {
            for (const issue of e.details)
                issues[issue.field] = 'Kiểm tra lại thông tin của trường này.';
            if (e.code === 'DUPLICATE_STUDENT_CODE')
                issues.studentCode = 'Mã số sinh viên đã tồn tại.';
            if (['DUPLICATE_ROOM_CODE', 'DUPLICATE_BUILDING_CODE'].includes(e.code))
                issues.code = 'Mã đã tồn tại.';
            if (e.status === 409 || e.code === 'CSRF_INVALID' || e.ambiguous) {
                setLocked(true);
                setUnknown(e.ambiguous);
            }
        }
        setErrors(issues);
        focusFirstError(formRef.current!, issues);
        setFeedback(notice(e));
    } }
    async function reconcile() { setFeedback(null); try {
        await run(async (signal) => { await api.getCsrfToken(signal); const identity = await auth.getCurrentIdentity(signal); if (identity.role !== 'BQL')
            throw new ApiError('FORBIDDEN', 403); if (unknown && operation.endsWith('Create')) {
            const input = body();
            const collection = operations[operation][0] as 'student-profiles' | 'buildings' | 'rooms' | 'receipts';
            const query = collection === 'receipts' ? { residenceId: String(input.residenceId) } : { q: String(input.studentCode ?? input.code), ...(collection === 'rooms' ? { buildingId: String(input.buildingId) } : {}) };
            const result = await management.list(collection, { ...query, page: 1, pageSize: 100 }, signal);
            const match = result.data.find(x => collection === 'receipts' ? 'residenceId' in x && x.residenceId === input.residenceId : collection === 'student-profiles' ? 'studentCode' in x && x.studentCode === input.studentCode : 'code' in x && x.code === input.code);
            if (match) {
                setFound({ collection, id: match.id });
                setFeedback({ title: 'Đã tìm thấy bản ghi', message: 'Mở bản ghi để kiểm tra. Kết quả này không xác định ai đã tạo bản ghi.', tone: 'info' });
            }
            else
                setFeedback({ title: 'Chưa tìm thấy bản ghi khớp', message: 'Chưa thể kết luận thao tác trước thất bại. Giữ nguyên yêu cầu; kiểm tra danh sách trước khi tạo mới.', tone: 'info' });
            return;
        } if (record && operation !== 'period')
            await management.get(operations[operation][0] as 'rooms', String(record.id), signal);
        else if (operation === 'period')
            await management.period(signal); if (unknown) {
            setFeedback({ title: 'Đã đọc lại trạng thái', message: 'Đóng cửa sổ để xem dữ liệu mới. Kiểm tra trạng thái trước khi thực hiện thao tác khác.', tone: 'info' });
        }
        else {
            setLocked(false);
            setConfirmed(false);
            setFeedback({ title: 'Đã làm mới thông tin', message: 'Đóng cửa sổ và kiểm tra dữ liệu cập nhật trước khi chủ động gửi lại.', tone: 'info' });
        } });
    }
    catch (e) {
        if (!isCancelled(e) && !handleError(e))
            setFeedback(notice(e));
    } }
    const note = { approve: 'Chọn phòng đang sử dụng, đúng giới tính và còn chỗ. Duyệt thành công giữ một chỗ và tạo hồ sơ lưu trú; chưa xác nhận nhận phòng.', reject: 'Lý do hiển thị cho sinh viên. Không tạo lưu trú hoặc giữ chỗ.', cancel: 'Giải phóng một chỗ, giữ đơn đã duyệt, lịch sử và mọi phiếu thu.', checkIn: 'Ngày nhận không trong tương lai. Nhận phòng không giảm thêm chỗ.', checkOut: 'Giải phóng một chỗ. Phiếu chưa thanh toán và lịch sử được giữ nguyên.', pay: 'Chỉ xác nhận khi đã nhận đủ tiền. Không thu từng phần; người xác nhận được lưu từ phiên đăng nhập.', receiptCreate: 'Mỗi lưu trú một phiếu thu. Số tiền lấy từ giá phòng lúc lập và giữ nguyên về sau.', profileCreate: 'Hồ sơ có trước tài khoản. Quyền cấp tài khoản thuộc Quản trị viên.', profileUpdate: 'Mã số sinh viên bất biến. Hệ thống kiểm tra giới tính với đơn và lưu trú hiện có.', roomCreate: 'Mã phòng duy nhất trong từng tòa nhà. Phí là số nguyên đồng cho mỗi người trong một kỳ.', roomUpdate: 'Không đổi mã phòng hoặc tòa nhà. Thay đổi giá không làm đổi số tiền trên phiếu thu cũ.', buildingCreate: 'Mã tòa nhà là duy nhất và không thay đổi sau khi tạo.', buildingUpdate: 'Chỉ cập nhật tên tòa nhà.', period: 'Đóng kỳ ngừng nhận đơn mới; không thay đổi đơn đã gửi hoặc hồ sơ lưu trú.' }[operation];
    const content = <><header className={styles.pageTitle}><div><h2 id="editor-title">{actionTitles[operation]}</h2><p>{record && 'code' in record ? record.code : student ? student.studentCode + ' · ' + student.fullName : ''}</p></div>{onClose && <button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>Đóng</button>}</header>{feedback && <Feedback notice={feedback}>{locked && <button type="button" className={styles.secondary} disabled={busy} onClick={() => void reconcile()}>Kiểm tra trạng thái hiện tại</button>}{found && <ManagementLink href={'/management/' + found.collection + '/' + found.id} className={styles.secondary}>Xem bản ghi</ManagementLink>}</Feedback>}
  <form ref={formRef} noValidate onSubmit={submit} aria-busy={busy} className={styles.stack}>{operation === 'roomCreate' && <><Picker collection="buildings" label="Tòa nhà" value={values.buildingId ?? ''} disabled={disabled} onSelect={item => { setValues(v => ({ ...v, buildingId: item.id })); setErrors(e => ({ ...e, buildingId: '' })); }}/><FieldError id="building-error" message={errors.buildingId}/></>}{operation === 'approve' && <><Picker collection="rooms" label="Phòng xếp thực tế" value={values.roomId ?? ''} query={{ status: 'ACTIVE', hasAvailability: true, gender: student?.gender }} disabled={disabled} eligible={item => 'availablePlaces' in item && item.availablePlaces > 0 && item.gender === student?.gender} onSelect={item => { setValues(v => ({ ...v, roomId: item.id })); setErrors(e => ({ ...e, roomId: '' })); }}/><FieldError id="room-error" message={errors.roomId}/></>}{operation === 'receiptCreate' && <><Picker collection="residences" label="Hồ sơ lưu trú" value={values.residenceId ?? ''} disabled={disabled} onSelect={item => { setValues(v => ({ ...v, residenceId: item.id })); setErrors(e => ({ ...e, residenceId: '' })); }}/><FieldError id="residence-error" message={errors.residenceId}/>{values.residenceId && <ReceiptPreview id={values.residenceId}/>}</>}
    {operation === 'pay' && record && 'amountVnd' in record && <p className={styles.amount}>{money(record.amountVnd)}</p>}{operation === 'period' && <p className={styles.note}>Trạng thái mới: <strong>{labels[values.status]}</strong></p>}
    <div className={styles.twoColumns}>{fields.map(f => <div className={styles.field} key={f.key}><label htmlFor={'edit-' + f.key}>{f.label}{f.required ? ' *' : ''}</label>{f.options ? <select id={'edit-' + f.key} name={f.key} disabled={disabled} value={values[f.key] ?? ''} onChange={e => { setValues(v => ({ ...v, [f.key]: e.target.value })); setErrors(x => ({ ...x, [f.key]: '' })); }} aria-invalid={!!errors[f.key]} aria-describedby={f.key + '-help'}><option value="">Chọn một giá trị</option>{f.options.map(o => <option key={o} value={o}>{labels[o]}</option>)}</select> : f.type === 'textarea' ? <textarea id={'edit-' + f.key} name={f.key} disabled={disabled} value={values[f.key] ?? ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} aria-invalid={!!errors[f.key]} aria-describedby={f.key + '-help'}/> : <input id={'edit-' + f.key} name={f.key} type={f.type ?? 'text'} disabled={disabled} value={values[f.key] ?? ''} max={f.type === 'date' ? today() : undefined} onChange={e => { setValues(v => ({ ...v, [f.key]: e.target.value })); setErrors(x => ({ ...x, [f.key]: '' })); }} aria-invalid={!!errors[f.key]} aria-describedby={f.key + '-help'}/>}<p id={f.key + '-help'} className={errors[f.key] ? styles.fieldError : styles.muted}>{errors[f.key] || f.help || (!f.required ? 'Không bắt buộc.' : 'Bắt buộc.')}</p></div>)}</div><p className={styles.note}>{note}</p>{confirmation && <div><label className={styles.check}><input name="confirmed" type="checkbox" disabled={disabled} checked={confirmed} aria-describedby="confirmed-error" onChange={e => setConfirmed(e.target.checked)}/>{operation === 'pay' ? 'Tôi xác nhận đã nhận đủ số tiền ghi trên phiếu.' : 'Tôi đã kiểm tra thông tin và xác nhận thao tác này.'}</label><FieldError id="confirmed-error" message={errors.confirmed}/></div>}{errors[''] && <p className={styles.fieldError} role="alert">{errors['']}</p>}<div className={styles.actions}><button className={['reject', 'cancel'].includes(operation) ? styles.danger : styles.primary} type="submit" disabled={disabled}>{busy ? 'Đang xử lý…' : actionTitles[operation]}</button>{onClose && <button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>Quay lại</button>}</div></form></>;
    return modal ? <dialog ref={dialog} className={styles.dialog} aria-labelledby="editor-title" onCancel={e => { e.preventDefault(); if (!busy)
        onClose?.(); }}>{content}</dialog> : <section className={styles.panel}>{content}</section>;
}
