'use client';

import { HistoryEntry } from '@/lib/history';

interface RecentAnalysesProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
}

export default function RecentAnalyses({ history, onSelect }: RecentAnalysesProps) {
  if (history.length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
      }}>
        <div style={{ height: 2, width: 28, background: '#3491E8', borderRadius: 1 }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 2 }}>
          RECENT ANALYSES
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(160deg, #0f2535, #0c1e2d)',
              border: '1px solid #1e4a68',
              borderRadius: 10,
              padding: '14px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3491E8')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e4a68')}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#E8EDF5' }}>
                  {entry.targetCompany}
                </span>
                {entry.id === 'medtronic-demo-2026' && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: '#3491E8',
                    background: 'rgba(52,145,232,0.12)',
                    border: '1px solid rgba(52,145,232,0.3)',
                    borderRadius: 4, padding: '2px 6px', letterSpacing: 1,
                  }}>
                    DEMO
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#7eaabf' }}>
                vs {entry.selectedPeers?.join(', ')}
              </div>
              <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 3 }}>
                {entry.industryContext}
                {' · '}
                {new Date(entry.completedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ fontSize: 10, color: '#7eaabf' }}>
                  {entry.benchmarkingTable?.length ?? 0} dimensions
                </div>
                <div style={{ color: '#1e4a68' }}>·</div>
                <div style={{ fontSize: 10, color: '#7eaabf' }}>
                  {entry.gapAnalysis?.length ?? 0} gaps
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="#3491E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
