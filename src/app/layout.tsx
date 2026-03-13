import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Refract One — AI Insights',
  description: 'Refract One AI Insights — enterprise intelligence platform for peer benchmarking, financial analysis, and account planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
