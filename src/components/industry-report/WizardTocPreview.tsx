'use client';
import React from 'react';
import { IndustryReportScope, MarketSegmentOption, KeyPlayerOption } from '@ai-insights/types';

interface SectionDef {
  id: string;
  label: string;
  core: boolean;
}

interface Props {
  scope: IndustryReportScope;
  segments: MarketSegmentOption[];
  players: KeyPlayerOption[];
  selectedSections: string[];
  onUpdateSections: (sections: string[]) => void;
  allSectionDefs: SectionDef[];
  onGenerate: () => void;
  onBack: () => void;
}

const ACCENT = '#3491E8';

export default function WizardTocPreview({
  scope, segments, players,
  selectedSections, onUpdateSections, allSectionDefs,
  onGenerate, onBack,
}: Props) {
  const selectedSegments = segments.filter((s) => s.selected);
  const selectedPlayers = players.filter((p) => p.selected);

  const toggleSection = (id: string) => {
    onUpdateSections(
      selectedSections.includes(id)
        ? selectedSections.filter((s) => s !== id)
        : [...selectedSections, id]
    );
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase' as const, marginBottom: 8 }}>
          Step 4 of 5
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
          Select Report Sections & Review
        </h2>
        <p style={{ fontSize: 13, color: '#6B8FA5', marginTop: 8 }}>
          Choose which sections to include in the report. Unselected sections will not be researched or generated.
        </p>
      </div>

      {/* ── Report Sections Selector ── */}
      <div style={{
        background: 'rgba(14,50,75,0.5)',
        border: '1px solid rgba(52,145,232,0.25)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#6B8FA5', textTransform: 'uppercase' as const }}>
            Report Table of Contents
            <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: 8 }}>
              ({selectedSections.length}/{allSectionDefs.length} sections)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => onUpdateSections(allSectionDefs.map((s) => s.id))}
              style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Select All
            </button>
            <button
              onClick={() => onUpdateSections(allSectionDefs.filter((s) => s.core).map((s) => s.id))}
              style={{ background: 'none', border: 'none', color: '#6B8FA5', fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Core Only
            </button>
          </div>
        </div>

        {/* Executive Summary — always included, not toggleable */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', marginBottom: 6,
          background: 'rgba(52,145,232,0.08)',
          border: '1px solid rgba(52,145,232,0.2)',
          borderRadius: 8,
        }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(52,145,232,0.2)', color: ACCENT, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            1
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#22D3EE', flex: 1 }}>Executive Summary</span>
          <span style={{ fontSize: 10, color: '#4A6A7D', fontStyle: 'italic' }}>Always included</span>
        </div>

        {/* Toggleable sections */}
        {allSectionDefs.map((sec, idx) => {
          const active = selectedSections.includes(sec.id);
          return (
            <button
              key={sec.id}
              onClick={() => toggleSection(sec.id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', marginBottom: 4,
                background: active ? 'rgba(14,50,75,0.6)' : 'rgba(8,15,22,0.3)',
                border: active ? '1px solid rgba(52,145,232,0.3)' : '1px solid rgba(30,74,104,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left' as const,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: 6,
                background: active ? 'rgba(52,145,232,0.2)' : 'rgba(30,74,104,0.3)',
                color: active ? ACCENT : '#4A6A7D',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {idx + 2}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: active ? '#E2E8F0' : '#6B8FA5', flex: 1 }}>
                {active ? '✓ ' : ''}{sec.label}
              </span>
              {sec.core && (
                <span style={{ fontSize: 9, color: '#4A6A7D', background: 'rgba(30,74,104,0.3)', padding: '2px 6px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Core
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Scope Summary ── */}
      <div style={{
        background: 'rgba(14,50,75,0.5)',
        border: '1px solid rgba(30,74,104,0.3)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#6B8FA5', textTransform: 'uppercase' as const, marginBottom: 12 }}>
          Report Scope
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          <div>
            <div style={{ fontSize: 11, color: '#4A6A7D' }}>Industry</div>
            <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500 }}>{scope.industry}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#4A6A7D' }}>Geography</div>
            <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500 }}>{scope.geography}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#4A6A7D' }}>Time Horizon</div>
            <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500 }}>{scope.timeHorizon}</div>
          </div>
          {scope.subIndustry && (
            <div>
              <div style={{ fontSize: 11, color: '#4A6A7D' }}>Sub-Industry</div>
              <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500 }}>{scope.subIndustry}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Selected Segments ── */}
      <div style={{
        background: 'rgba(14,50,75,0.5)',
        border: '1px solid rgba(30,74,104,0.3)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#6B8FA5', textTransform: 'uppercase' as const, marginBottom: 10 }}>
          Selected Segments ({selectedSegments.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {selectedSegments.map((seg) => (
            <span
              key={seg.id}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                background: 'rgba(52,145,232,0.12)',
                border: '1px solid rgba(52,145,232,0.3)',
                color: '#22D3EE',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {seg.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Selected Players ── */}
      <div style={{
        background: 'rgba(14,50,75,0.5)',
        border: '1px solid rgba(30,74,104,0.3)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#6B8FA5', textTransform: 'uppercase' as const, marginBottom: 10 }}>
          Selected Players ({selectedPlayers.length}/10)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {selectedPlayers.map((p) => (
            <span
              key={p.name}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10B981',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {p.name}{p.marketShare ? ` (${p.marketShare})` : ''}
            </span>
          ))}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid rgba(30,74,104,0.4)',
            background: 'transparent',
            color: '#6B8FA5',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 12, color: '#6B8FA5' }}>
          {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} selected
        </div>
        <button
          onClick={onGenerate}
          disabled={selectedSections.length === 0}
          style={{
            padding: '14px 40px',
            borderRadius: 10,
            border: 'none',
            background: selectedSections.length > 0
              ? 'linear-gradient(135deg, #3491E8, #2563EB)'
              : 'rgba(30,74,104,0.4)',
            color: selectedSections.length > 0 ? '#fff' : '#4A6A7D',
            fontSize: 15,
            fontWeight: 700,
            cursor: selectedSections.length > 0 ? 'pointer' : 'not-allowed',
            boxShadow: selectedSections.length > 0 ? '0 4px 20px rgba(52,145,232,0.3)' : 'none',
          }}
        >
          Generate Industry Report →
        </button>
      </div>
    </div>
  );
}
