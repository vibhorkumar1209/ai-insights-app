'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Competitor } from '@ai-insights/types';
import { discoverCompetitors } from '@/lib/api';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

type Step = 'input' | 'loading' | 'results';

interface PeerCard {
  name: string;
  description: string;
  estimatedRevenue?: string;
  employees?: string;
}

export default function PeersPage() {
  const [step, setStep] = useState<Step>('input');
  const [companyName, setCompanyName] = useState('');
  const [industryContext, setIndustryContext] = useState('');
  const [peers, setPeers] = useState<PeerCard[]>([]);
  const [error, setError] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'peers' && entry.peerCompanies) {
        setCompanyName(entry.targetCompany);
        setPeers(entry.peerCompanies);
        setStep('results');
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setError('');
    setStep('loading');

    try {
      const competitors: Competitor[] = await discoverCompetitors(
        companyName.trim(),
        industryContext.trim() || undefined,
      );

      const peerCards: PeerCard[] = competitors.slice(0, 10).map((c) => ({
        name: c.name,
        description: c.description,
        estimatedRevenue: c.estimatedRevenue,
        employees: c.employees,
      }));

      setPeers(peerCards);
      setStep('results');

      saveToHistory({
        moduleType: 'peers',
        targetCompany: companyName.trim(),
        completedAt: new Date().toISOString(),
        peerCompanies: peerCards,
      });
      setHistoryCount(loadHistory().length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover peers');
      setStep('input');
    }
  }

  function handleReset() {
    setStep('input');
    setCompanyName('');
    setIndustryContext('');
    setPeers([]);
    setError('');
  }

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'peers' || !entry.peerCompanies) return;
    setCompanyName(entry.targetCompany);
    setPeers(entry.peerCompanies);
    setStep('results');
  }

  const accent = '#6366F1';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1B2A3D' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="peers"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        borderBottom: '1px solid #CCDFEA',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>
            &larr; Home
          </Link>
          <span style={{ color: '#CCDFEA' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ModuleIcon id="peers" size={22} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Peers</span>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: accent,
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          History {historyCount > 0 && `(${historyCount})`}
        </button>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        {/* Input Form */}
        {step === 'input' && (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
              border: '1px solid #CCDFEA',
              borderRadius: 14,
              padding: '32px 28px',
              maxWidth: 580,
              margin: '0 auto',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#FFFFFF' }}>
                Peer Discovery
              </h2>
              <p style={{ fontSize: 13, color: '#4A6274', marginBottom: 28, lineHeight: 1.5 }}>
                Discover up to 10 peer companies with revenue and employee details.
              </p>

              <label style={{ display: 'block', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 }}>
                  Company Name *
                </span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Medtronic, Salesforce, Tesla"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #CCDFEA',
                    background: 'rgba(8,15,22,0.6)',
                    color: '#1B2A3D',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 28 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 }}>
                  Industry Context (optional)
                </span>
                <input
                  type="text"
                  value={industryContext}
                  onChange={(e) => setIndustryContext(e.target.value)}
                  placeholder="e.g. Medical devices, Enterprise SaaS, Electric vehicles"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #CCDFEA',
                    background: 'rgba(8,15,22,0.6)',
                    color: '#1B2A3D',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              {error && (
                <div style={{ color: '#E63946', fontSize: 13, marginBottom: 16 }}>{error}</div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${accent}, #4F46E5)`,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Discover Peers &rarr;
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div style={{
            background: 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
            border: '1px solid #CCDFEA',
            borderRadius: 14,
            padding: '48px 28px',
            textAlign: 'center',
            maxWidth: 580,
            margin: '0 auto',
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(99,102,241,0.2)',
              borderTopColor: accent,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 20px',
            }} />
            <p style={{ color: '#4A6274', fontSize: 14 }}>
              Discovering peers for <strong style={{ color: '#1B2A3D' }}>{companyName}</strong>...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results — 2x5 Ticker Grid */}
        {step === 'results' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ModuleIcon id="peers" size={24} />
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                  Peers of <span style={{ color: accent }}>{companyName}</span>
                </h2>
              </div>
              <span style={{
                fontSize: 12,
                color: '#10B981',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 6,
                padding: '4px 10px',
                fontWeight: 600,
              }}>
                {peers.length} peers found
              </span>
            </div>

            {/* 2x5 Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}>
              {peers.map((peer, i) => (
                <div
                  key={i}
                  style={{
                    background: 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 12,
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${accent}, transparent)`,
                    opacity: 0.6,
                  }} />

                  {/* Rank badge */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'rgba(99,102,241,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: accent,
                  }}>
                    {i + 1}
                  </div>

                  {/* Company name */}
                  <h3 style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1B2A3D',
                    marginBottom: 8,
                    paddingRight: 30,
                  }}>
                    {peer.name}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: 12,
                    color: '#4A6274',
                    lineHeight: 1.5,
                    marginBottom: 14,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {peer.description}
                  </p>

                  {/* Revenue & Employees row */}
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    borderTop: '1px solid rgba(30,74,104,0.3)',
                    paddingTop: 12,
                  }}>
                    {peer.estimatedRevenue && (
                      <div style={{
                        flex: 1,
                        background: 'rgba(8,15,22,0.4)',
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}>
                        <div style={{ fontSize: 10, color: '#4a7a96', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                          Revenue
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#22D3EE' }}>
                          {peer.estimatedRevenue}
                        </div>
                      </div>
                    )}
                    {peer.employees && (
                      <div style={{
                        flex: 1,
                        background: 'rgba(8,15,22,0.4)',
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}>
                        <div style={{ fontSize: 10, color: '#4a7a96', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                          Employees
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>
                          {peer.employees}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleReset}
              style={{
                marginTop: 24,
                padding: '10px 22px',
                borderRadius: 8,
                border: `1px solid ${accent}`,
                background: 'transparent',
                color: accent,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              New Search
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
