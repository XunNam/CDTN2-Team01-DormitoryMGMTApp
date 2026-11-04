"use client";
import { useCallback, useState, type FormEvent } from 'react';
import { ApiError, isCancelled } from '@/lib/api/client';
import { inputErrors } from '@/lib/student/contracts';
import { date, labels, studentNotice } from '@/lib/student/presentation';
import type { StudentProfile } from '@/lib/student/schema';
import type { Notice } from '@/lib/auth/notices';
import { useStudent } from './student-context';
import { useResource, useTask } from './hooks';
import { Feedback, Facts, FieldError, focusFirstError, PageTitle, LoadState, serverFields } from './ui';
import styles from './student.module.css';
function ContactForm({ profile }: {
    profile: StudentProfile;
}) {
    const { student, api, auth, busy, handleError } = useStudent(), run = useTask();
    const [phone, setPhone] = useState(profile.phone ?? ''), [email, setEmail] = useState(profile.email ?? ''), [errors, setErrors] = useState<Record<string, string>>({}), [feedback, setFeedback] = useState<Notice | null>(null), [locked, setLocked] = useState(false);
    async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (busy || locked)
        return; const form = e.currentTarget, input = { phone: phone.trim() || null, email: email.trim() || null }, invalid = inputErrors('ContactPatch', input); setErrors(invalid); setFeedback(null); if (Object.keys(invalid).length) {
        focusFirstError(form, invalid);
        return;
    } try {
        const saved = await run(signal => student.contact(input, signal));
        setPhone(saved.phone ?? '');
        setEmail(saved.email ?? '');
        setFeedback({ title: 'Đã lưu thông tin liên hệ', message: 'Điện thoại và email đã được cập nhật.', tone: 'info' });
    }
    catch (error) {
        if (isCancelled(error) || handleError(error))
            return;
        const fields = serverFields(error);
        setErrors(fields);
        focusFirstError(form, fields);
        setFeedback(studentNotice(error));
        if (error instanceof ApiError && (error.ambiguous || error.code === 'CSRF_INVALID'))
            setLocked(true);
    } }
    async function check() { try {
        const loaded = await run(async (signal) => { await api.getCsrfToken(signal); const identity = await auth.getCurrentIdentity(signal); if (identity.role !== 'SV' || identity.studentId !== profile.id)
            throw new ApiError('FORBIDDEN', 403); return student.profile(signal); });
        setPhone(loaded.phone ?? '');
        setEmail(loaded.email ?? '');
        setErrors({});
        setLocked(false);
        setFeedback({ title: 'Đã đọc lại hồ sơ', message: 'Các trường đang hiển thị thông tin hiện tại trên hệ thống. Kiểm tra trước khi chủ động lưu tiếp.', tone: 'info' });
    }
    catch (error) {
        if (!isCancelled(error) && !handleError(error))
            setFeedback(studentNotice(error));
    } }
    return <form className={styles.panel} onSubmit={submit} noValidate aria-busy={busy}><h2>Thông tin liên hệ</h2>{feedback && <Feedback notice={feedback}>{locked && <button type="button" className={styles.secondary} disabled={busy} onClick={() => void check()}>Đọc lại hồ sơ</button>}</Feedback>}<div className={styles.field}><label htmlFor="phone">Số điện thoại</label><input id="phone" name="phone" type="tel" disabled={busy || locked} value={phone} onChange={e => setPhone(e.target.value)} aria-invalid={!!errors.phone} aria-describedby="phone-help phone-error"/><p id="phone-help" className={styles.muted}>7–20 chữ số, có thể bắt đầu bằng +.</p><FieldError id="phone-error" message={errors.phone}/></div><div className={styles.field}><label htmlFor="email">Email</label><input id="email" name="email" type="email" disabled={busy || locked} value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby="email-error"/><FieldError id="email-error" message={errors.email}/></div><p className={styles.note}>Bạn chỉ có thể cập nhật điện thoại và email. Để trống để xóa thông tin liên hệ tương ứng.</p><button className={styles.primary} disabled={busy || locked}>{busy ? 'Đang lưu…' : 'Lưu thông tin liên hệ'}</button></form>;
}
export function ProfilePage() { const { student } = useStudent(); const load = useCallback((signal: AbortSignal) => student.profile(signal), [student]); const resource = useResource('profile', load); return <div className={styles.stack}><PageTitle title="Hồ sơ cá nhân" description="Xem hồ sơ và cập nhật điện thoại, email."/><LoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>{resource.data && <div className={styles.twoColumns}><section className={styles.panel}><h2>Hồ sơ sinh viên</h2><Facts items={[["Mã số sinh viên", resource.data.studentCode], ["Họ và tên", resource.data.fullName], ["Giới tính", labels[resource.data.gender]], ["Lớp", resource.data.className], ["Khoa", resource.data.faculty], ["Ngày sinh", date(resource.data.dateOfBirth)], ["Địa chỉ thường trú", resource.data.permanentAddress]]}/><p className={styles.muted}>Liên hệ Ban quản lý nếu thông tin hồ sơ cần được điều chỉnh.</p></section><ContactForm key={resource.data.id} profile={resource.data}/></div>}</div>; }
