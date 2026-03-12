'use client';

import { BenchmarkJob, BenchmarkDimension, GapAnalysisRow, GapLevel } from '@/lib/types';

interface BenchmarkResultsProps {
  job: BenchmarkJob;
  targetCompany: string;
  userOrganization: string;
  onReset: () => void;
}

const gapColors: Record<GapLevel, { bg: string; text: string; label: string }> = {
  RED: { bg: 'rgba(230,57,70,0.15)', text: '#ff6b75', label: 'Critical Gap' },
  AMBER: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'Partial Gap' },
  GREEN: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', label: 'Strength' },
};

function SectionTitle({ label, subtitle }: { label: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ height: 2, width: 28, background: '#3491E8', borderRadius: 1 }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 2 }}>{label}</div>
      </div>
      {subtitle && <div style={{ fontSize: 13, color: '#7eaabf', marginLeft: 40 }}>{subtitle}</div>}
    </div>
  );
}

function ResearchBrief({ brief }: { brief: string }) {
  return (
    <div style={{
      background: 'rgba(8,15,22,0.6)',
      border: '1px solid #1e4a68',
      borderRadius: 10,
      padding: '20px 24px',
      marginBottom: 28,
    }}>
      <SectionTitle label="RESEARCH BRIEF" subtitle="AI-compiled intelligence summary" />
      <div style={{
        fontSize: 13, color: '#C4D4DE', lineHeight: 1.8,
        whiteSpace: 'pre-line',
      }}>
        {brief}
      </div>
    </div>
  );
}

function BenchmarkTable({ table, targetCompany, peers }: {
  table: BenchmarkDimension[];
  targetCompany: string;
  peers: string[];
}) {
  const columns = [targetCompany, ...peers];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        background: 'rgba(8,15,22,0.6)',
        border: '1px solid #1e4a68',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#0c3649', padding: '12px 0' }}>
          <SectionTitle label="SLIDE 1: PEER BENCHMARKING TABLE" subtitle={`${targetCompany} vs. ${peers.length} peers`} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 180, textAlign: 'left' }}>Dimension</th>
                {columns.map((col, i) => (
                  <th key={col} style={{
                    ...thStyle,
                    background: i === 0
                      ? 'rgba(230,57,70,0.08)'
                      : `rgba(52,145,232,${0.04 + i * 0.02})`,
                    color: i === 0 ? '#ff6b75' : '#6ab8ff',
                  }}>
                    {col}
                    {i === 0 && (
                      <span style={{
                        display: 'block', fontSize: 9, color: '#E63946',
                        fontWeight: 600, letterSpacing: 0.8, marginTop: 2,
                      }}>TARGET</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((row, ri) => (
                <tr key={row.dimension} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(15,37,53,0.3)' }}>
                  <td style={dimensionCellStyle}>{row.dimension}</td>
                  {/* Target company */}
                  <td style={{ ...tdStyle, background: 'rgba(230,57,70,0.05)' }}>
                    <div style={{ fontSize: 12, color: '#E8EDF5', lineHeight: 1.6 }}>
                      {row.targetCompany.value}
                    </div>
                    {row.targetCompany.notes && (
                      <div style={{ fontSize: 11, color: '#7eaabf', marginTop: 4 }}>
                        {row.targetCompany.notes}
                      </div>
                    )}
                  </td>
                  {/* Peers */}
                  {peers.map((peer) => {
                    const d = row.peers[peer];
                    return (
                      <td key={peer} style={tdStyle}>
                        <div style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>
                          {d?.value || 'Not publicly disclosed'}
                        </div>
                        {d?.notes && (
                          <div style={{ fontSize: 11, color: '#7eaabf', marginTop: 4 }}>
                            {d.notes}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GapAnalysisTable({ rows, userOrganization }: {
  rows: GapAnalysisRow[];
  userOrganization: string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(gapColors).map(([level, styles]) => (
          <div key={level} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: styles.bg,
            border: `1px solid ${styles.text}44`,
            borderRadius: 6,
            padding: '4px 10px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: styles.text }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: styles.text }}>{styles.label}</span>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(8,15,22,0.6)',
        border: '1px solid #1e4a68',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <div style={{ background: '#0c3649', padding: '12px 0' }}>
          <SectionTitle
            label="SLIDE 2: GAP ANALYSIS & OPPORTUNITY MAP"
            subtitle={`Gaps mapped to ${userOrganization} solution portfolio`}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['Capability', 'Peers Best Practice', `${userOrganization === '' ? 'Target' : ''} Current State`, 'Gap Level', `${userOrganization} Solution Fit`].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const colors = gapColors[row.gapLevel] || gapColors.AMBER;
                return (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(15,37,53,0.3)' }}>
                    <td style={{ ...dimensionCellStyle, width: 150 }}>{row.capability}</td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>
                        {row.peersBestPractice}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>
                        {row.targetStatus}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, width: 110 }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: colors.bg,
                        border: `1px solid ${colors.text}55`,
                        borderRadius: 6,
                        padding: '4px 10px',
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.text }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: colors.text, whiteSpace: 'nowrap' }}>
                          {colors.label}
                        </span>
                      </div>
                      {row.gapDetail && (
                        <div style={{ fontSize: 11, color: '#7eaabf', marginTop: 6, lineHeight: 1.5 }}>
                          {row.gapDetail}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, background: 'rgba(109,40,217,0.06)', width: 220 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>
                        {row.solutionFit}
                      </div>
                      {row.proofPoint && (
                        <div style={{ fontSize: 11, color: '#7eaabf', lineHeight: 1.5 }}>
                          {row.proofPoint}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function BenchmarkResults({ job, targetCompany, userOrganization, onReset }: BenchmarkResultsProps) {
  const peers = job.selectedPeers || [];

  return (
    <div>
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #0a2233)',
        border: '1px solid #1e4a68',
        borderRadius: 12,
        padding: '16px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 2 }}>
            PEER BENCHMARKING COMPLETE
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#E8EDF5', marginTop: 4 }}>
            {targetCompany} vs. {peers.join(', ')}
          </div>
          <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 2 }}>
            Completed {job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : ''}
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'rgba(52,145,232,0.1)',
            border: '1px solid rgba(52,145,232,0.25)',
            color: '#6ab8ff',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          New Analysis
        </button>
      </div>

      {/* Research brief */}
      {job.researchBrief && <ResearchBrief brief={job.researchBrief} />}

      {/* Benchmarking table */}
      {job.benchmarkingTable && job.benchmarkingTable.length > 0 && (
        <BenchmarkTable table={job.benchmarkingTable} targetCompany={targetCompany} peers={peers} />
      )}

      {/* Gap analysis */}
      {job.gapAnalysis && job.gapAnalysis.length > 0 && (
        <GapAnalysisTable rows={job.gapAnalysis} userOrganization={userOrganization} />
      )}
    </div>
  );
}

// ── Shared cell styles ────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: '#7eaabf',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  borderBottom: '1px solid #1e4a68',
  background: 'rgba(15,37,53,0.8)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 12,
  color: '#C4D4DE',
  borderBottom: '1px solid rgba(30,74,104,0.3)',
  verticalAlign: 'top',
};

const dimensionCellStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: 700,
  color: '#E8EDF5',
  background: 'rgba(12,54,73,0.4)',
  borderRight: '1px solid #1e4a68',
  whiteSpace: 'nowrap',
};
