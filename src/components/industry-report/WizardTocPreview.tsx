'use client';
import React from 'react';
import { IndustryReportScope, MarketSegmentOption, KeyPlayerOption } from '@/lib/types';

interface Props {
  scope: IndustryReportScope;
  segments: MarketSegmentOption[];
  players: KeyPlayerOption[];
  tocPreview: string[];
  onGenerate: () => void;
  onBack: () => void;
}

export default function WizardTocPreview({ scope, segments, players, tocPreview, onGenerate, onBack }: Props) {
  const selectedSegments = segments.filter((s) => s.selected);
  const selectedPlayers = players.filter((p) => p.selected);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3491E8', textTransform: 'uppercase' as const, marginBottom: 8 }}>
          Step 4 of 4
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
          Review & Generate
        </h2>
        <p style={{ fontSize: 13, color: '#6B8FA5', marginTop: 8 }}>
          Review your selections and the proposed report scope before generating.
        </p>
      </div>

      {/* Scope Summary */}
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

      {/* Selected Segments */}
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

      {/* Selected Players */}
      <div style={{
        background: 'rgba(14,50,75,0.5)',
        border: '1px solid rgba(30,74,104,0.3)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
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

      {/* TOC Preview */}
      <div style={{
        background: 'rgba(14,50,75,0.5)',
        border: '1px solid rgba(30,74,104,0.3)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#6B8FA5', textTransform: 'uppercase' as const, marginBottom: 12 }}>
          Report Table of Contents
        </div>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {tocPreview.map((item, i) => (
            <li key={i} style={{ fontSize: 13, color: '#C4D4DE', padding: '4px 0', lineHeight: 1.5 }}>
              {item}
            </li>
          ))}
        </ol>
      </div>

      {/* Navigation */}
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
        <button
          onClick={onGenerate}
          style={{
            padding: '14px 40px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #3491E8, #2563EB)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(52,145,232,0.3)',
          }}
        >
          Generate Industry Report →
        </button>
      </div>
    </div>
  );
}
