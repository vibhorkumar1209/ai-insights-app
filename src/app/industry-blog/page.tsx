'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';
import HistoryDrawer from '@/components/shared/HistoryDrawer';

import { useState, useEffect, useRef } from 'react';
import { useJobManager } from '@/lib/useJobManager';
import { ContentGenerationResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, type HistoryEntry } from '@/lib/history';

type Voice = 'first_person' | 'third_person';
type Tone = 'professional' | 'smart_casual';
type Perspective = 'practitioner' | 'analyst';
type WordCount = 200 | 500 | 800;

const STYLE_BTN =
  'px-4 py-2 rounded text-sm font-medium border transition-colors cursor-pointer';
const STYLE_ACTIVE = 'bg-[#3491E8] border-[#3491E8] text-white';
const STYLE_INACTIVE =
  'border-[#CCDFEA] text-[#6B7280] hover:border-[#E63946] hover:text-[#1B2A3D]';

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

interface RestoredResult {
  title?: string;
  content: string;
  hashtags?: string[];
}

export default function IndustryBlogPage() {
  const [step, setStep] = useState<'input' | 'generating' | 'results'>('input');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [voice, setVoice] = useState<Voice | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [perspective, setPerspective] = useState<Perspective | null>(null);
  const [wordCount, setWordCount] = useState<WordCount | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [restoredResult, setRestoredResult] = useState<RestoredResult | null>(null);
  const selectedEntryRef = useRef<HistoryEntry | undefined>(undefined);

  const { job, error, isStuck, retryJob, startJob, cancelJob, reset } =
    useJobManager<ContentGenerationResult>();

  // Load industry-report entries (blog uses report as source) + handle pending restore
  useEffect(() => {
    const entries = loadHistory().filter((e) => e.moduleType === 'industry-report');
    setHistoryEntries(entries);

    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'industry-blog' && entry.blogContent) {
        setRestoredResult({ title: entry.blogTitle, content: entry.blogContent, hashtags: entry.blogHashtags });
        setStep('results');
      }
    }
  }, []);

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType === 'industry-blog' && entry.blogContent) {
      setRestoredResult({ title: entry.blogTitle, content: entry.blogContent, hashtags: entry.blogHashtags });
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
  // Keep a stable ref so the save effect always has the right entry
  useEffect(() => { selectedEntryRef.current = selectedEntry; }, [selectedEntry]);

  const canGenerate = !!selectedEntry && !!voice && !!tone && !!perspective && !!wordCount;

  const handleGenerate = () => {
    if (!selectedEntry || !voice || !tone || !perspective || !wordCount) return;

    const payload = {
      moduleType: 'industry-blog' as const,
      industryReportData: {
        query: selectedEntry.targetCompany,
        executiveSummary: selectedEntry.industryReportExecutiveSummary
          ? [
              selectedEntry.industryReportExecutiveSummary.headline,
              ...(selectedEntry.industryReportExecutiveSummary.paragraphs || []),
            ]
              .filter(Boolean)
              .join(' | ')
          : undefined,
        sections: (selectedEntry.industryReportSections || []).map((s) => ({
          id: s.id,
          title: s.title,
          bodyParagraphs: s.bodyParagraphs,
          keyTable: s.keyTable,
        })),
      },
      voice,
      tone,
      perspective,
      wordCount,
    };

    startJob({
      payload,
      endpoint: API_ENDPOINTS.contentGeneration,
      streamUrlFactory: API_ENDPOINTS.contentGenerationStream,
      persist: { moduleType: 'industry-blog', targetCompany: selectedEntry.targetCompany },
    });
  };

  const displayContent = restoredResult ?? (job?.status === 'complete' ? { title: job.title, content: job.content, hashtags: job.hashtags } : null);

  const handleCopy = () => {
    if (!displayContent?.content) return;
    const text = `${displayContent.title ? displayContent.title + '\n\n' : ''}${displayContent.content}${
      displayContent.hashtags?.length ? '\n\n' + displayContent.hashtags.join(' ') : ''
    }`;
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

  // Save to history when complete — use ref so effect always has stable entry reference
  useEffect(() => {
    if (job?.status === 'complete' && job.content) {
      const entry = selectedEntryRef.current;
      saveToHistory({
        moduleType: 'industry-blog',
        targetCompany: entry?.targetCompany || 'Unknown',
        completedAt: job.completedAt || new Date().toISOString(),
        blogTitle: job.title,
        blogContent: job.content,
        blogHashtags: job.hashtags,
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
          currentModule="industry-blog"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}
      {/* Header — DS Blue */}
      <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', padding: '16px 24px', boxShadow: '0 2px 8px rgba(12,54,73,0.2)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
              <span>✍️</span>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Industry Blog</h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontWeight: 600 }}
            >
              History
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            Generate a blog post from your saved Industry Reports
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
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

            <RadioGroup<Voice>
              label="Voice / Style"
              options={[
                { value: 'first_person', label: 'First Person' },
                { value: 'third_person', label: 'Third Person' },
              ]}
              value={voice}
              onChange={setVoice}
            />

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
                { value: 200, label: '200 words' },
                { value: 500, label: '500 words' },
                { value: 800, label: '800 words' },
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
              Generate Blog →
            </button>
          </div>
        )}

        {/* Generating state */}
        {step === 'generating' && (
          <div className="bg-[#F3F8FA] border border-[#CCDFEA] rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">✍️</div>
            <h2 className="text-lg font-semibold mb-2">Crafting your blog post…</h2>
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
          <div className="space-y-4">
            <div className="bg-[#F3F8FA] border border-[#CCDFEA] rounded-xl p-6">
              {displayContent.title && (
                <h2 className="text-xl font-bold text-[#1B2A3D] mb-4">{displayContent.title}</h2>
              )}
              <div className="text-[#1B2A3D] text-sm leading-7 whitespace-pre-wrap mb-6">
                {displayContent.content}
              </div>
              {displayContent.hashtags && displayContent.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#CCDFEA]">
                  {displayContent.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#3491E8]/15 text-[#3491E8] border border-[#3491E8]/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
