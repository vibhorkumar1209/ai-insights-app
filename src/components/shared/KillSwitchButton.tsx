'use client';

export default function KillSwitchButton({ onCancel }: { onCancel: () => void }) {
  return (
    <div style={{ marginTop: 16, textAlign: 'center' }}>
      <button
        onClick={onCancel}
        style={{
          background: 'transparent',
          border: '1px solid rgba(230,57,70,0.4)',
          color: '#E63946',
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(230,57,70,0.1)'; }}
        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent'; }}
      >
        ⏹ Stop Generation
      </button>
    </div>
  );
}
