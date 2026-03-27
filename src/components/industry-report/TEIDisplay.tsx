'use client';
import React from 'react';
import { TEIData, TEIItem } from '@/lib/types';

interface Props {
  data: TEIData;
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
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
      <div style={{ fontSize: 10, color: '#6B8FA5', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#E8EDF5', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

const CATEGORY_STYLES: Record<string, { headerBg: string; headerColor: string; accentBorder: string }> = {
  benefits: { headerBg: 'rgba(16,185,129,0.12)', headerColor: '#10B981', accentBorder: 'rgba(16,185,129,0.3)' },
  costs: { headerBg: 'rgba(230,57,70,0.12)', headerColor: '#E63946', accentBorder: 'rgba(230,57,70,0.3)' },
  risks: { headerBg: 'rgba(245,158,11,0.12)', headerColor: '#F59E0B', accentBorder: 'rgba(245,158,11,0.3)' },
};

function TEITable({ items, category, title }: { items: TEIItem[]; category: string; title: string }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.costs;
  if (!items || items.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(14,50,75,0.4)',
      border: `1px solid ${style.accentBorder}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        background: style.headerBg,
        fontSize: 12,
        fontWeight: 700,
        color: style.headerColor,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
      }}>
        {title}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: '#6B8FA5', textTransform: 'uppercase' as const, letterSpacing: 0.8, textAlign: 'left' as const, borderBottom: '1px solid rgba(30,74,104,0.3)' }}>Category</th>
            <th style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: '#6B8FA5', textTransform: 'uppercase' as const, letterSpacing: 0.8, textAlign: 'center' as const, borderBottom: '1px solid rgba(30,74,104,0.3)' }}>Year 1</th>
            <th style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: '#6B8FA5', textTransform: 'uppercase' as const, letterSpacing: 0.8, textAlign: 'center' as const, borderBottom: '1px solid rgba(30,74,104,0.3)' }}>Year 2</th>
            <th style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: '#6B8FA5', textTransform: 'uppercase' as const, letterSpacing: 0.8, textAlign: 'center' as const, borderBottom: '1px solid rgba(30,74,104,0.3)' }}>Year 3</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: '10px 14px', fontSize: 12, color: '#E2E8F0', fontWeight: 500, borderBottom: '1px solid rgba(30,74,104,0.2)' }}>
                {item.category}
                {item.description && (
                  <div style={{ fontSize: 11, color: '#6B8FA5', marginTop: 2 }}>{item.description}</div>
                )}
              </td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: '#B8CCDA', textAlign: 'center' as const, borderBottom: '1px solid rgba(30,74,104,0.2)', fontVariantNumeric: 'tabular-nums' }}>{item.year1}</td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: '#B8CCDA', textAlign: 'center' as const, borderBottom: '1px solid rgba(30,74,104,0.2)', fontVariantNumeric: 'tabular-nums' }}>{item.year2}</td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: '#B8CCDA', textAlign: 'center' as const, borderBottom: '1px solid rgba(30,74,104,0.2)', fontVariantNumeric: 'tabular-nums' }}>{item.year3}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TEIDisplay({ data }: Props) {
  return (
    <div style={{ marginTop: 20 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Net Present Value" value={data.netPresentValue} color="#10B981" />
        <KpiCard label="ROI" value={data.roi} color="#3491E8" />
        <KpiCard label="Payback Period" value={data.paybackPeriod} color="#22D3EE" />
      </div>

      {/* Tables */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
        <TEITable items={data.benefits} category="benefits" title="Benefits" />
        <TEITable items={data.costs} category="costs" title="Costs" />
        <TEITable items={data.risks} category="risks" title="Risks" />
      </div>
    </div>
  );
}
