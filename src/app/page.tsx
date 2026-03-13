import ModuleCard from '@/components/ModuleCard';
import { MODULES } from '@/lib/types';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080f16' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '24px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#3491E8', marginBottom: 6 }}>
            REFRACTONE
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#E8EDF5', lineHeight: 1.2 }}>
            AI Insights
          </div>
          <div style={{ fontSize: 14, color: '#7eaabf', marginTop: 6 }}>
            Enterprise intelligence for peer benchmarking, financial analysis, and account planning
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', letterSpacing: 2, marginBottom: 8 }}>
            ANALYSIS MODULES
          </div>
          <div style={{ height: 2, background: 'linear-gradient(90deg, #3491E8, transparent)', width: 200 }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}>
          {MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              label={module.label}
              icon={module.icon}
              available={module.available}
            />
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 48,
          padding: '16px 20px',
          background: 'rgba(52,145,232,0.06)',
          border: '1px solid rgba(52,145,232,0.15)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5' }}>
              Peer Benchmarking is live
            </div>
            <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 2 }}>
              Benchmark any target company against up to 5 peers across IT, AI, and digital dimensions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
