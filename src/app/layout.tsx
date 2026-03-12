import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Insights — Financial Intelligence Platform',
  description: 'Enterprise AI platform for financial analysis, peer benchmarking, and account intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
