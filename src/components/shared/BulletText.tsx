'use client';

import React from 'react';

interface BulletTextProps {
  text: string;
  color?: string;
  boldColor?: string;
  fontSize?: number;
  bulletColor?: string;
}

/**
 * Shared component that renders paragraph text as a bulleted list.
 * Splits on newlines (\n) or bullet separators (•).
 * Parses **bold** markers within each bullet.
 * Falls back to single line if only one segment is found.
 */
export default function BulletText({
  text,
  color = '#C4D4DE',
  boldColor = '#E8EDF5',
  fontSize = 12,
  bulletColor = '#3491E8',
}: BulletTextProps) {
  if (!text) return null;

  // Parse **bold** within a string
  function parseBold(segment: string): React.ReactNode[] {
    const parts = segment.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} style={{ fontWeight: 700, color: boldColor }}>
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  // Split by newlines first, then by " • " separator
  let bullets: string[];
  if (text.includes('\n')) {
    bullets = text.split('\n').map((s) => s.replace(/^[•·\-]\s*/, '').trim()).filter(Boolean);
  } else {
    bullets = text.split(/\s*•\s*/).map((s) => s.trim()).filter(Boolean);
  }

  // Single item — render inline, no bullet
  if (bullets.length <= 1) {
    return (
      <div style={{ fontSize, color, lineHeight: 1.65 }}>
        {parseBold(text)}
      </div>
    );
  }

  return (
    <ul style={{
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}>
      {bullets.map((bullet, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{
            color: bulletColor,
            fontSize: 6,
            marginTop: 6,
            flexShrink: 0,
            lineHeight: 1,
          }}>&#9679;</span>
          <span style={{ fontSize, color, lineHeight: 1.65 }}>
            {parseBold(bullet)}
          </span>
        </li>
      ))}
    </ul>
  );
}
