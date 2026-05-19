'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

import { useState, useEffect, useRef } from 'react';
import { useJobManager } from '@/lib/useJobManager';
import { TechHeatMapResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import { saveToHistory, loadEntryById, popPendingRestore } from '@/lib/history';

type TechHeatMapJob = TechHeatMapResult;

const GEOGRAPHIES = [
  'Global',
  'North America',
  'LATAM',
  'Europe',
  'Middle East & Africa',
  'Asia',
  'Specific Country',
];

const INVESTMENT_COLORS: Record<string, string> = {
  very_high: '#1a7a1a',
  high: '#5ab95a',
  medium: '#f0b429',
};

export default function TechnologyHeatMapPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [industry, setIndustry] = useState('');
  const [geography, setGeography] = useState('');
  const [specificCountry, setSpecificCountry] = useState('');
  const [discoveredTechs, setDiscoveredTechs] = useState<Array<{ name: string; category: string }>>([]);
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(new Set());
  const [customTechInput, setCustomTechInput] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [displayedJob, setDisplayedJob] = useState<TechHeatMapJob | null>(null);

  const { job, error, isStuck, retryJob, startJob, cancelJob, reset } = useJobManager<TechHeatMapJob>();

  useEffect(() => {
    if (job?.status === 'complete') { setDisplayedJob(job); setStep('results'); }
    else if (job?.status === 'researching' || job?.status === 'synthesizing') setStep('analysing');
  }, [job?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'technology-heat-map' && entry.techHeatMapRows) {
        setIndustry(entry.targetCompany || '');
        setDisplayedJob({
          status: 'complete',
          rows: entry.techHeatMapRows,
          headline: entry.techHeatMapHeadline,
          geography: entry.techHeatMapGeography || '',
          industry: entry.targetCompany || '',
        } as TechHeatMapJob);
        setStep('results');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (job?.status === 'complete' && job.rows) {
      saveToHistory({
        moduleType: 'technology-heat-map',
        targetCompany: job.industry || 'Unknown',
        completedAt: job.completedAt || new Date().toISOString(),
        techHeatMapRows: job.rows,
        techHeatMapHeadline: job.headline,
        techHeatMapGeography: job.geography,
      });
    }
  }, [job?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDiscover = async () => {
    if (!industry.trim()) return;
    setDiscovering(true);
    setDiscoverError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.technologyHeatMap}/discover-technologies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: industry.trim() }),
      });
      const data = await res.json();
      const techs: Array<{ name: string; category: string }> = data.technologies || [];
      setDiscoveredTechs(techs);
      // auto-select all discovered
      setSelectedTechs(new Set(techs.map((t) => t.name)));
    } catch {
      setDiscoverError('Failed to discover technologies. You can add them manually below.');
    } finally {
      setDiscovering(false);
    }
  };

  const toggleTech = (name: string) => {
    setSelectedTechs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addCustomTech = () => {
    const val = customTechInput.trim();
    if (!val) return;
    setDiscoveredTechs((prev) => {
      if (prev.find((t) => t.name.toLowerCase() === val.toLowerCase())) return prev;
      return [...prev, { name: val, category: 'Custom' }];
    });
    setSelectedTechs((prev) => new Set(Array.from(prev).concat(val)));
    setCustomTechInput('');
  };

  const handleSubmit = async () => {
    const finalGeo = geography === 'Specific Country' ? specificCountry.trim() : geography;
    const technologies = Array.from(selectedTechs);
    if (!industry.trim() || !finalGeo || technologies.length === 0) return;

    await startJob({
      endpoint: API_ENDPOINTS.technologyHeatMap,
      streamUrlFactory: (id) => `${API_ENDPOINTS.technologyHeatMap}/${id}/stream`,
      payload: {
        industry: industry.trim(),
        geography: finalGeo,
        technologies,
      },
      persist: { moduleType: 'technology-heat-map', targetCompany: industry.trim() },
    });
    setStep('analysing');
  };

  const handleReset = () => {
    reset();
    setStep('input');
  };

  const finalGeo = geography === 'Specific Country' ? specificCountry.trim() : geography;
  const canSubmit =
    industry.trim() &&
    finalGeo &&
    selectedTechs.size > 0 &&
    selectedTechs.size <= 12;

  // ── RESULTS VIEW ────────────────────────────────────────────────────────────
  if (step === 'results' && displayedJob) {
    const rows = displayedJob.rows || [];
    return (
      <div style={{ minHeight: '100vh', background: '#080f16', padding: '2rem' }}>
        {/* Reset button */}
        <button
          onClick={handleReset}
          style={{
            marginBottom: '1.5rem',
            background: 'transparent',
            border: '1px solid #3491E8',
            color: '#3491E8',
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          ← New Heat Map
        </button>

        {/* Results card — white background professional look */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem 2.5rem',
            maxWidth: '900px',
            margin: '0 auto',
            boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Title */}
          <h2
            style={{
              margin: '0 0 0.3rem',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0c3649',
              letterSpacing: '-0.5px',
            }}
          >
            Technology Investment Heat Map
          </h2>

          {/* Subtitle */}
          {displayedJob.headline && (
            <p
              style={{
                margin: '0 0 1.5rem',
                fontSize: '0.95rem',
                fontStyle: 'italic',
                color: '#e87c1a',
                fontWeight: 500,
              }}
            >
              {displayedJob.headline}
            </p>
          )}

          {/* Context line */}
          <p style={{ margin: '0 0 1.2rem', fontSize: '0.8rem', color: '#7eaabf' }}>
            {displayedJob.industry} &mdash; {displayedJob.geography}
          </p>

          {/* Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.88rem',
            }}
          >
            <thead>
              <tr style={{ background: '#0c3649' }}>
                <th
                  style={{
                    padding: '0.7rem 1rem',
                    textAlign: 'left',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '22%',
                  }}
                >
                  Technology
                </th>
                <th
                  style={{
                    padding: '0.7rem 1rem',
                    textAlign: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '12%',
                  }}
                >
                  Investment
                </th>
                <th
                  style={{
                    padding: '0.7rem 1rem',
                    textAlign: 'left',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                    borderBottom: '1px solid #e0e4ea',
                  }}
                >
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      color: '#E63946',
                      fontWeight: 700,
                      verticalAlign: 'middle',
                    }}
                  >
                    {row.technology}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div
                      style={{
                        background: INVESTMENT_COLORS[row.investmentLevel] || '#f0b429',
                        height: '28px',
                        borderRadius: '4px',
                        width: '100%',
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      color: '#1a2a3a',
                      fontStyle: 'italic',
                      fontWeight: 600,
                      lineHeight: 1.5,
                      verticalAlign: 'middle',
                    }}
                  >
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              marginTop: '1.2rem',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {[
              { label: 'VERY HIGH', color: '#1a7a1a' },
              { label: 'HIGH', color: '#5ab95a' },
              { label: 'MEDIUM', color: '#f0b429' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div
                  style={{
                    width: '20px',
                    height: '14px',
                    background: item.color,
                    borderRadius: '3px',
                  }}
                />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5a6a7a', letterSpacing: '0.03em' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING VIEW ─────────────────────────────────────────────────────────────
  if (step === 'analysing') {
    const progress = job?.progress ?? 10;
    const currentStep = job?.currentStep ?? 'Analysing investment landscape...';
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080f16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <p style={{ color: '#7eaabf', fontSize: '0.9rem', margin: 0 }}>{currentStep}</p>
        <div
          style={{
            width: '320px',
            height: '6px',
            background: '#0c3649',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#3491E8',
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <p style={{ color: '#3491E8', fontSize: '0.8rem', margin: 0 }}>{progress}%</p>
        {isStuck && <StuckJobBanner onRetry={retryJob} />}
        <KillSwitchButton onCancel={() => { cancelJob(); setStep('input'); }} />
      </div>
    );
  }

  // ── INPUT FORM ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080f16', padding: '2rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header */}
        <h1
          style={{
            color: '#E8EDF5',
            fontSize: '1.6rem',
            fontWeight: 800,
            margin: '0 0 0.3rem',
            letterSpacing: '-0.5px',
          }}
        >
          Technology Investment Heat Map
        </h1>
        <p style={{ color: '#7eaabf', fontSize: '0.88rem', margin: '0 0 2rem' }}>
          Assess technology investment levels for an industry and geography over the next 6 months.
        </p>

        {/* Industry */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ display: 'block', color: '#7eaabf', fontSize: '0.78rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Industry
          </label>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
              placeholder="e.g. Professional Services, Healthcare, Retail..."
              style={{
                flex: 1,
                background: '#0c3649',
                border: '1px solid #1a4a66',
                borderRadius: '8px',
                color: '#E8EDF5',
                padding: '0.6rem 0.9rem',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleDiscover}
              disabled={!industry.trim() || discovering}
              style={{
                background: discovering ? '#1a4a66' : '#3491E8',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.1rem',
                fontSize: '0.85rem',
                cursor: discovering ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}
            >
              {discovering ? 'Discovering...' : 'Discover Technologies'}
            </button>
          </div>
          {discoverError && (
            <p style={{ color: '#E63946', fontSize: '0.78rem', marginTop: '0.3rem' }}>{discoverError}</p>
          )}
        </div>

        {/* Geography */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ display: 'block', color: '#7eaabf', fontSize: '0.78rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Geography
          </label>
          <select
            value={geography}
            onChange={(e) => setGeography(e.target.value)}
            style={{
              width: '100%',
              background: '#0c3649',
              border: '1px solid #1a4a66',
              borderRadius: '8px',
              color: geography ? '#E8EDF5' : '#7eaabf',
              padding: '0.6rem 0.9rem',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          >
            <option value="" disabled>Select geography...</option>
            {GEOGRAPHIES.map((g) => (
              <option key={g} value={g} style={{ background: '#0c3649', color: '#E8EDF5' }}>
                {g}
              </option>
            ))}
          </select>
          {geography === 'Specific Country' && (
            <input
              type="text"
              value={specificCountry}
              onChange={(e) => setSpecificCountry(e.target.value)}
              placeholder="Enter country name..."
              style={{
                marginTop: '0.5rem',
                width: '100%',
                background: '#0c3649',
                border: '1px solid #1a4a66',
                borderRadius: '8px',
                color: '#E8EDF5',
                padding: '0.6rem 0.9rem',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* Technologies */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#7eaabf', fontSize: '0.78rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Technologies{' '}
            <span style={{ color: '#3491E8', fontWeight: 400, textTransform: 'none' }}>
              ({selectedTechs.size} selected)
            </span>
          </label>

          {discoveredTechs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
              {discoveredTechs.map((t) => {
                const sel = selectedTechs.has(t.name);
                return (
                  <button
                    key={t.name}
                    onClick={() => toggleTech(t.name)}
                    style={{
                      background: sel ? '#3491E8' : '#0c3649',
                      border: `1px solid ${sel ? '#3491E8' : '#1a4a66'}`,
                      color: sel ? '#fff' : '#7eaabf',
                      borderRadius: '20px',
                      padding: '0.3rem 0.8rem',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      fontWeight: sel ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom tech input */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input
              type="text"
              value={customTechInput}
              onChange={(e) => setCustomTechInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomTech()}
              placeholder="Add custom technology..."
              style={{
                flex: 1,
                background: '#0c3649',
                border: '1px solid #1a4a66',
                borderRadius: '8px',
                color: '#E8EDF5',
                padding: '0.5rem 0.8rem',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={addCustomTech}
              disabled={!customTechInput.trim()}
              style={{
                background: '#0c3649',
                border: '1px solid #3491E8',
                color: '#3491E8',
                borderRadius: '8px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.82rem',
                cursor: customTechInput.trim() ? 'pointer' : 'default',
                fontWeight: 600,
              }}
            >
              + Add
            </button>
          </div>

          {selectedTechs.size > 12 && (
            <p style={{ color: '#E63946', fontSize: '0.78rem', marginTop: '0.3rem' }}>
              Maximum 12 technologies. Please deselect some.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#E63946', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            background: canSubmit ? '#3491E8' : '#1a4a66',
            color: canSubmit ? '#fff' : '#7eaabf',
            border: 'none',
            borderRadius: '8px',
            padding: '0.85rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'default',
            letterSpacing: '0.02em',
            transition: 'background 0.2s',
          }}
        >
          Generate Heat Map →
        </button>
      </div>
    </div>
  );
}
