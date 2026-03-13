'use client';

import { useState, useEffect } from 'react';
import {
  HistoryEntry,
  ModuleType,
  loadHistory,
  setPendingRestore,
} from '@/lib/history';

// ── Config ────────────────────────────────────────────────────────────────────

const MODULE_CONFIG: Record<
  ModuleType,
  { label: string; icon: string; accent: string; route: string }
> = {
  'peer-benchmarking': {
    label: 'Peer Benchmarking',
    icon: '🎯',
    accent: '#3491E8',
    route: '/peer-benchmarking',
  },
  'business-themes': {
    label: 'Business Themes',
    icon: '💼',
    accent: '#3491E8',
    route: '/business-themes',
  },
  'technology-themes': {
    label: 'Technology Themes',
    icon: '⚙️',
    accent: '#8B5CF6',
    route: '/technology-themes',
  },
  sustainability: {
    label: 'Sustainability Themes',
    icon: '🌱',
    accent: '#10B981',
    route: '/sustainability',
  },
  'challenges-growth': {
    label: 'Challenges & Growth',
    icon: '📈',
    accent: '#F59E0B',
    route: '/challenges-growth',
  },
};

// ── Helper renderers ──────────────────────────────────────────────────────────

function entrySubtitle(entry: HistoryEntry): string {
  if (entry.moduleType === 'peer-benchmarking' && entry.selectedPeers?.length) {
    return `vs ${entry.selectedPeers.join(', ')}`;
  }
  if (entry.moduleType === 'challenges-growth' && entry.challengesGrowthRows?.length) {
    return `${entry.challengesGrowthRows.length} dimensions analysed`;
  }
  if (entry.themeRows?.length) {
    return `${entry.themeRows.length} themes identified`;
  }
  return '';
}

function entryMeta(entry: HistoryEntry): string {
  if (entry.moduleType === 'peer-benchmarking') {
    const parts: string[] = [];
    if (entry.benchmarkingTable?.length) parts.push(`${entry.benchmarkingTable.length} dimensions`);
    if (entry.gapAnalysis?.length) parts.push(`${entry.gapAnalysis.length} gap rows`);
    if (entry.industryContext) parts.push(entry.industryContext);
    return parts.join(' · ');
  }
  if (entry.moduleType === 'challenges-growth') {
    return 'Challenges & Growth Analysis';
  }
  if (entry.themeType) {
    return `${entry.themeType.charAt(0).toUpperCase() + entry.themeType.slice(1)} themes`;
  }
  return '';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface HistoryDrawerProps {
  currentModule: ModuleType;
  onSelectSameModule: (entry: HistoryEntry) => void;
  onClose: () => void;
}

export default function HistoryDrawer({
  currentModule,
  onSelectSameModule,
  onClose,
}: HistoryDrawerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function handleView(entry: HistoryEntry) {
    if (entry.moduleType === currentModule) {
      onSelectSameModule(entry);
      onClose();
    } else {
      // Navigate to the correct module page; target page will auto-restore
      setPendingRestore(entry.id);
      window.location.href = MODULE_CONFIG[entry.moduleType].route;
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8,15,22,0.75)',
          zIndex: 40,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 500, maxWidth: '95vw',
        background: 'linear-gradient(180deg, #0c1e2d 0%, #080f16 100%)',
        borderLeft: '1px solid #1e4a68',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1e4a68',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#3491E8',
              letterSpacing: 2, marginBottom: 4,
            }}>
              REFRACTONE
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#E8EDF5' }}>
              Report History
            </div>
            <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 2 }}>
              {history.length} saved {history.length === 1 ? 'analysis' : 'analyses'} across all modules
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(30,74,104,0.4)',
              border: '1px solid #1e4a68',
              color: '#7eaabf',
              borderRadius: 8,
              width: 36, height: 36,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Entry list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '56px 0',
              color: '#4a7a96',
              fontSize: 13,
            }}>
              No analyses yet. Run your first analysis to see it here.
            </div>
          ) : (
            history.map((entry) => {
              const cfg = MODULE_CONFIG[entry.moduleType];
              const isCurrent = entry.moduleType === currentModule;

              return (
                <div
                  key={entry.id}
                  style={{
                    background: 'rgba(15,37,53,0.6)',
                    border: `1px solid ${isCurrent ? 'rgba(52,145,232,0.25)' : '#1e4a68'}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  {/* Top row: module badge + DEMO + date */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                    flexWrap: 'wrap',
                    gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {/* Module badge */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: `rgba(${hexToRgb(cfg.accent)},0.12)`,
                        border: `1px solid rgba(${hexToRgb(cfg.accent)},0.3)`,
                        borderRadius: 5,
                        padding: '2px 8px',
                        fontSize: 10, fontWeight: 700,
                        color: cfg.accent, letterSpacing: 0.5,
                      }}>
                        {cfg.icon} {cfg.label.toUpperCase()}
                      </span>
                      {/* COMPLETE badge */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 5, padding: '2px 8px',
                        fontSize: 10, fontWeight: 700,
                        color: '#34d399', letterSpacing: 0.5,
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#34d399',
                        }} />
                        COMPLETE
                      </span>
                      {/* DEMO badge */}
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
                    <span style={{ fontSize: 11, color: '#4a7a96', flexShrink: 0 }}>
                      {new Date(entry.completedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Company + subtitle */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#E8EDF5', marginBottom: 3 }}>
                      {entry.targetCompany}
                    </div>
                    {entrySubtitle(entry) && (
                      <div style={{ fontSize: 12, color: '#7eaabf', marginBottom: 2 }}>
                        {entrySubtitle(entry)}
                      </div>
                    )}
                    {entryMeta(entry) && (
                      <div style={{ fontSize: 11, color: '#4a7a96' }}>
                        {entryMeta(entry)}
                        {entry.userOrganization ? ` · ${entry.userOrganization}` : ''}
                      </div>
                    )}
                  </div>

                  {/* View button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleView(entry)}
                      style={{
                        background: isCurrent
                          ? `linear-gradient(135deg, #0e4560, ${cfg.accent})`
                          : 'rgba(30,74,104,0.5)',
                        border: isCurrent ? 'none' : '1px solid #1e4a68',
                        color: isCurrent ? '#fff' : '#7eaabf',
                        borderRadius: 7,
                        padding: '7px 16px',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      {isCurrent ? 'View Report →' : `Open in ${cfg.label} ↗`}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}
