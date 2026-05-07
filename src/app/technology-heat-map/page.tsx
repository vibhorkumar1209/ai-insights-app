'use client';

import { useState, useEffect } from 'react';
import { useJobManager } from '@/lib/useJobManager';
import { HeatMapInput, CompetitorOption, TechOption, TechnologyHeatMapResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';

// Type alias for convenience
type TechnologyHeatMapJob = TechnologyHeatMapResult;

export default function TechnologyHeatMapPage() {
  const [state, setState] = useState<'input' | 'analysing' | 'results'>('input');
  const [mode, setMode] = useState<'competition' | 'industry'>('competition'); // Mutual exclusivity
  const [industry, setIndustry] = useState('');
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<CompetitorOption[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());
  const [manualCompetitors, setManualCompetitors] = useState<string>('');
  const [discoveredTechs, setDiscoveredTechs] = useState<TechOption[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(new Set());
  const [manualTechs, setManualTechs] = useState<string>('');
  const [discoveredSegments, setDiscoveredSegments] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());
  const [manualSegments, setManualSegments] = useState<string>('');
  const [discoveringData, setDiscoveringData] = useState(false);

  const { job: analysisJob, error, isLoading, startJob, reset } = useJobManager<TechnologyHeatMapJob>();

  const handleIndustrySearch = async () => {
    if (!industry.trim()) return;
    setDiscoveringData(true);
    try {
      console.log('[Discovery] Starting discovery for industry:', industry);
      console.log('[Discovery] API endpoint:', API_ENDPOINTS.technologyHeatMap);

      const [compRes, techRes, segRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.technologyHeatMap}/discover-competitors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry }),
        }),
        fetch(`${API_ENDPOINTS.technologyHeatMap}/discover-technologies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry }),
        }),
        fetch(`${API_ENDPOINTS.technologyHeatMap}/discover-segments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry }),
        }),
      ]);

      console.log('[Discovery] Response statuses:', {
        competitors: compRes.status,
        technologies: techRes.status,
        segments: segRes.status,
      });

      if (!compRes.ok) {
        const errText = await compRes.text();
        console.error('[Discovery] Competitors error body:', errText);
        throw new Error(`Competitors API failed: ${compRes.status}`);
      }
      if (!techRes.ok) {
        const errText = await techRes.text();
        console.error('[Discovery] Technologies error body:', errText);
        throw new Error(`Technologies API failed: ${techRes.status}`);
      }
      if (!segRes.ok) {
        const errText = await segRes.text();
        console.error('[Discovery] Segments error body:', errText);
        throw new Error(`Segments API failed: ${segRes.status}`);
      }

      const competitors = await compRes.json();
      const techs = await techRes.json();
      const segments = await segRes.json();

      console.log('[Discovery] Competitors received:', competitors.competitors?.length || 0);
      console.log('[Discovery] Technologies received:', techs.technologies?.length || 0);
      console.log('[Discovery] Segments received:', segments.segments?.length || 0);

      setDiscoveredCompetitors(competitors.competitors || []);
      setDiscoveredTechs(techs.technologies || []);
      setDiscoveredSegments(segments.segments || []);
    } catch (err) {
      console.error('[Discovery] Error discovering data:', err);
      alert(`Discovery error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDiscoveringData(false);
    }
  };

  const toggleCompetitor = (name: string) => {
    const newSet = new Set(selectedCompetitors);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else if (newSet.size < 10) {
      newSet.add(name);
    }
    setSelectedCompetitors(newSet);
  };

  const toggleTech = (name: string) => {
    const newSet = new Set(selectedTechs);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else if (newSet.size < 10) {
      newSet.add(name);
    }
    setSelectedTechs(newSet);
  };

  const toggleSegment = (name: string) => {
    const newSet = new Set(selectedSegments);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else if (newSet.size < 10) {
      newSet.add(name);
    }
    setSelectedSegments(newSet);
  };

  const handleAnalyze = async () => {
    const manualTechArray = manualTechs
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const manualSegArray = manualSegments
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const manualCompArray = manualCompetitors
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const input: HeatMapInput = {
      industry: industry.trim(),
      selectedCompetitors: mode === 'competition' ? Array.from(selectedCompetitors) : [],
      manualCompetitors: mode === 'competition' ? manualCompArray : [],
      selectedTechs: Array.from(selectedTechs),
      manualTechs: manualTechArray,
      industrySegments: mode === 'industry' ? Array.from(selectedSegments) : [],
      manualSegments: mode === 'industry' ? manualSegArray : [],
    };

    setState('analysing');
    await startJob({
      payload: input,
      endpoint: API_ENDPOINTS.technologyHeatMap,
      streamUrlFactory: (jobId) => `${API_ENDPOINTS.technologyHeatMap}/${jobId}/stream`,
    });
  };

  const handleReset = () => {
    reset();
    setState('input');
    setIndustry('');
    setSelectedCompetitors(new Set());
    setSelectedTechs(new Set());
    setSelectedSegments(new Set());
    setManualCompetitors('');
    setManualTechs('');
    setManualSegments('');
    setMode('competition');
  };

  // Render based on state
  if (state === 'analysing' && isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#E8EDF5', marginBottom: 24 }}>Building Technology Heat Map...</h1>
        <p style={{ color: '#7eaabf', marginBottom: 32 }}>
          Researching technology adoption across competitors and industry segments...
        </p>
        <div
          style={{
            background: '#0f2535',
            border: '1px solid #1e4a68',
            borderRadius: 8,
            padding: '24px',
            maxWidth: 500,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              background: '#132d40',
              borderRadius: 4,
              height: 12,
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, #E63946, #059669)',
                height: '100%',
                width: `${analysisJob?.progress || 0}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ color: '#7eaabf', fontSize: 12 }}>{analysisJob?.progress || 0}% complete</p>
        </div>
      </div>
    );
  }

  if (state === 'results' && analysisJob?.status === 'complete') {
    return (
      <HeatMapResults
        job={analysisJob}
        onReset={handleReset}
      />
    );
  }

  // Input State
  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ color: '#E8EDF5', marginBottom: 32, fontSize: 28, fontWeight: 800 }}>
        Technology Heat Map Analysis
      </h1>

      {error && (
        <div
          style={{
            background: 'rgba(230,57,70,0.1)',
            border: '1px solid #E63946',
            color: '#FF9299',
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {/* Mode Selector */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 32,
          borderBottom: '1px solid #1e4a68',
          paddingBottom: 16,
        }}
      >
        <button
          onClick={() => {
            setMode('competition');
            setSelectedSegments(new Set());
          }}
          style={{
            background: mode === 'competition' ? 'rgba(52,145,232,0.2)' : 'transparent',
            border: mode === 'competition' ? '1px solid #3491E8' : '1px solid #1e4a68',
            color: mode === 'competition' ? '#3491E8' : '#7eaabf',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📊 Competition X Emerging Tech
        </button>
        <button
          onClick={() => {
            setMode('industry');
            setSelectedCompetitors(new Set());
          }}
          style={{
            background: mode === 'industry' ? 'rgba(139,92,246,0.2)' : 'transparent',
            border: mode === 'industry' ? '1px solid #8B5CF6' : '1px solid #1e4a68',
            color: mode === 'industry' ? '#8B5CF6' : '#7eaabf',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🏭 Industry X Emerging Tech
        </button>
      </div>

      {/* Competition Mode */}
      {mode === 'competition' && (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          marginBottom: 32,
        }}
      >
        {/* Left Column: Competitors & Industry */}
        <div
          style={{
            background: 'linear-gradient(160deg, #132d40, #0f2535)',
            border: '1px solid #1e4a68',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ color: '#3491E8', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            COMPETITION X EMERGING TECH
          </h2>

          {/* Industry Input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8 }}>
              Industry
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Banking, Technology, Automotive"
                style={{
                  flex: 1,
                  background: '#0f2535',
                  border: '1px solid #1e4a68',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#E8EDF5',
                  fontSize: 13,
                }}
              />
              <button
                onClick={handleIndustrySearch}
                disabled={discoveringData || !industry.trim()}
                style={{
                  background: discoveringData ? '#1e4a68' : '#3491E8',
                  border: 'none',
                  color: '#E8EDF5',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: discoveringData ? 'wait' : 'pointer',
                  opacity: !industry.trim() ? 0.5 : 1,
                }}
              >
                {discoveringData ? 'Discovering...' : 'Discover'}
              </button>
            </div>
          </div>

          {/* Competitors */}
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #1e4a68' }}>
            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8, fontWeight: 600 }}>
              🏢 KEY PLAYERS / COMPETITORS (Select up to 10)
            </label>

            <div style={{ fontSize: 11, color: '#7eaabf', marginBottom: 8 }}>
              Found: {discoveredCompetitors.length} competitors
            </div>

            {discoveredCompetitors.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, background: '#0f2535', padding: 12, borderRadius: 8 }}>
                  {discoveredCompetitors.map((comp) => (
                    <label
                      key={comp.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: selectedCompetitors.size >= 10 && !selectedCompetitors.has(comp.name) ? 'not-allowed' : 'pointer',
                        opacity: selectedCompetitors.size >= 10 && !selectedCompetitors.has(comp.name) ? 0.5 : 1,
                        padding: '6px 0',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCompetitors.has(comp.name)}
                        onChange={() => toggleCompetitor(comp.name)}
                        disabled={selectedCompetitors.size >= 10 && !selectedCompetitors.has(comp.name)}
                      />
                      <div>
                        <div style={{ fontSize: 12, color: '#E8EDF5', fontWeight: 500 }}>{comp.name}</div>
                        <div style={{ fontSize: 10, color: '#7eaabf' }}>{comp.headquarters} • {comp.estimatedRevenue}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ marginBottom: 12, color: '#7eaabf', fontSize: 11, fontWeight: 600 }}>
                  Selected: {selectedCompetitors.size}/10
                </div>
              </div>
            ) : (
              <div style={{ background: '#0f2535', padding: 12, borderRadius: 8, marginBottom: 12, color: '#7eaabf', fontSize: 12, textAlign: 'center' }}>
                ✨ Click "Discover" to populate key players
              </div>
            )}

            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8, marginTop: 12, fontWeight: 600 }}>
              ➕ Add Custom Companies
            </label>
            <textarea
              value={manualCompetitors}
              onChange={(e) => setManualCompetitors(e.target.value)}
              placeholder="Company name or domain (one per line)&#10;Example:&#10;Tesla&#10;apple.com&#10;Microsoft Corporation"
              style={{
                width: '100%',
                background: '#0f2535',
                border: '1px solid #1e4a68',
                borderRadius: 8,
                padding: 10,
                color: '#E8EDF5',
                fontSize: 12,
                minHeight: 100,
                fontFamily: 'monospace',
              }}
            />
          </div>

          {/* Technologies - Grouped by Category */}
          <div>
            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8, fontWeight: 600 }}>
              ⚡ TECHNOLOGY CATEGORIES (Select up to 10)
            </label>

            <div style={{ fontSize: 11, color: '#7eaabf', marginBottom: 12 }}>
              Found: {discoveredTechs.length} technologies across {new Set(discoveredTechs.map((t) => t.category)).size} categories
            </div>

            {discoveredTechs.length > 0 ? (
              <div style={{ background: '#0f2535', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                {Array.from(
                  discoveredTechs.reduce((acc, tech) => {
                    const cat = tech.category;
                    if (!acc.has(cat)) acc.set(cat, []);
                    acc.get(cat)!.push(tech);
                    return acc;
                  }, new Map<string, typeof discoveredTechs>())
                ).map(([category, techs]) => (
                  <div key={category} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #1e4a68' }}>
                    <div style={{ color: '#3491E8', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📌 {category}
                    </div>
                    <div style={{ marginLeft: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {techs.map((tech) => (
                        <label
                          key={tech.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: selectedTechs.size >= 10 && !selectedTechs.has(tech.name) ? 'not-allowed' : 'pointer',
                            opacity: selectedTechs.size >= 10 && !selectedTechs.has(tech.name) ? 0.5 : 1,
                            padding: '4px 8px',
                            background: selectedTechs.has(tech.name) ? 'rgba(52,145,232,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 4,
                            border: selectedTechs.has(tech.name) ? '1px solid #3491E8' : '1px solid #1e4a68',
                            fontSize: 11,
                            color: '#C4D4DE',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTechs.has(tech.name)}
                            onChange={() => toggleTech(tech.name)}
                            disabled={selectedTechs.size >= 10 && !selectedTechs.has(tech.name)}
                            style={{ cursor: 'pointer' }}
                          />
                          {tech.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#0f2535', padding: 12, borderRadius: 8, marginBottom: 12, color: '#7eaabf', fontSize: 12, textAlign: 'center' }}>
                ✨ Click "Discover" to populate technologies
              </div>
            )}

            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8, marginTop: 12, fontWeight: 600 }}>
              ➕ Add Custom Technologies
            </label>
            <textarea
              value={manualTechs}
              onChange={(e) => setManualTechs(e.target.value)}
              placeholder="Technology name (one per line)&#10;Example:&#10;Quantum Computing&#10;Advanced AI&#10;Edge Computing"
              style={{
                width: '100%',
                background: '#0f2535',
                border: '1px solid #1e4a68',
                borderRadius: 8,
                padding: 10,
                color: '#E8EDF5',
                fontSize: 12,
                minHeight: 100,
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </div>
      )}

      {/* Industry Mode */}
      {mode === 'industry' && (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          marginBottom: 32,
        }}
      >
        {/* Industry Segments */}
        <div
          style={{
            background: 'linear-gradient(160deg, #132d40, #0f2535)',
            border: '1px solid #1e4a68',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ color: '#8B5CF6', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            INDUSTRY SEGMENTS (Select up to 10)
          </h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8 }}>
              Discovered Segments
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginBottom: 16 }}>
              {discoveredSegments.map((seg) => (
                <label
                  key={seg}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: selectedSegments.size >= 10 && !selectedSegments.has(seg) ? 'not-allowed' : 'pointer',
                    opacity: selectedSegments.size >= 10 && !selectedSegments.has(seg) ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSegments.has(seg)}
                    onChange={() => toggleSegment(seg)}
                    disabled={selectedSegments.size >= 10 && !selectedSegments.has(seg)}
                  />
                  <span style={{ fontSize: 12, color: '#C4D4DE' }}>{seg}</span>
                </label>
              ))}
            </div>
            <div style={{ marginBottom: 12, color: '#7eaabf', fontSize: 11 }}>
              Selected: {selectedSegments.size}/10
            </div>
          </div>

          <div>
            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8 }}>
              Add Custom Segments
            </label>
            <textarea
              value={manualSegments}
              onChange={(e) => setManualSegments(e.target.value)}
              placeholder="Add custom segments (one per line)"
              style={{
                width: '100%',
                background: '#0f2535',
                border: '1px solid #1e4a68',
                borderRadius: 8,
                padding: 10,
                color: '#E8EDF5',
                fontSize: 12,
                minHeight: 100,
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* Emerging Technologies for Industry Mode */}
        <div
          style={{
            background: 'linear-gradient(160deg, #132d40, #0f2535)',
            border: '1px solid #1e4a68',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ color: '#8B5CF6', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            EMERGING TECHNOLOGIES (Select up to 10)
          </h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8 }}>
              Discovered Technologies
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {discoveredTechs.map((tech) => (
                <label
                  key={tech.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: selectedTechs.size >= 10 && !selectedTechs.has(tech.name) ? 'not-allowed' : 'pointer',
                    opacity: selectedTechs.size >= 10 && !selectedTechs.has(tech.name) ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTechs.has(tech.name)}
                    onChange={() => toggleTech(tech.name)}
                    disabled={selectedTechs.size >= 10 && !selectedTechs.has(tech.name)}
                  />
                  <span style={{ fontSize: 11, color: '#C4D4DE' }}>{tech.name}</span>
                </label>
              ))}
            </div>
            <div style={{ marginBottom: 12, color: '#7eaabf', fontSize: 11 }}>
              Selected: {selectedTechs.size}/10
            </div>
          </div>

          <div>
            <label style={{ color: '#7eaabf', fontSize: 12, display: 'block', marginBottom: 8 }}>
              Add Custom Technologies
            </label>
            <textarea
              value={manualTechs}
              onChange={(e) => setManualTechs(e.target.value)}
              placeholder="Add custom technologies (one per line)"
              style={{
                width: '100%',
                background: '#0f2535',
                border: '1px solid #1e4a68',
                borderRadius: 8,
                padding: 10,
                color: '#E8EDF5',
                fontSize: 12,
                minHeight: 100,
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button
          onClick={handleAnalyze}
          disabled={
            !industry.trim() ||
            selectedTechs.size === 0 ||
            (mode === 'competition' ? selectedCompetitors.size === 0 : selectedSegments.size === 0)
          }
          style={{
            background: (!industry.trim() || selectedTechs.size === 0 || (mode === 'competition' ? selectedCompetitors.size === 0 : selectedSegments.size === 0)) ? '#1e4a68' : '#3491E8',
            border: 'none',
            color: '#E8EDF5',
            padding: '12px 32px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: (!industry.trim() || selectedTechs.size === 0 || (mode === 'competition' ? selectedCompetitors.size === 0 : selectedSegments.size === 0)) ? 0.5 : 1,
          }}
        >
          Analyze Heat Map
        </button>
      </div>
    </div>
  );
}

function HeatMapResults({ job, onReset }: { job: TechnologyHeatMapJob; onReset: () => void }) {
  if (!job.competitionHeatMap || !job.industryHeatMap) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#7eaabf' }}>No heat map data available</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ color: '#E8EDF5', fontSize: 28, fontWeight: 800 }}>
          Technology Adoption Heat Map — {job.industry}
        </h1>
        <button
          onClick={onReset}
          style={{
            background: 'rgba(52,145,232,0.1)',
            border: '1px solid #3491E8',
            color: '#3491E8',
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← New Analysis
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
        <HeatMapGrid title="Competition X Emerging Tech" data={job.competitionHeatMap} />
        <HeatMapGrid title="Industry X Emerging Tech" data={job.industryHeatMap} />
      </div>

      {job.insights && (
        <div
          style={{
            background: 'linear-gradient(160deg, #132d40, #0f2535)',
            border: '1px solid #1e4a68',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ color: '#3491E8', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            KEY INSIGHTS
          </h2>
          {job.insights.leaderCompetitors && (
            <p style={{ color: '#C4D4DE', marginBottom: 12, lineHeight: 1.6 }}>
              <strong style={{ color: '#E8EDF5' }}>Leader competitors:</strong> {job.insights.leaderCompetitors.join(', ')}
            </p>
          )}
          {job.insights.emergingTechs && (
            <p style={{ color: '#C4D4DE', marginBottom: 12, lineHeight: 1.6 }}>
              <strong style={{ color: '#E8EDF5' }}>Emerging technologies:</strong> {job.insights.emergingTechs.join(', ')}
            </p>
          )}
          {job.insights.competitiveGaps && (
            <p style={{ color: '#C4D4DE', marginBottom: 12, lineHeight: 1.6 }}>
              <strong style={{ color: '#E8EDF5' }}>Competitive gaps:</strong> {job.insights.competitiveGaps.join('; ')}
            </p>
          )}
          {job.insights.strategicRecommendations && (
            <div style={{ marginTop: 16 }}>
              <strong style={{ color: '#E8EDF5', display: 'block', marginBottom: 8 }}>Strategic recommendations:</strong>
              <ul style={{ color: '#C4D4DE', paddingLeft: 20, margin: 0 }}>
                {job.insights.strategicRecommendations.map((rec, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HeatMapGrid({ title, data }: { title: string; data: any[][] }) {
  if (data.length === 0) return null;

  const getColor = (stage: number) => {
    const colors = [
      'rgba(220, 228, 236, 0.3)',      // Stage 1 - White/light gray
      'rgba(52, 145, 232, 0.4)',       // Stage 2 - Light blue
      'rgba(52, 145, 232, 0.6)',       // Stage 3 - Medium blue
      'rgba(52, 145, 232, 0.85)',      // Stage 4 - Dark blue
      'rgba(230, 57, 70, 0.85)',       // Stage 5 - Red
    ];
    return colors[Math.max(0, Math.min(4, stage - 1))] || colors[0];
  };

  const rows = data.map((row) => row[0]?.competitor_or_segment || row[0]?.segment).filter(Boolean);
  const cols = data[0]?.map((cell) => cell.technology) || [];

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #132d40, #0f2535)',
        border: '1px solid #1e4a68',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <h3 style={{ color: '#3491E8', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{title}</h3>

      <div style={{ overflowX: 'auto', fontSize: 11 }}>
        <table
          style={{
            borderCollapse: 'collapse',
            minWidth: '100%',
            color: '#C4D4DE',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #1e4a68',
                  color: '#7eaabf',
                  fontWeight: 600,
                }}
              ></th>
              {cols.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '8px 6px',
                    textAlign: 'center',
                    borderBottom: '1px solid #1e4a68',
                    color: '#7eaabf',
                    fontWeight: 600,
                    fontSize: 10,
                    maxWidth: 60,
                    wordBreak: 'break-word',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #0f2535',
                    borderRight: '1px solid #1e4a68',
                    maxWidth: 100,
                    wordBreak: 'break-word',
                    fontSize: 10,
                    color: '#E8EDF5',
                  }}
                >
                  {row[0]?.competitor_or_segment || row[0]?.segment}
                </td>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: '6px',
                      borderBottom: '1px solid #0f2535',
                      borderRight: '1px solid #0f2535',
                      textAlign: 'center',
                      background: getColor(cell.adoptionStage),
                      cursor: 'pointer',
                      fontSize: 9,
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E8EDF5',
                    }}
                    title={`${cell.technology}: ${cell.adoptionPercentage}%`}
                  >
                    {cell.adoptionPercentage}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: 'rgba(220, 228, 236, 0.3)', borderRadius: 2 }} />
          <span style={{ color: '#7eaabf' }}>Stage 1 (&lt;10%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: 'rgba(52, 145, 232, 0.4)', borderRadius: 2 }} />
          <span style={{ color: '#7eaabf' }}>Stage 2 (10-30%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: 'rgba(52, 145, 232, 0.6)', borderRadius: 2 }} />
          <span style={{ color: '#7eaabf' }}>Stage 3 (30-60%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: 'rgba(52, 145, 232, 0.85)', borderRadius: 2 }} />
          <span style={{ color: '#7eaabf' }}>Stage 4 (60-85%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: 'rgba(230, 57, 70, 0.85)', borderRadius: 2 }} />
          <span style={{ color: '#7eaabf' }}>Stage 5 (85%+)</span>
        </div>
      </div>
    </div>
  );
}
