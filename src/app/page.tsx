'use client';

import { useState, useEffect } from 'react';
import ModuleCard from '@/components/ModuleCard';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import { MODULES } from '@/lib/types';
import { loadHistory, HistoryEntry, setPendingRestore } from '@/lib/history';

export default function HomePage() {
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
  }, []);

  // Cross-module navigate: set pending restore, go to the target module page
  function handleHistorySelect(entry: HistoryEntry) {
    setPendingRestore(entry.id);
    window.location.href = `/${entry.moduleType}`;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f16' }}>

      {showHistory && (
        // Dashboard has no "current module" — pass an arbitrary one for the drawer
        // onSelectSameModule is handled as cross-module navigation here too
        <HistoryDrawer
          currentModule="peer-benchmarking"
          onSelectSameModule={handleHistorySelect}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '24px 32px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#E8EDF5', lineHeight: 1.2 }}>
              RefractOne AI Insights
            </div>
            <div style={{ fontSize: 14, color: '#7eaabf', marginTop: 6 }}>
              Enterprise intelligence for peer benchmarking, financial analysis, and account planning
            </div>
          </div>

          {/* Report History button */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              background: 'rgba(52,145,232,0.1)',
              border: '1px solid rgba(52,145,232,0.25)',
              color: '#6ab8ff',
              borderRadius: 8, padding: '10px 18px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#6ab8ff" strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke="#6ab8ff" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Report History
            {historyCount > 0 && (
              <span style={{
                background: '#3491E8', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800,
              }}>
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Module Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', letterSpacing: 2, marginBottom: 8 }}>
            ANALYSIS MODULES
          </div>
          <div style={{ height: 2, background: 'linear-gradient(90deg, #3491E8, transparent)', width: 200 }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}>
          {MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              label={module.label}
              icon={module.icon}
              available={module.available}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
