'use client';

import { ThemeDiscoveryRow, ThemeType } from '@ai-insights/types';
import BulletText from '@/components/shared/BulletText';
import SourceLinks from '@/components/shared/SourceLinks';

const ICON: Record<ThemeType, string> = { business: '🏢', technology: '⚙️', sustainability: '🌱' };
const ACCENT: Record<ThemeType, string> = { business: '#3491E8', technology: '#E63946', sustainability: '#10B981' };

const th = { textAlign: 'left' as const, padding: '10px 14px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: '#6B7280', borderBottom: '1px solid #CCDFEA', background: '#EAF2F6' };
const td = { padding: '12px 14px', fontSize: 13, color: '#374B5C', borderBottom: '1px solid #E3EDF2', verticalAlign: 'top' as const };

// The fixed discovery questions for the theme type, answered for the account.
export default function DiscoveryTable({ rows, themeType, companyName, sellerName }: {
  rows: ThemeDiscoveryRow[];
  themeType: ThemeType;
  companyName: string;
  sellerName?: string;
}) {
  const accent = ACCENT[themeType];
  const showSeller = rows.some((r) => r.sellerAngle);
  return (
    <section style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{ICON[themeType]}</span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: accent }}>Discovery: {companyName}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: showSeller ? 900 : 720 }}>
          <thead><tr>
            <th style={{ ...th, width: '16%' }}>Parameter to Analyze</th>
            <th style={{ ...th, width: '22%' }}>What to Uncover</th>
            <th style={th}>Finding</th>
            {showSeller && <th style={{ ...th, width: '22%' }}>{sellerName ? `Fit for ${sellerName}` : 'Seller Fit'}</th>}
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.parameter}>
                <td style={{ ...td, fontWeight: 700, color: '#1B2A3D' }}>{r.parameter}</td>
                <td style={{ ...td, fontStyle: 'italic' }}>{r.question}</td>
                <td style={td}>
                  <BulletText text={r.finding} color="#374B5C" boldColor="#1B2A3D" fontSize={13} bulletColor={accent} />
                  {r.source && <div style={{ marginTop: 6 }}><SourceLinks source={r.source} fontSize={11} /></div>}
                </td>
                {showSeller && <td style={td}>{r.sellerAngle || 'No clear fit'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
