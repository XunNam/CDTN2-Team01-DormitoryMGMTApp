"use client";
import { useRouter } from 'next/navigation';
import type { Collection, Operation } from '@/lib/management/client';
import { ManagementLink } from './management-shell';
import { PageTitle } from './ui';
import { Editor, actionTitles } from './editor';
import styles from './management.module.css';
const operations: Partial<Record<Collection, Operation>> = { 'student-profiles': 'profileCreate', buildings: 'buildingCreate', rooms: 'roomCreate', receipts: 'receiptCreate' };
export function EntityCreate({ collection, residenceId }: {
    collection: Collection;
    residenceId?: string;
}) { const router = useRouter(), operation = operations[collection]; if (!operation)
    return null; return <div className={styles.stack + ' ' + styles.narrow}><ManagementLink className={styles.backLink} href={'/management/' + collection}>← Về danh sách</ManagementLink><PageTitle title={actionTitles[operation]} description="Điền thông tin và kiểm tra trước khi lưu."/><Editor operation={operation} initialResidenceId={residenceId} onSaved={value => { if ('id' in value)
    router.replace('/management/' + collection + '/' + value.id); }}/></div>; }
