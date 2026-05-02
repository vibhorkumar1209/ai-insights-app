'use client';

import React, { useState } from 'react';
import { useJobManager } from '@/lib/useJobManager';
import { BusinessSegmentsJob, BusinessTimelinesJob } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/config';

export default function CompanyMiniModules() {
  // Business Segments state
  const [segmentsForm, setSegmentsForm] = useState({ companyName: '', domain: '' });
  const segmentsJob = useJobManager<BusinessSegmentsJob>();

  // Business Timelines state
  const [timelinesForm, setTimelinesForm] = useState({ companyName: '', domain: '' });
  const timelinesJob = useJobManager<BusinessTimelinesJob>();

  // Handle Business Segments submission
  const handleSegmentsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentsForm.companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    await segmentsJob.startJob({
      payload: {
        companyName: segmentsForm.companyName,
        domain: segmentsForm.domain || undefined,
      },
      endpoint: API_ENDPOINTS.businessSegments,
      streamUrlFactory: (jobId) => API_ENDPOINTS.businessSegmentsStream(jobId),
    });
  };

  // Handle Business Timelines submission
  const handleTimelinesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelinesForm.companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    await timelinesJob.startJob({
      payload: {
        companyName: timelinesForm.companyName,
        domain: timelinesForm.domain || undefined,
      },
      endpoint: API_ENDPOINTS.businessTimelines,
      streamUrlFactory: (jobId) => API_ENDPOINTS.businessTimelinesStream(jobId),
    });
  };

  // Reset Business Segments
  const resetSegments = () => {
    segmentsJob.reset();
    setSegmentsForm({ companyName: '', domain: '' });
  };

  // Reset Business Timelines
  const resetTimelines = () => {
    timelinesJob.reset();
    setTimelinesForm({ companyName: '', domain: '' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
      {/* Business Segments Card */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginTop: 0, marginBottom: 8 }}>
          🏢 Business Segments
        </h3>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
          Analyze current business segments & strategic role
        </p>

        {segmentsJob.isComplete && segmentsJob.job ? (
          // Results view
          <div style={{ minHeight: 200 }}>
            <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 12 }}>
              ✓ Analysis Complete
            </div>
            {segmentsJob.job.segments && segmentsJob.job.segments.length > 0 ? (
              <div style={{ fontSize: 12, color: '#374151' }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>{segmentsJob.job.companyName}</strong>
                </div>
                {segmentsJob.job.segments.map((seg, idx) => (
                  <div key={idx} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{seg.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{seg.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#6B7280' }}>No segments found</div>
            )}
            <button
              onClick={resetSegments}
              style={{
                width: '100%',
                marginTop: 12,
                padding: 10,
                background: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              New Analysis
            </button>
          </div>
        ) : segmentsJob.error ? (
          // Error view
          <div style={{ minHeight: 200 }}>
            <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 12 }}>
              ✕ Error: {segmentsJob.error}
            </div>
            <button
              onClick={resetSegments}
              style={{
                width: '100%',
                padding: 10,
                background: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : segmentsJob.isLoading ? (
          // Loading view
          <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, color: '#7C3AED', marginBottom: 12, fontWeight: 600 }}>
              {segmentsJob.job?.currentStep || 'Analyzing segments...'}
            </div>
            <div style={{ background: '#F3E8FF', borderRadius: 4, overflow: 'hidden', height: 4 }}>
              <div
                style={{
                  background: '#7C3AED',
                  height: '100%',
                  width: `${segmentsJob.job?.progress || 0}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>
              {segmentsJob.job?.progress || 0}% complete
            </div>
            <button
              onClick={() => segmentsJob.cancelJob()}
              style={{
                marginTop: 12,
                padding: 8,
                background: 'transparent',
                color: '#DC2626',
                border: '1px solid #DC2626',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          // Form view
          <form onSubmit={handleSegmentsSubmit}>
            <input
              type="text"
              placeholder="Company name"
              value={segmentsForm.companyName}
              onChange={(e) => setSegmentsForm({ ...segmentsForm, companyName: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                marginBottom: 10,
                boxSizing: 'border-box',
                fontSize: 12,
              }}
            />
            <input
              type="text"
              placeholder="Domain (optional)"
              value={segmentsForm.domain}
              onChange={(e) => setSegmentsForm({ ...segmentsForm, domain: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                marginBottom: 10,
                boxSizing: 'border-box',
                fontSize: 12,
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 10,
                background: '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Analyse Segments
            </button>
          </form>
        )}
      </div>

      {/* Business Timelines Card */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginTop: 0, marginBottom: 8 }}>
          📅 Business Timelines
        </h3>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
          Reconstruct strategic business history & milestones
        </p>

        {timelinesJob.isComplete && timelinesJob.job ? (
          // Results view
          <div style={{ minHeight: 200 }}>
            <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 12 }}>
              ✓ Timeline Reconstructed
            </div>
            {timelinesJob.job.timelineBlocks && timelinesJob.job.timelineBlocks.length > 0 ? (
              <div style={{ fontSize: 12, color: '#374151' }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>{timelinesJob.job.companyName}</strong>
                </div>
                {timelinesJob.job.timelineBlocks.map((block, idx) => (
                  <div key={idx} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{block.period}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{block.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#6B7280' }}>No timeline data found</div>
            )}
            <button
              onClick={resetTimelines}
              style={{
                width: '100%',
                marginTop: 12,
                padding: 10,
                background: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              New Analysis
            </button>
          </div>
        ) : timelinesJob.error ? (
          // Error view
          <div style={{ minHeight: 200 }}>
            <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 12 }}>
              ✕ Error: {timelinesJob.error}
            </div>
            <button
              onClick={resetTimelines}
              style={{
                width: '100%',
                padding: 10,
                background: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : timelinesJob.isLoading ? (
          // Loading view
          <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, color: '#06B6D4', marginBottom: 12, fontWeight: 600 }}>
              {timelinesJob.job?.currentStep || 'Reconstructing timeline...'}
            </div>
            <div style={{ background: '#CFFAFE', borderRadius: 4, overflow: 'hidden', height: 4 }}>
              <div
                style={{
                  background: '#06B6D4',
                  height: '100%',
                  width: `${timelinesJob.job?.progress || 0}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>
              {timelinesJob.job?.progress || 0}% complete
            </div>
            <button
              onClick={() => timelinesJob.cancelJob()}
              style={{
                marginTop: 12,
                padding: 8,
                background: 'transparent',
                color: '#DC2626',
                border: '1px solid #DC2626',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          // Form view
          <form onSubmit={handleTimelinesSubmit}>
            <input
              type="text"
              placeholder="Company name"
              value={timelinesForm.companyName}
              onChange={(e) => setTimelinesForm({ ...timelinesForm, companyName: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                marginBottom: 10,
                boxSizing: 'border-box',
                fontSize: 12,
              }}
            />
            <input
              type="text"
              placeholder="Domain (optional)"
              value={timelinesForm.domain}
              onChange={(e) => setTimelinesForm({ ...timelinesForm, domain: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                marginBottom: 10,
                boxSizing: 'border-box',
                fontSize: 12,
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 10,
                background: '#06B6D4',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reconstruct Timeline
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
