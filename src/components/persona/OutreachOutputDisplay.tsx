'use client';

import { useState } from 'react';

interface PitchOutput {
  linkedinMessage: string;
  email: {
    subject: string;
    body: string;
  };
  pitchScript: string;
  valueGap: string;
}

interface OutputDisplayProps {
  output: PitchOutput;
  onBack: () => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '8px 14px',
        borderRadius: 6,
        border: '1px solid rgba(52,145,232,0.4)',
        background: 'rgba(52,145,232,0.08)',
        color: copied ? '#10B981' : '#22D3EE',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => !copied && (e.currentTarget.style.background = 'rgba(52,145,232,0.15)')}
      onMouseLeave={(e) => !copied && (e.currentTarget.style.background = 'rgba(52,145,232,0.08)')}
    >
      {copied ? '✓ Copied' : `📋 Copy ${label}`}
    </button>
  );
}

function EmailButton({ email }: { email: { subject: string; body: string } }) {
  const handleGmail = () => {
    const body = encodeURIComponent(email.body);
    const subject = encodeURIComponent(email.subject);
    window.open(`https://mail.google.com/mail/?ui=2&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <button
      onClick={handleGmail}
      style={{
        padding: '8px 14px',
        borderRadius: 6,
        border: '1px solid rgba(217,119,6,0.4)',
        background: 'rgba(217,119,6,0.08)',
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(217,119,6,0.15)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(217,119,6,0.08)')}
    >
      📧 Open in Gmail
    </button>
  );
}

const outputCardStyle: React.CSSProperties = {
  background: '#F3F8FA',
  border: '1px solid rgba(30,74,104,0.4)',
  borderRadius: 12,
  padding: '20px',
  marginBottom: 20,
};

const outputTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#3491E8',
  marginBottom: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const outputTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#374B5C',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  marginBottom: 14,
  padding: '12px 14px',
  background: '#FFFFFF',
  borderLeft: '3px solid #3491E8',
  borderRadius: 4,
};

export default function OutreachOutputDisplay({ output, onBack }: OutputDisplayProps) {
  return (
    <div>
      {/* Value Gap Summary */}
      <div style={{
        background: 'linear-gradient(160deg, rgba(52,145,232,0.15), rgba(34,211,238,0.1))',
        border: '1px solid rgba(52,145,232,0.3)',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#3491E8', textTransform: 'uppercase' as const, marginBottom: 8, letterSpacing: '0.5px' }}>
          Value Gap Identified
        </div>
        <div style={{ fontSize: 13, color: '#374B5C', lineHeight: 1.6 }}>
          {output.valueGap}
        </div>
      </div>

      {/* LinkedIn Message */}
      <div style={outputCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ ...outputTitleStyle, margin: 0 }}>LinkedIn Connection Request</h3>
          <CopyButton text={output.linkedinMessage} label="Message" />
        </div>
        <div style={outputTextStyle}>
          {output.linkedinMessage}
        </div>
        <div style={{ fontSize: 11, color: '#4A6A7D' }}>
          ✓ Under 300 characters • Specific detail referenced • Non-generic
        </div>
      </div>

      {/* Email */}
      <div style={outputCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ ...outputTitleStyle, margin: 0 }}>Email (Professional Outreach)</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CopyButton text={`Subject: ${output.email.subject}\n\n${output.email.body}`} label="Email" />
            <EmailButton email={output.email} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' as const }}>Subject Line</div>
          <div style={outputTextStyle}>
            {output.email.subject}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' as const }}>Email Body</div>
          <div style={outputTextStyle}>
            {output.email.body}
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#4A6A7D' }}>
          ✓ Peer-to-peer tone • Internal-style subject • Metric-driven proof point • Low-friction CTA
        </div>
      </div>

      {/* 30-Second Pitch Script */}
      <div style={outputCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ ...outputTitleStyle, margin: 0 }}>30-Second In-Person Pitch</h3>
          <CopyButton text={output.pitchScript} label="Script" />
        </div>
        <div style={outputTextStyle}>
          {output.pitchScript}
        </div>
        <div style={{ fontSize: 11, color: '#4A6A7D' }}>
          ✓ Conversational tone • Business transformation focused • No marketing jargon • Consultative
        </div>
      </div>

      {/* Back Button */}
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
          marginTop: 24,
        }}
      >
        ← Start Over
      </button>
    </div>
  );
}
