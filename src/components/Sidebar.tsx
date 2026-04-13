'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODULES, MODULE_CATEGORIES } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { href: '/reports', label: 'Reports Library', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#1B2A3D',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 50, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #C23141, #E63946)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff',
          }}>R</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>RefractOne</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>AI Research Platform</div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div style={{ padding: '12px 10px 8px' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.6)',
              fontSize: 13, fontWeight: active ? 600 : 500,
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Module categories */}
      <div style={{ padding: '4px 10px', flex: 1 }}>
        {MODULE_CATEGORIES.map((cat) => {
          const mods = MODULES.filter((m) => m.category === cat.key && m.available);
          if (!mods.length) return null;
          return (
            <div key={cat.key} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                letterSpacing: 1.5, textTransform: 'uppercase',
                padding: '0 12px', marginBottom: 4,
              }}>
                {cat.label}
              </div>
              {mods.map((mod) => {
                const active = pathname === `/${mod.id}`;
                return (
                  <Link key={mod.id} href={`/${mod.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 12px', borderRadius: 6, marginBottom: 1,
                    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 13 }}>{mod.icon}</span>
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{mod.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom: AI Insights */}
      <div style={{
        padding: '12px 18px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#34d399',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>AI Insights</span>
        </div>
      </div>
    </aside>
  );
}
