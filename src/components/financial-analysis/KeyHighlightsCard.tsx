'use client';

import { KeyHighlightsStructured } from '@/lib/types';

interface KeyHighlightsCardProps {
  highlights: KeyHighlightsStructured;
}

const ACCENT = '#22D3EE';

const SECTIONS: { key: keyof KeyHighlightsStructured; label: string; icon: string }[] = [
  { key: 'overallPerformance', label: 'Overall Performance', icon: '📊' },
  { key: 'factorsDrivingGrowth', label: 'Factors Driving Growth', icon: '🚀' },
  { key: 'factorsInhibitingGrowth', label: 'Factors Inhibiting Growth', icon: '⚠️' },
  { key: 'futureStrategy', label: 'Future Strategy', icon: '🎯' },
  { key: 'growthOutlook', label: 'Growth Outlook', icon: '🔮' },
];

export default function KeyHighlightsCard({ highlights }: KeyHighlightsCardProps) {
  const hasSome = SECTIONS.some((s) => highlights[s.key]);
  if (!hasSome) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(34,211,238,0.04), rgba(8,15,22,0.8))',
      border: '1px solid rgba(34,211,238,0.2)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
        color: ACCENT, marginBottom: 18, textTransform: 'uppercase',
      }}>
        Key Highlights
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SECTIONS.map((section) => {
          const text = highlights[section.key];
          if (!text) return null;
          return (
            <div key={section.key}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 14 }}>{section.icon}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#7eaabf',
                  letterSpacing: 0.5, textTransform: 'uppercase',
                }}>
                  {section.label}
                </span>
              </div>
              <div style={{
                fontSize: 12, color: '#C4D4DE', lineHeight: 1.7,
                paddingLeft: 22,
              }}>
                {text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
