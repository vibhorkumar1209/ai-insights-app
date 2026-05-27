'use client';

interface SourceLinksProps {
  source?: string;
  color?: string;
  linkColor?: string;
  fontSize?: number;
}

/**
 * Parses and renders source text with clickable hyperlinks.
 * Handles formats like:
 * - Single URL: "https://example.com"
 * - Pipe-separated URLs: "https://example.com | https://other.com"
 * - Text with URLs: "Company reports: https://example.com"
 * - Mixed: "SEC filings: https://sec.gov | Company reports: https://reports.com"
 */
export default function SourceLinks({
  source,
  color = '#6B7280',
  linkColor = '#3491E8',
  fontSize = 11,
}: SourceLinksProps) {
  if (!source) {
    return <span style={{ color, fontStyle: 'italic', fontSize }}>—</span>;
  }

  // Split by pipe separator and process each part
  const parts = source.split('|').map((part) => part.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {parts.map((part, idx) => {
        // Extract URLs from the text (match http:// or https://)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = part.match(urlRegex);

        if (matches && matches.length > 0) {
          // Has at least one URL
          const elements = [];
          let lastIndex = 0;

          // Replace URLs with clickable links
          part.replace(urlRegex, (match, offset) => {
            const urlStartIdx = part.indexOf(match, lastIndex);
            if (urlStartIdx > lastIndex) {
              // Add text before the URL
              elements.push(
                <span key={`text-${idx}-${lastIndex}`} style={{ color, fontSize }}>
                  {part.substring(lastIndex, urlStartIdx)}
                </span>
              );
            }

            // Add the URL as a clickable link
            elements.push(
              <a
                key={`link-${idx}-${urlStartIdx}`}
                href={match}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: linkColor,
                  textDecoration: 'underline',
                  fontSize,
                  cursor: 'pointer',
                }}
              >
                {match}
              </a>
            );

            lastIndex = urlStartIdx + match.length;
            return match;
          });

          // Add any remaining text after the last URL
          if (lastIndex < part.length) {
            elements.push(
              <span key={`text-${idx}-end`} style={{ color, fontSize }}>
                {part.substring(lastIndex)}
              </span>
            );
          }

          return (
            <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {elements}
            </div>
          );
        } else {
          // No URLs, just return plain text
          return (
            <span key={idx} style={{ color, fontSize }}>
              {part}
            </span>
          );
        }
      })}
    </div>
  );
}
