'use client';

import Sidebar from './Sidebar';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
