'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';
import HistoryDrawer from '@/components/shared/HistoryDrawer';

import { useState, useEffect, useRef } from 'react';
import { useJobManager } from '@/lib/useJobManager';
import { ContentGenerationResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, type HistoryEntry } from '@/lib/history';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

type Tone = 'professional' | 'smart_casual';
type Perspective = 'practitioner' | 'analyst';
type WordCount = 1000 | 1500 | 2500;

const STYLE_BTN =
  'px-4 py-2 rounded text-sm font-medium border transition-colors cursor-pointer';
const STYLE_ACTIVE = 'bg-[#3491E8] border-[#3491E8] text-white';
const STYLE_INACTIVE =
  'border-[#CCDFEA] text-[#6B7280] hover:border-[#E63946] hover:text-[#1B2A3D]';

const CHART_COLORS = ['#3491E8', '#2DD4BF', '#F59E0B', '#F06068', '#F87171'];

function RadioGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-[#6B7280] text-xs uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${STYLE_BTN} ${value === opt.value ? STYLE_ACTIVE : STYLE_INACTIVE}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Render markdown content with table and heading support
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H2 heading
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold text-[#1B2A3D] mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // H3 heading
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-[#1B2A3D] mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Markdown table detection — collect all table rows
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse headers (first row) and skip separator row
      const headers = tableLines[0]
        .split('|')
        .filter((c) => c.trim())
        .map((c) => c.trim());
      const dataRows = tableLines
        .slice(2) // skip header + separator
        .map((row) => row.split('|').filter((c) => c.trim()).map((c) => c.trim()));

      elements.push(
        <div key={i} className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#CCDFEA]">
                {headers.map((h, hi) => (
                  <th key={hi} className="text-left py-2 px-3 text-[#6B7280] font-medium uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className="border-b border-[#CCDFEA]/50 hover:bg-[#EDF4F8]">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-3 text-[#1B2A3D]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      elements.push(
        <p key={i} className="text-[#1B2A3D] text-sm leading-7 mb-3">
          {line}
        </p>
      );
    } else {
      // blank line — just a spacer
    }
    i++;
  }

  return <div>{elements}</div>;
}

// Chart renderer
function ContentChartView({
  chart,
}: {
  chart: { title: string; type: 'bar' | 'line'; data: Array<{ label: string; value: number }>; unit?: string };
}) {
  return (
    <div className="bg-white border border-[#CCDFEA] rounded-lg p-4 mb-4">
      <p className="text-[#6B7280] text-xs uppercase tracking-wider mb-3">{chart.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        {chart.type === 'bar' ? (
          <BarChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0c3649" />
            <XAxis dataKey="label" tick={{ fill: '#4A6274', fontSize: 11 }} />
            <YAxis tick={{ fill: '#4A6274', fontSize: 11 }} unit={chart.unit || ''} />
            <Tooltip
              contentStyle={{ background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8 }}
              labelStyle={{ color: '#1B2A3D' }}
              itemStyle={{ color: '#3491E8' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chart.data.map((_entry, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0c3649" />
            <XAxis dataKey="label" tick={{ fill: '#4A6274', fontSize: 11 }} />
            <YAxis tick={{ fill: '#4A6274', fontSize: 11 }} unit={chart.unit || ''} />
            <Tooltip
              contentStyle={{ background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8 }}
              labelStyle={{ color: '#1B2A3D' }}
              itemStyle={{ color: '#3491E8' }}
            />
            <Line type="monotone" dataKey="value" stroke="#3491E8" strokeWidth={2} dot={{ fill: '#3491E8', r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

interface RestoredResult {
  title?: string;
  content: string;
}

export default function IndustryThoughtLeadershipPage() {
  const [step, setStep] = useState<'input' | 'generating' | 'results'>('input');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [tone, setTone] = useState<Tone | null>(null);
  const [perspective, setPerspective] = useState<Perspective | null>(null);
  const [wordCount, setWordCount] = useState<WordCount | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [restoredResult, setRestoredResult] = useState<RestoredResult | null>(null);
  const selectedEntryRef = useRef<HistoryEntry | undefined>(undefined);

  const { job, error, isStuck, retryJob, startJob, cancelJob, reset } =
    useJobManager<ContentGenerationResult>();

  useEffect(() => {
    const entries = loadHistory().filter((e) => e.moduleType === 'industry-report');
    setHistoryEntries(entries);

    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'industry-thought-leadership' && entry.thoughtLeadershipContent) {
        setRestoredResult({ title: entry.thoughtLeadershipTitle, content: entry.thoughtLeadershipContent });
        setStep('results');
      }
    }
  }, []);

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType === 'industry-thought-leadership' && entry.thoughtLeadershipContent) {
      setRestoredResult({ title: entry.thoughtLeadershipTitle, content: entry.thoughtLeadershipContent });
      reset();
      setStep('results');
      setCopied(false);
    }
  }

  useEffect(() => {
    if (job?.status === 'complete') setStep('results');
    else if (job?.status === 'generating') setStep('generating');
  }, [job?.status]);

  const selectedEntry = historyEntries.find((e) => e.id === selectedEntryId);
  useEffect(() => { selectedEntryRef.current = selectedEntry; }, [selectedEntry]);

  const canGenerate = !!selectedEntry && !!tone && !!perspective && !!wordCount;

  const handleGenerate = () => {
    if (!selectedEntry || !tone || !perspective || !wordCount) return;

    const execSummary = selectedEntry.industryReportExecutiveSummary;
    const execSummaryStr = execSummary
      ? [execSummary.headline, ...(execSummary.paragraphs || [])].filter(Boolean).join(' | ')
      : undefined;

    const payload = {
      moduleType: 'industry-thought-leadership' as const,
      industryReportData: {
        query: selectedEntry.targetCompany,
        executiveSummary: execSummaryStr,
        sections: (selectedEntry.industryReportSections || []).map((s) => ({
          id: s.id,
          title: s.title,
          bodyParagraphs: s.bodyParagraphs,
          keyTable: s.keyTable,
        })),
      },
      voice: 'third_person' as const,
      tone,
      perspective,
      wordCount,
    };

    startJob({
      payload,
      endpoint: API_ENDPOINTS.contentGeneration,
      streamUrlFactory: API_ENDPOINTS.contentGenerationStream,
      persist: {
        moduleType: 'industry-thought-leadership',
        targetCompany: selectedEntry.targetCompany,
      },
    });
  };

  const displayContent = restoredResult ?? (job?.status === 'complete' ? { title: job.title, content: job.content } : null);

  const handleCopy = () => {
    if (!displayContent?.content) return;
    const text = `${displayContent.title ? displayContent.title + '\n\n' : ''}${displayContent.content}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    cancelJob();
    reset();
    setRestoredResult(null);
    setStep('input');
    setCopied(false);
  };

  // Save to history when complete
  useEffect(() => {
    if (job?.status === 'complete' && job.content) {
      const entry = selectedEntryRef.current;
      saveToHistory({
        moduleType: 'industry-thought-leadership',
        targetCompany: entry?.targetCompany || 'Unknown',
        completedAt: job.completedAt || new Date().toISOString(),
        thoughtLeadershipTitle: job.title,
        thoughtLeadershipContent: job.content,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-white text-[#1B2A3D]">
      {showHistory && (
        <HistoryDrawer
          currentModule="industry-thought-leadership"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}
      {/* Header — DS Blue */}
      <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', padding: '16px 24px', boxShadow: '0 2px 8px rgba(12,54,73,0.2)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
              <span>💡</span>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Industry Thought Leadership</h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontWeight: 600 }}
            >
              History
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            Generate a compelling thought leadership article with data tables and charts from your Industry Reports
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Input Form */}
        {step === 'input' && (
          <div className="bg-[#F3F8FA] border border-[#CCDFEA] rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-[#6B7280] text-xs uppercase tracking-wider mb-2">
                Select Industry Report
              </label>
              {historyEntries.length === 0 ? (
                <p className="text-[#6B7280] text-sm italic">
                  No Industry Reports found. Generate one first from Industry Report module.
                </p>
              ) : (
                <select
                  value={selectedEntryId}
                  onChange={(e) => setSelectedEntryId(e.target.value)}
                  className="w-full bg-white border border-[#CCDFEA] rounded-lg px-4 py-2.5 text-[#1B2A3D] text-sm focus:outline-none focus:border-[#E63946]"
                >
                  <option value="">— Choose a report —</option>
                  {historyEntries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.targetCompany} — {formatDate(e.completedAt)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <RadioGroup<Tone>
              label="Tone"
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'smart_casual', label: 'Smart Casual' },
              ]}
              value={tone}
              onChange={setTone}
            />

            <RadioGroup<Perspective>
              label="Perspective"
              options={[
                { value: 'practitioner', label: 'Practitioner' },
                { value: 'analyst', label: 'Analyst' },
              ]}
              value={perspective}
              onChange={setPerspective}
            />

            <RadioGroup<WordCount>
              label="Word Count"
              options={[
                { value: 1000, label: '1,000 words' },
                { value: 1500, label: '1,500 words' },
                { value: 2500, label: '2,500 words' },
              ]}
              value={wordCount}
              onChange={setWordCount}
            />

            {error && (
              <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg px-4 py-3 text-[#E63946] text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#3491E8] hover:bg-[#2a7dd4] text-white"
            >
              Generate Article →
            </button>
          </div>
        )}

        {/* Generating state */}
        {step === 'generating' && (
          <div className="bg-[#F3F8FA] border border-[#CCDFEA] rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">💡</div>
            <h2 className="text-lg font-semibold mb-2">Crafting your thought leadership article…</h2>
            <p className="text-[#6B7280] text-sm mb-6">
              {job?.currentStep || 'Generating content with AI'}
            </p>
            <div className="w-full bg-white rounded-full h-2 mb-4">
              <div
                className="bg-[#3491E8] h-2 rounded-full transition-all duration-500"
                style={{ width: `${job?.progress ?? 10}%` }}
              />
            </div>
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
            <KillSwitchButton onCancel={handleReset} />
          </div>
        )}

        {/* Results */}
        {step === 'results' && displayContent && (
          <div className="space-y-6">
            {/* Article */}
            <div className="bg-[#F3F8FA] border border-[#CCDFEA] rounded-xl p-6">
              {displayContent.title && (
                <h2 className="text-2xl font-bold text-[#1B2A3D] mb-6 leading-tight">{displayContent.title}</h2>
              )}
              {displayContent.content && <MarkdownContent content={displayContent.content} />}
            </div>

            {/* Charts — only available from freshly generated jobs */}
            {job?.charts && job.charts.length > 0 && (
              <div>
                <p className="text-[#6B7280] text-xs uppercase tracking-wider mb-3">Data Visualisations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.charts.map((chart, idx) => (
                    <ContentChartView key={idx} chart={chart} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#CCDFEA] text-[#6B7280] hover:border-[#E63946] hover:text-[#1B2A3D] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#3491E8] hover:bg-[#2a7dd4] text-white transition-colors"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}

        {job?.status === 'error' && (
          <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-6 text-center">
            <p className="text-[#E63946] mb-4">{job.error || 'Generation failed'}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[#3491E8] text-white"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
