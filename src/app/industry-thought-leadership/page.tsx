'use client';

import { useState, useEffect } from 'react';
import { useJobManager } from '@/lib/useJobManager';
import { ContentGenerationResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import { loadHistory, saveToHistory, type HistoryEntry } from '@/lib/history';

type Voice = 'first_person' | 'third_person';
type Tone = 'professional' | 'smart_casual';
type Perspective = 'practitioner' | 'analyst';
type WordCount = 500 | 750 | 1000;

const STYLE_BTN =
  'px-4 py-2 rounded text-sm font-medium border transition-colors cursor-pointer';
const STYLE_ACTIVE =
  'bg-[#3491E8] border-[#3491E8] text-white';
const STYLE_INACTIVE =
  'border-[#0c3649] text-[#7eaabf] hover:border-[#3491E8] hover:text-[#E8EDF5]';

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
      <p className="text-[#7eaabf] text-xs uppercase tracking-wider mb-2">{label}</p>
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

export default function IndustryThoughtLeadershipPage() {
  const [step, setStep] = useState<'input' | 'generating' | 'results'>('input');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [voice, setVoice] = useState<Voice | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [perspective, setPerspective] = useState<Perspective | null>(null);
  const [wordCount, setWordCount] = useState<WordCount | null>(null);
  const [copied, setCopied] = useState(false);

  const { job, error, startJob, reset } = useJobManager<ContentGenerationResult>();

  useEffect(() => {
    const entries = loadHistory().filter((e) => e.moduleType === 'industry-report');
    setHistoryEntries(entries);
  }, []);

  useEffect(() => {
    if (job?.status === 'complete') setStep('results');
    else if (job?.status === 'generating') setStep('generating');
  }, [job?.status]);

  const selectedEntry = historyEntries.find((e) => e.id === selectedEntryId);

  const canGenerate =
    !!selectedEntry && !!voice && !!tone && !!perspective && !!wordCount;

  const handleGenerate = () => {
    if (!selectedEntry || !voice || !tone || !perspective || !wordCount) return;

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
    });
  };

  const handleCopy = () => {
    if (!job?.content) return;
    const text = `${job.title ? job.title + '\n\n' : ''}${job.content}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    reset();
    setStep('input');
    setCopied(false);
  };

  // Save to history when complete
  useEffect(() => {
    if (job?.status === 'complete' && selectedEntry && job.content) {
      saveToHistory({
        moduleType: 'industry-thought-leadership',
        targetCompany: selectedEntry.targetCompany,
        completedAt: job.completedAt || new Date().toISOString(),
        thoughtLeadershipTitle: job.title,
        thoughtLeadershipContent: job.content,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#080f16] text-[#E8EDF5]">
      {/* Header */}
      <div className="border-b border-[#0c3649] px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">💡</span>
            <h1 className="text-xl font-semibold text-[#E8EDF5]">Industry Thought Leadership</h1>
          </div>
          <p className="text-[#7eaabf] text-sm">
            Generate a compelling thought leadership article from your saved Industry Reports
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Input Form */}
        {step === 'input' && (
          <div className="bg-[#0c3649]/40 border border-[#0c3649] rounded-xl p-6 space-y-6">
            {/* Report selector */}
            <div>
              <label className="block text-[#7eaabf] text-xs uppercase tracking-wider mb-2">
                Select Industry Report
              </label>
              {historyEntries.length === 0 ? (
                <p className="text-[#7eaabf] text-sm italic">
                  No Industry Reports found. Generate one first.
                </p>
              ) : (
                <select
                  value={selectedEntryId}
                  onChange={(e) => setSelectedEntryId(e.target.value)}
                  className="w-full bg-[#080f16] border border-[#0c3649] rounded-lg px-4 py-2.5 text-[#E8EDF5] text-sm focus:outline-none focus:border-[#3491E8]"
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

            {/* Style options */}
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
                { value: 500, label: '500 words' },
                { value: 750, label: '750 words' },
                { value: 1000, label: '1000 words' },
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
          <div className="bg-[#0c3649]/40 border border-[#0c3649] rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">💡</div>
            <h2 className="text-lg font-semibold mb-2">Crafting your thought leadership article…</h2>
            <p className="text-[#7eaabf] text-sm mb-6">
              {job?.currentStep || 'Generating content with AI'}
            </p>
            <div className="w-full bg-[#080f16] rounded-full h-2">
              <div
                className="bg-[#3491E8] h-2 rounded-full transition-all duration-500"
                style={{ width: `${job?.progress ?? 10}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && job?.status === 'complete' && (
          <div className="space-y-4">
            <div className="bg-[#0c3649]/40 border border-[#0c3649] rounded-xl p-6">
              {job.title && (
                <h2 className="text-xl font-bold text-[#E8EDF5] mb-4">{job.title}</h2>
              )}

              <div className="text-[#E8EDF5] text-sm leading-7 whitespace-pre-wrap">
                {job.content}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#0c3649] text-[#7eaabf] hover:border-[#3491E8] hover:text-[#E8EDF5] transition-colors"
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

        {/* Error state */}
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
