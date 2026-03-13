'use client';

import { useState } from 'react';
import { CompanyInfo } from '@/lib/types';

interface CompanyInfoCardProps {
  info: CompanyInfo;
  companyName?: string;
  ticker?: string;
  exchange?: string;
  currency?: string;
}

const ACCENT = '#22D3EE';

function MetaItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#4a7a96', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#C4D4DE', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

export default function CompanyInfoCard({ info, companyName, ticker, exchange, currency }: CompanyInfoCardProps) {
  const [showAbout, setShowAbout] = useState(false);

  const displayName = info.name || companyName || 'Company';
  const exchangeLabel = (info.exchange || exchange) && ticker
    ? `${info.exchange || exchange}: ${ticker.split('.')[0]}`
    : info.exchange || exchange || '';
  const currencyLabel = currency && currency !== 'USD' ? ` · ${currency}` : '';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c1e2d, #080f16)',
      border: `1px solid ${ACCENT}33`,
      borderRadius: 12,
      padding: '18px 22px',
      marginBottom: 20,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#E8EDF5', marginBottom: 3 }}>
            {displayName}
          </div>
          {(exchangeLabel || currencyLabel) && (
            <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, letterSpacing: 0.5 }}>
              {exchangeLabel}{currencyLabel}
            </div>
          )}
        </div>

        {/* Key metrics pill row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {info.marketCap && (
            <div style={{
              background: `${ACCENT}11`, border: `1px solid ${ACCENT}33`,
              borderRadius: 6, padding: '5px 10px', fontSize: 11,
            }}>
              <span style={{ color: '#7eaabf' }}>Mkt Cap </span>
              <span style={{ color: '#E8EDF5', fontWeight: 700 }}>{info.marketCap}</span>
            </div>
          )}
          {info.peRatio && info.peRatio !== '—' && (
            <div style={{
              background: 'rgba(52,145,232,0.08)', border: '1px solid rgba(52,145,232,0.25)',
              borderRadius: 6, padding: '5px 10px', fontSize: 11,
            }}>
              <span style={{ color: '#7eaabf' }}>P/E </span>
              <span style={{ color: '#E8EDF5', fontWeight: 700 }}>{info.peRatio}</span>
            </div>
          )}
          {info.dividendYield && info.dividendYield !== '—' && (
            <div style={{
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 6, padding: '5px 10px', fontSize: 11,
            }}>
              <span style={{ color: '#7eaabf' }}>Div </span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{info.dividendYield}</span>
            </div>
          )}
          {info.previousClose && (
            <div style={{
              background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)',
              borderRadius: 6, padding: '5px 10px', fontSize: 11,
            }}>
              <span style={{ color: '#7eaabf' }}>Close </span>
              <span style={{ color: '#E8EDF5', fontWeight: 700 }}>{info.previousClose}</span>
            </div>
          )}
        </div>
      </div>

      {/* Detail grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px 20px',
        paddingTop: 14,
        borderTop: '1px solid #1e4a6844',
      }}>
        <MetaItem label="CEO"        value={info.ceo} />
        <MetaItem label="Employees"  value={info.employees} />
        <MetaItem label="Founded"    value={info.founded} />
        <MetaItem label="HQ"         value={info.headquarters?.replace(/\n/g, ', ')} />
        <MetaItem label="52w Range"  value={info.yearRange} />
        <MetaItem label="Avg Volume" value={info.avgVolume} />
        {info.website && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#4a7a96', textTransform: 'uppercase' }}>
              Website
            </div>
            <a
              href={`https://${info.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: ACCENT, textDecoration: 'none', fontWeight: 500 }}
            >
              {info.website}
            </a>
          </div>
        )}
      </div>

      {/* Collapsible About */}
      {info.about && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowAbout((p) => !p)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#7eaabf', fontWeight: 600, letterSpacing: 0.5,
            }}
          >
            <span style={{
              display: 'inline-block',
              transform: showAbout ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
              fontSize: 9,
            }}>▶</span>
            ABOUT
          </button>
          {showAbout && (
            <p style={{
              margin: '10px 0 0',
              fontSize: 12, color: '#8fafc0', lineHeight: 1.65,
              borderLeft: `2px solid ${ACCENT}44`,
              paddingLeft: 12,
            }}>
              {/* Show first ~400 chars to avoid copyright concerns */}
              {info.about.slice(0, 400)}{info.about.length > 400 ? '…' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
