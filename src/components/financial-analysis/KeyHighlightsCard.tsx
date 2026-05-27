'use client';

import { KeyHighlightsStructured } from '@ai-insights/types';
import BulletText from '@/components/shared/BulletText';

interface KeyHighlightsCardProps {
  highlights: KeyHighlightsStructured;
}

const ACCENT = '#22D3EE';

const SECTIONS: {
  key: keyof KeyHighlightsStructured;
  taglineKey: keyof KeyHighlightsStructured;
  label: string;
  icon: string;
}[] = [
  { key: 'overallPerformance', taglineKey: 'overallPerformanceTagline', label: 'Overall Performance', icon: '📊' },
  { key: 'factorsDrivingGrowth', taglineKey: 'factorsDrivingGrowthTagline', label: 'Factors Driving Growth', icon: '🚀' },
  { key: 'factorsInhibitingGrowth', taglineKey: 'factorsInhibitingGrowthTagline', label: 'Factors Inhibiting Growth', icon: '⚠️' },
  { key: 'futureStrategy', taglineKey: 'futureStrategyTagline', label: 'Future Strategy', icon: '🎯' },
  { key: 'growthOutlook', taglineKey: 'growthOutlookTagline', label: 'Growth Outlook', icon: '🔮' },
];

export default function KeyHighlightsCard({ highlights }: KeyHighlightsCardProps) {
  const hasSome = SECTIONS.some((s) => highlights[s.key]);
  if (!hasSome) return null;

  return (
    <div style={{
      background: '#F3F8FA',
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
          const tagline = highlights[section.taglineKey];
          if (!text) return null;
          return (
            <div key={section.key}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 14 }}>{section.icon}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#6B7280',
                  letterSpacing: 0.5, textTransform: 'uppercase',
                }}>
                  {section.label}
                </span>
                {tagline && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#1B2A3D',
                    background: 'rgba(34,211,238,0.12)',
                    border: '1px solid rgba(34,211,238,0.25)',
                    borderRadius: 6,
                    padding: '3px 10px',
                    letterSpacing: 0.3,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {tagline}
                  </span>
                )}
              </div>
              <div style={{ paddingLeft: 22 }}>
                <BulletText text={text as string} color="#374B5C" boldColor="#1B2A3D" fontSize={12} bulletColor="#3491E8" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
