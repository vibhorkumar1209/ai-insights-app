'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BenchmarkFormData, BenchmarkJob, Competitor } from '@/lib/types';
import { discoverCompetitors, startBenchmark, streamBenchmarkProgress } from '@/lib/api';
import { loadHistory, saveToHistory, seedHistory, HistoryEntry } from '@/lib/history';
import { MEDTRONIC_SAMPLE } from '@/data/medtronic-sample';
import InputForm from '@/components/peer-benchmarking/InputForm';
import CompetitorSelection from '@/components/peer-benchmarking/CompetitorSelection';
import ProgressTracker from '@/components/peer-benchmarking/ProgressTracker';
import BenchmarkResults from '@/components/peer-benchmarking/BenchmarkResults';

type Step = 'input' | 'select' | 'analyzing' | 'results';

// ── History Drawer ────────────────────────────────────────────────────────────

function HistoryDrawer({
  history,
  onSelect,
  onClose,
}: {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(8,15,22,0.7)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 480, maxWidth: '95vw',
        background: 'linear-gradient(180deg, #0c1e2d 0%, #080f16 100%)',
        borderLeft: '1px solid #1e4a68',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1e4a68',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 2, marginBottom: 4 }}>
              REFRACTONE
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#E8EDF5' }}>Report History</div>
            <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 2 }}>
              {history.length} saved {history.length === 1 ? 'analysis' : 'analyses'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(30,74,104,0.4)', border: '1px solid #1e4a68',
              color: '#7eaabf', borderRadius: 8,
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Entries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 0',
              color: '#4a7a96', fontSize: 13,
            }}>
              No analyses yet. Run your first benchmark to see results here.
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: 'rgba(15,37,53,0.6)',
                  border: '1px solid #1e4a68',
                  borderRadius: 10,
                  padding: '16px 18px',
                }}
              >
                {/* Status + date row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 5, padding: '2px 8px',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: 0.5 }}>
                        COMPLETE
                      </span>
                    </div>
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
                  <span style={{ fontSize: 11, color: '#4a7a96' }}>
                    {new Date(entry.completedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Company info */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#E8EDF5', marginBottom: 3 }}>
                    {entry.targetCompany}
                  </div>
                  <div style={{ fontSize: 12, color: '#7eaabf', marginBottom: 2 }}>
                    vs {entry.selectedPeers.join(', ')}
                  </div>
                  <div style={{ fontSize: 11, color: '#4a7a96' }}>
                    {entry.industryContext}
                    {entry.userOrganization ? ` · Selling org: ${entry.userOrganization}` : ''}
                  </div>
                </div>

                {/* Stats + view button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#4a7a96' }}>
                      {entry.benchmarkingTable.length} dimensions
                    </span>
                    <span style={{ color: '#1e4a68' }}>·</span>
                    <span style={{ fontSize: 11, color: '#4a7a96' }}>
                      {entry.gapAnalysis.length} gap rows
                    </span>
                  </div>
                  <button
                    onClick={() => { onSelect(entry); onClose(); }}
                    style={{
                      background: 'linear-gradient(135deg, #0e4560, #3491E8)',
                      border: 'none', color: '#fff',
                      borderRadius: 7, padding: '7px 16px',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    View Report →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PeerBenchmarkingPage() {
  const [step, setStep] = useState<Step>('input');
  const [formData, setFormData] = useState<BenchmarkFormData | null>(null);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<Competitor[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [jobState, setJobState] = useState<Partial<BenchmarkJob>>({});
  const [completedJob, setCompletedJob] = useState<BenchmarkJob | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Seed Medtronic demo + load history on mount
  useEffect(() => {
    seedHistory(MEDTRONIC_SAMPLE);
    setHistory(loadHistory());
  }, []);

  // Step 1 → 2: Discover competitors
  const handleFormSubmit = async (data: BenchmarkFormData) => {
    setFormData(data);
    setDiscovering(true);
    setDiscoverError('');
    try {
      const competitors = await discoverCompetitors(data.targetCompany, data.industryContext);
      setDiscoveredCompetitors(competitors);
      setStep('select');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to discover competitors';
      setDiscoverError(msg);
    } finally {
      setDiscovering(false);
    }
  };

  // Step 2 → 3: Start benchmark
  const handleCompetitorsConfirmed = async (selectedCompetitors: string[]) => {
    if (!formData) return;

    setStep('analyzing');
    setJobState({ status: 'pending', progress: 0 });

    try {
      const jobId = await startBenchmark({
        userOrganization: formData.userOrganization,
        targetCompany: formData.targetCompany,
        industryContext: formData.industryContext,
        focusAreas: formData.focusAreas || undefined,
        solutionPortfolio: formData.solutionPortfolio || undefined,
        additionalContext: formData.additionalContext || undefined,
        selectedCompetitors,
      });

      streamBenchmarkProgress(
        jobId,
        (partial) => setJobState((prev) => ({ ...prev, ...partial })),
        (completed) => {
          setCompletedJob(completed);
          setStep('results');
          // Persist to history
          if (completed.benchmarkingTable && completed.gapAnalysis) {
            saveToHistory({
              targetCompany: formData.targetCompany,
              userOrganization: formData.userOrganization,
              industryContext: formData.industryContext,
              completedAt: completed.completedAt || new Date().toISOString(),
              selectedPeers: completed.selectedPeers || selectedCompetitors,
              benchmarkingTable: completed.benchmarkingTable,
              gapAnalysis: completed.gapAnalysis,
            });
            setHistory(loadHistory());
          }
        },
        (errMsg) => {
          setJobState((prev) => ({ ...prev, status: 'error', error: errMsg }));
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start benchmark';
      setJobState({ status: 'error', error: msg, progress: 0 });
    }
  };

  // Restore a result from history
  const handleSelectHistory = (entry: HistoryEntry) => {
    const restoredJob: BenchmarkJob = {
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      selectedPeers: entry.selectedPeers,
      benchmarkingTable: entry.benchmarkingTable,
      gapAnalysis: entry.gapAnalysis,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    };
    setFormData({
      userOrganization: entry.userOrganization,
      targetCompany: entry.targetCompany,
      industryContext: entry.industryContext,
      focusAreas: '',
      solutionPortfolio: '',
      additionalContext: '',
    });
    setCompletedJob(restoredJob);
    setStep('results');
  };

  const handleReset = () => {
    setStep('input');
    setFormData(null);
    setDiscoveredCompetitors([]);
    setJobState({});
    setCompletedJob(null);
    setDiscoverError('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080f16' }}>
      {/* History Drawer */}
      {showHistory && (
        <HistoryDrawer
          history={history}
          onSelect={handleSelectHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '16px 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{
            color: '#7eaabf', textDecoration: 'none', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ← Home
          </Link>
          <div style={{ width: 1, height: 16, background: '#1e4a68' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#3491E8' }}>
              REFRACTONE
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#E8EDF5' }}>
              Peer Benchmarking & Gap Analysis
            </div>
          </div>
          {/* Report History button */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(52,145,232,0.1)',
              border: '1px solid rgba(52,145,232,0.25)',
              color: '#6ab8ff',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#6ab8ff" strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke="#6ab8ff" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Report History
            {history.length > 0 && (
              <span style={{
                background: '#3491E8', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Breadcrumb steps */}
      <div style={{
        background: 'rgba(12,54,73,0.4)',
        borderBottom: '1px solid rgba(30,74,104,0.4)',
        padding: '10px 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {[
            { key: 'input', label: '1 Configure' },
            { key: 'select', label: '2 Select Peers' },
            { key: 'analyzing', label: '3 Analyze' },
            { key: 'results', label: '4 Results' },
          ].map(({ key, label }, i, arr) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: step === key ? '#E8EDF5' : '#4a7a96',
                background: step === key ? 'rgba(52,145,232,0.15)' : 'transparent',
                border: `1px solid ${step === key ? 'rgba(52,145,232,0.3)' : 'transparent'}`,
                borderRadius: 6,
                padding: '3px 10px',
              }}>
                {label}
              </span>
              {i < arr.length - 1 && <span style={{ color: '#1e4a68', fontSize: 16 }}>›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px' }}>
        {discoverError && step === 'input' && (
          <div style={{
            background: 'rgba(230,57,70,0.08)',
            border: '1px solid rgba(230,57,70,0.3)',
            borderRadius: 8,
            padding: 14,
            marginBottom: 20,
            fontSize: 13,
            color: '#ff6b75',
          }}>
            {discoverError} — Please try again.
          </div>
        )}

        {step === 'input' && (
          <InputForm onSubmit={handleFormSubmit} loading={discovering} />
        )}

        {step === 'select' && formData && (
          <CompetitorSelection
            targetCompany={formData.targetCompany}
            discovered={discoveredCompetitors}
            onConfirm={handleCompetitorsConfirmed}
            onBack={() => setStep('input')}
          />
        )}

        {step === 'analyzing' && formData && (
          <ProgressTracker job={jobState} targetCompany={formData.targetCompany} />
        )}

        {step === 'results' && completedJob && formData && (
          <BenchmarkResults
            job={completedJob}
            targetCompany={formData.targetCompany}
            userOrganization={formData.userOrganization}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
