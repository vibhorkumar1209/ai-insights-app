'use client';

import React, { useState } from 'react';
import { useJobManager } from '@/lib/useJobManager';
import { BusinessSegmentsJob } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/config';

export default function BusinessSegmentsPage() {
  const [form, setForm] = useState({ companyName: '', domain: '' });
  const job = useJobManager<BusinessSegmentsJob>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    await job.startJob({
      payload: {
        companyName: form.companyName,
        domain: form.domain || undefined,
      },
      endpoint: API_ENDPOINTS.businessSegments,
      streamUrlFactory: (jobId) => API_ENDPOINTS.businessSegmentsStream(jobId),
    });
  };

  const reset = () => {
    job.reset();
    setForm({ companyName: '', domain: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', padding: '40px 32px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B2A3D', margin: '0 0 8px 0' }}>
            🏢 Business Segments
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            Analyze current business segments & strategic role
          </p>
        </div>

        {/* Content */}
        <div style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid #E5E7EB' }}>
          {job.isComplete && job.job ? (
            // Results view
            <div>
              <div style={{ fontSize: 14, color: '#059669', fontWeight: 600, marginBottom: 24 }}>
                ✓ Analysis Complete
              </div>
              {job.job.segments && job.job.segments.length > 0 ? (
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 20 }}>
                    {job.job.companyName}
                  </h2>
                  {job.job.segments.map((seg, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: 20,
                        paddingBottom: 20,
                        borderBottom: idx < job.job.segments!.length - 1 ? '1px solid #E5E7EB' : 'none',
                      }}
                    >
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginBottom: 8, margin: '0 0 8px 0' }}>
                        {seg.name}
                      </h3>
                      <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{seg.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#6B7280' }}>No segments found</p>
              )}
              <button
                onClick={reset}
                style={{
                  marginTop: 20,
                  width: '100%',
                  padding: 12,
                  background: '#7C3AED',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Analyze Another Company
              </button>
            </div>
          ) : job.error ? (
            // Error view
            <div>
              <div style={{ fontSize: 13, color: '#DC2626', marginBottom: 20 }}>
                ✕ Error: {job.error}
              </div>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#7C3AED',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          ) : job.isLoading ? (
            // Loading view
            <div>
              <div style={{ fontSize: 13, color: '#7C3AED', marginBottom: 16, fontWeight: 600 }}>
                {job.job?.currentStep || 'Analyzing segments...'}
              </div>
              <div style={{ background: '#F3E8FF', borderRadius: 4, overflow: 'hidden', height: 6, marginBottom: 12 }}>
                <div
                  style={{
                    background: '#7C3AED',
                    height: '100%',
                    width: `${job.job?.progress || 0}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
                {job.job?.progress || 0}% complete
              </div>
              <button
                onClick={() => job.cancelJob()}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'transparent',
                  color: '#DC2626',
                  border: '1px solid #DC2626',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            // Form view
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Apple, Microsoft, Tesla"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    boxSizing: 'border-box',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                  Domain <span style={{ color: '#9CA3AF' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., apple.com"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    boxSizing: 'border-box',
                    fontSize: 13,
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#7C3AED',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Analyze Segments
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
