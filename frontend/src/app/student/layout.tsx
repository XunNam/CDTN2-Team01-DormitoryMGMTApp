import type { Metadata } from 'next';
import { StudentProvider } from '@/components/student/student-context';
import { StudentShell } from '@/components/student/student-shell';
export const metadata: Metadata = { title: 'DormFlow | Cổng Sinh viên' };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <StudentProvider><StudentShell>{children}</StudentShell></StudentProvider>; }
