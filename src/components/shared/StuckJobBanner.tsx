'use client';

interface StuckJobBannerProps {
  onRetry: () => void;
}

/**
 * Shown when useJobManager.isStuck === true (no progress for 45s).
 * Drop into any module's loading/analysing view.
 */
export default function StuckJobBanner({ onRetry }: StuckJobBannerProps) {
  return (
    <div style={{
      margin: '24px auto 0',
      maxWidth: 440,
      background: 'rgba(230,57,70,0.1)',
      border: '1px solid rgba(230,57,70,0.35)',
      borderRadius: 10,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E63946', marginBottom: 2 }}>
          Taking longer than expected
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          The server may be processing a large request. You can wait or retry.
        </div>
      </div>
      <button
        onClick={onRetry}
        style={{
          flexShrink: 0,
          background: '#E63946',
          border: 'none',
          borderRadius: 7,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Retry
      </button>
    </div>
  );
}
