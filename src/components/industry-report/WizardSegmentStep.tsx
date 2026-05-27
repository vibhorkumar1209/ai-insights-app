'use client';
import React, { useState } from 'react';
import { MarketSegmentOption } from '@ai-insights/types';

interface Props {
  segments: MarketSegmentOption[];
  onUpdate: (segments: MarketSegmentOption[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  organized: 'Market Structure',
  geo: 'Geography',
  product_type: 'Product Type',
  application: 'Application',
  distribution: 'Distribution',
  channel: 'Channel',
  pricing: 'Pricing Segment',
  end_use: 'End-Use Industry',
  other: 'Other',
};

export default function WizardSegmentStep({ segments, onUpdate, onNext, onBack }: Props) {
  const [customLabel, setCustomLabel] = useState('');

  const toggleSegment = (id: string) => {
    onUpdate(segments.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));
  };

  const addCustom = () => {
    if (!customLabel.trim()) return;
    const newSeg: MarketSegmentOption = {
      id: `custom_${Date.now()}`,
      label: customLabel.trim(),
      type: 'other',
      selected: true,
      subSegments: [],
    };
    onUpdate([...segments, newSeg]);
    setCustomLabel('');
  };

  const selectedCount = segments.filter((s) => s.selected).length;

  // Group segments by type
  const grouped = segments.reduce<Record<string, MarketSegmentOption[]>>((acc, seg) => {
    const key = seg.type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(seg);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3491E8', textTransform: 'uppercase' as const, marginBottom: 8 }}>
          Step 2 of 5
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
          Select Market Segments
        </h2>
        <p style={{ fontSize: 13, color: '#5A6E7A', marginTop: 8 }}>
          Choose which market segmentation dimensions to include in the report. You can add custom segments.
        </p>
      </div>

      {Object.entries(grouped).map(([type, segs]) => (
        <div key={type} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#5A6E7A', textTransform: 'uppercase' as const, marginBottom: 10 }}>
            {SEGMENT_TYPE_LABELS[type] || type}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {segs.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => toggleSegment(seg.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: seg.selected ? '1px solid rgba(52,145,232,0.5)' : '1px solid rgba(30,74,104,0.4)',
                    background: seg.selected ? 'rgba(52,145,232,0.15)' : '#F3F8FA',
                    color: seg.selected ? '#3491E8' : '#6B7280',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {seg.selected ? '✓ ' : ''}{seg.label}
                  {seg.subSegments?.length ? (
                    <span style={{ fontSize: 10, color: '#4A6A7D', marginLeft: 6 }}>
                      ({seg.subSegments.length})
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {/* Show subsegments for selected segments */}
            {segs.filter((seg) => seg.selected && seg.subSegments?.length).map((seg) => (
              <div
                key={`${seg.id}_subs`}
                style={{
                  marginLeft: 16,
                  padding: '8px 14px',
                  background: 'rgba(52,145,232,0.05)',
                  border: '1px solid rgba(52,145,232,0.15)',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, color: '#4A6A7D', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  {seg.label} — Sub-segments
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                  {seg.subSegments!.map((sub, si) => (
                    <span
                      key={si}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(52,145,232,0.08)',
                        border: '1px solid rgba(52,145,232,0.2)',
                        color: '#7EAABF',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add custom segment */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 32 }}>
        <input
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="Add custom segment..."
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid rgba(30,74,104,0.4)',
            background: '#EDF4F8',
            color: '#E2E8F0',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={addCustom}
          disabled={!customLabel.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid rgba(52,145,232,0.4)',
            background: 'rgba(52,145,232,0.15)',
            color: '#3491E8',
            fontSize: 13,
            fontWeight: 600,
            cursor: customLabel.trim() ? 'pointer' : 'not-allowed',
            opacity: customLabel.trim() ? 1 : 0.5,
          }}
        >
          + Add
        </button>
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
            color: '#5A6E7A',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 13, color: '#5A6E7A' }}>
          {selectedCount} segment{selectedCount !== 1 ? 's' : ''} selected
        </div>
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          style={{
            padding: '12px 32px',
            borderRadius: 8,
            border: 'none',
            background: selectedCount > 0 ? 'linear-gradient(135deg, #3491E8, #2563EB)' : '#CCDFEA',
            color: selectedCount > 0 ? '#fff' : '#4A6A7D',
            fontSize: 14,
            fontWeight: 600,
            cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Next: Key Players →
        </button>
      </div>
    </div>
  );
}
