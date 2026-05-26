'use client';
import React from 'react';
import { TEIData, MacroTEIData, MacroTEIItem } from '@ai-insights/types';

interface Props {
  data?: TEIData;
  macroData?: MacroTEIData;
}

const IMPACT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  high: { bg: 'rgba(230,57,70,0.15)', color: '#E63946', border: 'rgba(230,57,70,0.3)' },
  medium: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  low: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)' },
};

function ImpactBadge({ level }: { level: string }) {
  const style = IMPACT_COLORS[level] || IMPACT_COLORS.medium;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      color: style.color,
      background: style.bg,
      border: `1px solid ${style.border}`,
    }}>
      {level}
    </span>
  );
}

function MacroTEITable({ items }: { items: MacroTEIItem[] }) {
  return (
    <div style={{
      background: 'rgba(14,50,75,0.4)',
      border: '1px solid rgba(30,74,104,0.3)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        background: 'rgba(52,145,232,0.08)',
        fontSize: 12,
        fontWeight: 700,
        color: '#3491E8',
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
      }}>
        Macroeconomic Impact Analysis
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, minWidth: 700 }}>
          <thead>
            <tr>
              {['Macroeconomic Trigger', 'Impact Level', 'Description', 'Examples', 'Impact on Market Size'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#6B8FA5',
                  textTransform: 'uppercase' as const,
                  letterSpacing: 0.8,
                  textAlign: 'left' as const,
                  borderBottom: '1px solid rgba(30,74,104,0.3)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(8,15,22,0.3)' }}>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#E2E8F0', fontWeight: 600, borderBottom: '1px solid rgba(30,74,104,0.2)', minWidth: 140 }}>
                  {item.trigger}
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(30,74,104,0.2)' }}>
                  <ImpactBadge level={item.impactLevel} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#B8CCDA', borderBottom: '1px solid rgba(30,74,104,0.2)', lineHeight: 1.5 }}>
                  {item.description}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#B8CCDA', borderBottom: '1px solid rgba(30,74,104,0.2)', lineHeight: 1.5, minWidth: 160 }}>
                  {item.examples}
                </td>
                <td style={{
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderBottom: '1px solid rgba(30,74,104,0.2)',
                  fontVariantNumeric: 'tabular-nums',
                  color: item.marketSizeImpact?.startsWith('-') ? '#E63946' : '#10B981',
                  whiteSpace: 'nowrap',
                }}>
                  {item.marketSizeImpact}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Legacy TEI display (benefits/costs/risks) — kept for backward compatibility
function LegacyKpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(8,15,22,0.5)',
      border: '1px solid rgba(30,74,104,0.4)',
      borderRadius: 12,
      padding: '16px 20px',
      textAlign: 'center' as const,
      position: 'relative' as const,
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute' as const, top: 0, left: '20%', right: '20%', height: 2, background: color, opacity: 0.5, borderRadius: '0 0 2px 2px' }} />
      <div style={{ fontSize: 10, color: '#6B8FA5', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1B2A3D', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export default function TEIDisplay({ data, macroData }: Props) {
  // New macro TEI display takes priority
  if (macroData?.items?.length) {
    return (
      <div style={{ marginTop: 20 }}>
        <MacroTEITable items={macroData.items} />
      </div>
    );
  }

  // Legacy fallback
  if (!data) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <LegacyKpiCard label="Net Present Value" value={data.netPresentValue} color="#10B981" />
        <LegacyKpiCard label="ROI" value={data.roi} color="#3491E8" />
        <LegacyKpiCard label="Payback Period" value={data.paybackPeriod} color="#22D3EE" />
      </div>
    </div>
  );
}
