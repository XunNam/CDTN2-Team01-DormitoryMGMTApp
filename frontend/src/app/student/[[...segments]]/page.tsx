import { notFound } from 'next/navigation';
import { UUID_PATTERN } from '@/lib/auth/contracts';
import { StudentHome } from '@/components/student/home';
import { Rooms, RoomDetail } from '@/components/student/rooms';
import { HistoryList, HistoryDetail, type HistoryCollection } from '@/components/student/history';
export default async function Page({ params }: {
    params: Promise<{
        segments?: string[];
    }>;
}) { const { segments = [] } = await params; if (!segments.length)
    return <StudentHome />; const [section, id] = segments; if (segments.length > 2 || !['rooms', 'applications', 'residences', 'receipts'].includes(section))
    notFound(); if (id && !UUID_PATTERN.test(id))
    notFound(); if (section === 'rooms')
    return id ? <RoomDetail key={id} id={id}/> : <Rooms />; const collection = section as HistoryCollection; return id ? <HistoryDetail key={section + id} collection={collection} id={id}/> : <HistoryList key={section} collection={collection}/>; }
