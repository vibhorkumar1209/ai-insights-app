'use client';

import { useState } from 'react';
import OutreachOutputDisplay from './OutreachOutputDisplay';
import TailoredPitchForm from './TailoredPitchForm';

interface PitchOutput {
  linkedinMessage: string;
  email: {
    subject: string;
    body: string;
  };
  pitchScript: string;
  valueGap: string;
}

export default function TailoredSalesPitchSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<PitchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (formData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/persona/tailored-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to generate pitch');
      }

      const data = await response.json();
      setOutput(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{
          background: 'rgba(230,57,70,0.1)',
          border: '1px solid rgba(230,57,70,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 13,
          color: '#ff6b75',
        }}>
          {error}
        </div>
      )}

      {!output ? (
        <TailoredPitchForm onSubmit={handleGenerate} isLoading={isLoading} />
      ) : (
        <OutreachOutputDisplay output={output} onBack={() => setOutput(null)} />
      )}
    </div>
  );
}
