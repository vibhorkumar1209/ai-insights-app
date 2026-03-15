'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BenchmarkFormData, BenchmarkJob, Competitor } from '@/lib/types';
import { discoverCompetitors, startBenchmark, streamBenchmarkProgress } from '@/lib/api';
import { loadHistory, saveToHistory, seedHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import { MEDTRONIC_SAMPLE } from '@/data/medtronic-sample';
import InputForm from '@/components/peer-benchmarking/InputForm';
import CompetitorSelection from '@/components/peer-benchmarking/CompetitorSelection';
import ProgressTracker from '@/components/peer-benchmarking/ProgressTracker';
import BenchmarkResults from '@/components/peer-benchmarking/BenchmarkResults';
import HistoryDrawer from '@/components/shared/HistoryDrawer';

type Step = 'input' | 'select' | 'analyzing' | 'results';

export default function PeerBenchmarkingPage() {
  const [step, setStep] = useState<Step>('input');
  const [formData, setFormData] = useState<BenchmarkFormData | null>(null);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<Competitor[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [jobState, setJobState] = useState<Partial<BenchmarkJob>>({});
  const [completedJob, setCompletedJob] = useState<BenchmarkJob | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Seed Medtronic demo, load history count, check for cross-page restore
  useEffect(() => {
    seedHistory(MEDTRONIC_SAMPLE);
    setHistoryCount(loadHistory().length);

    // Cross-module restore: another page navigated here with a pending entry
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'peer-benchmarking') {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (!entry.benchmarkingTable || !entry.gapAnalysis) return;
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
      userOrganization: entry.userOrganization ?? '',
      targetCompany: entry.targetCompany,
      industryContext: entry.industryContext ?? '',
      focusAreas: '',
      solutionPortfolio: '',
      additionalContext: '',
    });
    setCompletedJob(restoredJob);
    setStep('results');
  }

  // Step 1 → 2: discover competitors
  const handleFormSubmit = async (data: BenchmarkFormData) => {
    setFormData(data);
    setDiscovering(true);
    setDiscoverError('');
    try {
      const competitors = await discoverCompetitors(data.targetCompany, data.industryContext || undefined);
      setDiscoveredCompetitors(competitors);
      setStep('select');
    } catch (err) {
      setDiscoverError(err instanceof Error ? err.message : 'Failed to discover competitors');
    } finally {
      setDiscovering(false);
    }
  };

  // Step 2 → 3: start benchmark
  const handleCompetitorsConfirmed = async (selectedCompetitors: string[]) => {
    if (!formData) return;
    setStep('analyzing');
    setJobState({ status: 'pending', progress: 0 });

    try {
      const jobId = await startBenchmark({
        userOrganization: formData.userOrganization,
        targetCompany: formData.targetCompany,
        industryContext: formData.industryContext || undefined,
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
          if (completed.benchmarkingTable && completed.gapAnalysis) {
            saveToHistory({
              moduleType: 'peer-benchmarking',
              targetCompany: formData.targetCompany,
              userOrganization: formData.userOrganization,
              industryContext: formData.industryContext,
              completedAt: completed.completedAt || new Date().toISOString(),
              selectedPeers: completed.selectedPeers || selectedCompetitors,
              benchmarkingTable: completed.benchmarkingTable,
              gapAnalysis: completed.gapAnalysis,
            });
            setHistoryCount(loadHistory().length);
          }
        },
        (errMsg) => setJobState((prev) => ({ ...prev, status: 'error', error: errMsg }))
      );
    } catch (err) {
      setJobState({ status: 'error', error: err instanceof Error ? err.message : 'Failed to start benchmark', progress: 0 });
    }
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
          currentModule="peer-benchmarking"
          onSelectSameModule={restoreEntry}
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
            {historyCount > 0 && (
              <span style={{
                background: '#3491E8', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {historyCount}
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
            padding: 14, marginBottom: 20,
            fontSize: 13, color: '#ff6b75',
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
