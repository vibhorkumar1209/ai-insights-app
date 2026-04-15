'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

// Ping backend every 5 min to prevent Render free-tier spin-down
function useServerKeepAlive() {
  useEffect(() => {
    const ping = () => fetch(`${API_BASE}/health`, { cache: 'no-store' }).catch(() => {});
    ping(); // immediate ping on mount to wake server early
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
}

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  useServerKeepAlive();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
