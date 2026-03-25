'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Step = 'input' | 'loading' | 'results';

export default function BusinessDescriptionPage() {
  const [step, setStep] = useState<Step>('input');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'business-description' && entry.businessDescription) {
        setCompanyName(entry.targetCompany);
        setDomain(entry.companyDomain ?? '');
        setDescription(entry.businessDescription);
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
      const res = await fetch(`${API_URL}/api/business-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), domain: domain.trim() || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const desc = data.description as string;
      setDescription(desc);
      setStep('results');

      saveToHistory({
        moduleType: 'business-description',
        targetCompany: companyName.trim(),
        completedAt: new Date().toISOString(),
        businessDescription: desc,
        companyDomain: domain.trim() || undefined,
      });
      setHistoryCount(loadHistory().length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate description');
      setStep('input');
    }
  }

  function handleReset() {
    setStep('input');
    setCompanyName('');
    setDomain('');
    setDescription('');
    setError('');
  }

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'business-description' || !entry.businessDescription) return;
    setCompanyName(entry.targetCompany);
    setDomain(entry.companyDomain ?? '');
    setDescription(entry.businessDescription);
    setStep('results');
  }

  const accent = '#06B6D4';

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', color: '#E8EDF5' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="business-description"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: '#7eaabf', fontSize: 13, textDecoration: 'none' }}>
            &larr; Home
          </Link>
          <span style={{ color: '#1e4a68' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ModuleIcon id="business-description" size={22} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Business Description</span>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
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

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>
        {/* Input Form */}
        {step === 'input' && (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
              border: '1px solid #1e4a68',
              borderRadius: 14,
              padding: '32px 28px',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#E8EDF5' }}>
                Business Description
              </h2>
              <p style={{ fontSize: 13, color: '#7eaabf', marginBottom: 28, lineHeight: 1.5 }}>
                Generate a concise 100-250 word description of any company&apos;s business.
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
                    border: '1px solid #1e4a68',
                    background: 'rgba(8,15,22,0.6)',
                    color: '#E8EDF5',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 28 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 }}>
                  Domain (optional)
                </span>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. medtronic.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #1e4a68',
                    background: 'rgba(8,15,22,0.6)',
                    color: '#E8EDF5',
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
                  background: `linear-gradient(135deg, ${accent}, #0891B2)`,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Generate Description &rarr;
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div style={{
            background: 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
            border: '1px solid #1e4a68',
            borderRadius: 14,
            padding: '48px 28px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: `3px solid rgba(6,182,212,0.2)`,
              borderTopColor: accent,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 20px',
            }} />
            <p style={{ color: '#7eaabf', fontSize: 14 }}>
              Researching <strong style={{ color: '#E8EDF5' }}>{companyName}</strong>...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results */}
        {step === 'results' && (
          <div>
            <div style={{
              background: 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: 14,
              padding: '28px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <ModuleIcon id="business-description" size={24} />
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{companyName}</h2>
                {domain && (
                  <span style={{ fontSize: 12, color: '#7eaabf', background: 'rgba(6,182,212,0.1)', borderRadius: 6, padding: '3px 8px' }}>
                    {domain}
                  </span>
                )}
              </div>
              <div style={{ borderTop: '1px solid rgba(30,74,104,0.4)', paddingTop: 20 }}>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: '#c8d6e5', whiteSpace: 'pre-wrap' }}>
                  {description}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <span style={{ fontSize: 11, color: '#4a7a96' }}>
                  {description.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              style={{
                marginTop: 20,
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
              New Description
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
