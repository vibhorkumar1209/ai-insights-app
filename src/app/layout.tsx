import type { Metadata } from 'next';
import './globals.css';
import SidebarWrapper from '@/components/SidebarWrapper';
import PendingJobsWatcher from '@/components/shared/PendingJobsWatcher';

export const metadata: Metadata = {
  title: 'RefractOne — AI Insights',
  description: 'RefractOne AI Insights — enterprise intelligence platform for peer benchmarking, financial analysis, and account planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PendingJobsWatcher />
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
