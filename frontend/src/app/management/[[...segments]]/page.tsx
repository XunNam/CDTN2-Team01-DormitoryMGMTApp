import { notFound } from 'next/navigation';
import { UUID_PATTERN } from '@/lib/auth/contracts';
import type { Collection } from '@/lib/management/client';
import { Overview, PeriodPage } from '@/components/management/overview';
import { EntityList } from '@/components/management/entity-list';
import { EntityDetail } from '@/components/management/entity-detail';
import { EntityCreate } from '@/components/management/entity-create';
export default async function Page({ params, searchParams }: {
    params: Promise<{
        segments?: string[];
    }>;
    searchParams: Promise<{
        residenceId?: string;
    }>;
}) { const { segments = [] } = await params; if (!segments.length)
    return <Overview />; if (segments.length === 1 && segments[0] === 'statistics')
    return <Overview statistics/>; if (segments.length === 1 && segments[0] === 'registration-period')
    return <PeriodPage />; const [section, id] = segments; if (segments.length > 2 || !['student-profiles', 'buildings', 'rooms', 'applications', 'residences', 'receipts'].includes(section))
    notFound(); const collection = section as Collection; if (!id)
    return <EntityList collection={collection} key={collection}/>; if (id === 'new') {
    if (!['student-profiles', 'buildings', 'rooms', 'receipts'].includes(collection))
        notFound();
    return <EntityCreate collection={collection} key={collection} residenceId={(await searchParams).residenceId}/>;
} if (!UUID_PATTERN.test(id))
    notFound(); return <EntityDetail collection={collection} id={id} key={collection + id}/>; }
