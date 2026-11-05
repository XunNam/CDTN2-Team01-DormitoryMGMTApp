import type { Metadata } from 'next';
import { ManagementProvider } from '@/components/management/management-context';
import { ManagementShell } from '@/components/management/management-shell';
export const metadata: Metadata = { title: 'DormFlow | Ban quản lý ký túc xá' };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <ManagementProvider><ManagementShell>{children}</ManagementShell></ManagementProvider>; }
