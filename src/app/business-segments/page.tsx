'use client';

import { useState, useEffect } from 'react';
import { loadHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';
import SegmentDossierPanel from '@/components/business-segment/SegmentDossierPanel';
import CorporateSubsidiaryPanel from '@/components/corporate-subsidiary/CorporateSubsidiaryPanel';
import type { CorporateEntity } from '@ai-insights/types';

// Corporate Subsidiary (formerly Business Segments). Tab 1 maps the corporate
// family tree; picking an entity there runs the Business Segment dossier on it
// in tab 2 (segments, financials, decision makers, then a battlecard).
type Tab = 'subsidiaries' | 'dossier';
const TABS: { id: Tab; label: string }[] = [
  { id: 'subsidiaries', label: 'Corporate Subsidiaries' },
  { id: 'dossier', label: 'Business Segment' },
];
const ACCENT = '#7C3AED';

function initialTab(): Tab {
  if (typeof window === 'undefined') return 'subsidiaries';
  return new URLSearchParams(window.location.search).get('tab') === 'dossier' ? 'dossier' : 'subsidiaries';
}

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

export default function CorporateSubsidiaryPage() {
  const [tab, setTab] = useState<Tab>('subsidiaries');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [subsidiaryEntry, setSubsidiaryEntry] = useState<HistoryEntry | null>(null);
  const [dossierEntry, setDossierEntry] = useState<HistoryEntry | null>(null);
  const [legacyEntry, setLegacyEntry] = useState<HistoryEntry | null>(null);
  const [autoStart, setAutoStart] = useState<{ companyName: string; companyDomain: string; linkedinUrl?: string; nonce: number } | null>(null);

  function changeTab(t: Tab) {
    setTab(t);
    try {
      const url = new URL(window.location.href);
      if (t === 'dossier') url.searchParams.set('tab', 'dossier'); else url.searchParams.delete('tab');
      window.history.replaceState(null, '', url.toString());
    } catch { /* ignore */ }
  }

  function openEntry(entry: HistoryEntry) {
    if (entry.moduleType === 'business-segment') { setDossierEntry(entry); changeTab('dossier'); }
    else if (entry.moduleType === 'corporate-subsidiary') { setLegacyEntry(null); setSubsidiaryEntry(entry); changeTab('subsidiaries'); }
    else if (entry.moduleType === 'business-segments') { setLegacyEntry(entry); changeTab('subsidiaries'); }
  }

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    setTab(initialTab());
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry) openEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function analyseEntity(entity: CorporateEntity) {
    // A LinkedIn page shared with the parent says nothing about this entity,
    // so only an entity's own page is passed on as an identity anchor.
    setAutoStart({
      companyName: entity.legalName,
      companyDomain: hostOf(entity.webpageUrl),
      linkedinUrl: entity.linkedinIsParent ? undefined : entity.linkedinUrl || undefined,
      nonce: Date.now(),
    });
    setDossierEntry(null);
    changeTab('dossier');
  }

  const refreshCount = () => setHistoryCount(loadHistory().length);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column', color: '#1B2A3D' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule={tab === 'dossier' ? 'business-segment' : 'corporate-subsidiary'}
          onSelectSameModule={openEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', borderBottom: '1px solid #CCDFEA', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ModuleIcon id="business-segments" size={20} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Corporate Subsidiary</span>
          </div>
          <button onClick={() => setShowHistory(true)} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#FFFFFF', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Report History {historyCount > 0 && `(${historyCount})`}
          </button>
        </div>
      </div>

      <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid #CCDFEA', padding: '0 32px', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button key={t.id} role="tab" aria-selected={active} onClick={() => changeTab(t.id)} style={{ padding: '12px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#1B2A3D' : '#8A9DAD', borderBottom: active ? `3px solid ${ACCENT}` : '3px solid transparent', marginBottom: -1 }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, padding: '32px' }}>
        {/* Both panels stay mounted so switching tabs never loses a running job. */}
        <div style={{ display: tab === 'subsidiaries' ? 'block' : 'none' }}>
          {legacyEntry?.businessSegmentsData ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Saved from the earlier Business Segments module.</p>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{legacyEntry.targetCompany}</h2>
              {(legacyEntry.businessSegmentsData.segments || []).map((s, i) => (
                <div key={i} style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: ACCENT, margin: '0 0 6px' }}>{s.name}</h3>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{s.description}</p>
                </div>
              ))}
              <button onClick={() => setLegacyEntry(null)} style={{ marginTop: 12, padding: '10px 22px', borderRadius: 8, border: `1px solid ${ACCENT}`, background: 'transparent', color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>New Company</button>
            </div>
          ) : (
            <CorporateSubsidiaryPanel restore={subsidiaryEntry} onSaved={refreshCount} onSelectEntity={analyseEntity} />
          )}
        </div>
        <div style={{ display: tab === 'dossier' ? 'block' : 'none' }}>
          <SegmentDossierPanel restore={dossierEntry} onSaved={refreshCount} autoStart={autoStart} />
        </div>
      </div>
    </div>
  );
}
