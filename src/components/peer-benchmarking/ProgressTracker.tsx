'use client';

import { BenchmarkJob } from '@/lib/types';

interface ProgressTrackerProps {
  job: Partial<BenchmarkJob>;
  targetCompany: string;
}

const steps = [
  { key: 'pending', label: 'Initializing', icon: '⚙️' },
  { key: 'researching', label: 'Researching companies', icon: '🔍' },
  { key: 'synthesizing', label: 'Synthesizing insights', icon: '🧠' },
  { key: 'complete', label: 'Complete', icon: '✓' },
];

export default function ProgressTracker({ job, targetCompany }: ProgressTrackerProps) {
  const progress = job.progress ?? 0;
  const currentStatus = job.status ?? 'pending';

  const stepIndex = steps.findIndex((s) => s.key === currentStatus);
  const activeIndex = stepIndex === -1 ? 0 : stepIndex;

  return (
    <div style={{
      background: 'linear-gradient(160deg, #132d40, #0f2535)',
      border: '1px solid #1e4a68',
      borderRadius: 12,
      padding: 28,
    }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 2, marginBottom: 6 }}>
          STEP 3 OF 3
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>
          Analyzing {targetCompany}
        </div>
        <div style={{ fontSize: 13, color: '#7eaabf', marginTop: 4 }}>
          Parallel.AI is researching companies while Claude synthesizes insights.
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7eaabf' }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3491E8' }}>{progress}%</span>
        </div>
        <div style={{
          height: 6, background: 'rgba(30,74,104,0.4)', borderRadius: 3, overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3491E8, #6ab8ff)',
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }}
            className={progress < 100 ? 'progress-pulse' : ''}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {steps.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex && currentStatus !== 'complete';
          const complete = currentStatus === 'complete';

          return (
            <div key={step.key} style={{ flex: 1 }}>
              <div style={{
                background: done || complete
                  ? 'rgba(52,145,232,0.15)'
                  : active
                    ? 'rgba(52,145,232,0.08)'
                    : 'rgba(30,74,104,0.2)',
                border: `1px solid ${done || complete || active ? 'rgba(52,145,232,0.4)' : '#1e4a68'}`,
                borderRadius: 8,
                padding: '10px 8px',
                textAlign: 'center',
                transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{step.icon}</div>
                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: done || complete ? '#6ab8ff' : active ? '#E8EDF5' : '#4a7a96',
                  lineHeight: 1.3,
                }}>
                  {step.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current step */}
      {job.currentStep && currentStatus !== 'complete' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(52,145,232,0.08)',
          border: '1px solid rgba(52,145,232,0.2)',
          borderRadius: 8,
          padding: '10px 16px',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#3491E8',
            animation: 'progress-pulse 1s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 13, color: '#7eaabf' }}>{job.currentStep}</span>
        </div>
      )}

      {/* Error */}
      {currentStatus === 'error' && (
        <div style={{
          marginTop: 20,
          background: 'rgba(230,57,70,0.08)',
          border: '1px solid rgba(230,57,70,0.3)',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ff6b75' }}>Analysis failed</div>
          <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 4 }}>
            {job.error || 'An unexpected error occurred. Please try again.'}
          </div>
        </div>
      )}
    </div>
  );
}
