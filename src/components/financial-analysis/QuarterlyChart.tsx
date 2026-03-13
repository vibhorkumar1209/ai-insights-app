'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { QuarterlyDataPoint } from '@/lib/types';

interface QuarterlyChartProps {
  data: QuarterlyDataPoint[];
  currency?: string;
}

const ACCENT   = '#22D3EE';
const MARGIN_C = '#F59E0B';

// Shorten period labels: "DEC 2025" → "DEC '25"
function shortPeriod(period: string): string {
  const parts = period.trim().split(/\s+/);
  if (parts.length === 2) {
    return `${parts[0]} '${parts[1].slice(-2)}`;
  }
  return period;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      background: 'rgba(8,15,22,0.97)',
      border: '1px solid #1e4a68',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>{label}</div>
      {payload.map((p: { name: string; color: string; value: number | string; payload: QuarterlyDataPoint }) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 4 }}>
          <span style={{ color: '#7eaabf', marginRight: 6 }}>{p.name}:</span>
          {p.name === 'Revenue'
            ? p.payload.revenueFormatted ?? String(p.value)
            : `${typeof p.value === 'number' ? p.value.toFixed(1) : p.value}%`}
        </div>
      ))}
      {payload[0]?.payload?.effectiveTaxRate && (
        <div style={{ color: '#4a7a96', fontSize: 11, marginTop: 4 }}>
          Tax rate: {payload[0].payload.effectiveTaxRate}
        </div>
      )}
    </div>
  );
}

export default function QuarterlyChart({ data, currency }: QuarterlyChartProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    periodShort: shortPeriod(d.period),
    revenueM: d.revenue != null ? Math.round(d.revenue / 1e6) : null, // display in M
  }));

  // Y-axis label based on magnitude
  const maxRev = Math.max(...data.map((d) => d.revenue ?? 0));
  const revUnit = maxRev >= 1e9 ? 'B' : 'M';
  const revDivisor = revUnit === 'B' ? 1e9 : 1e6;
  const currSym = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  const barData = chartData.map((d) => ({
    ...d,
    revDisplay: d.revenue != null ? parseFloat((d.revenue / revDivisor).toFixed(2)) : null,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={barData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,74,104,0.3)" vertical={false} />
          <XAxis
            dataKey="periodShort"
            tick={{ fill: '#7eaabf', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          {/* Left axis: Revenue */}
          <YAxis
            yAxisId="rev"
            tickFormatter={(v) => `${currSym}${v}${revUnit}`}
            tick={{ fill: '#7eaabf', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          {/* Right axis: Margin % */}
          <YAxis
            yAxisId="margin"
            orientation="right"
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#F59E0B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#7eaabf', paddingTop: 12 }}
            formatter={(value) => <span style={{ color: '#7eaabf' }}>{value}</span>}
          />
          <ReferenceLine yAxisId="margin" y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar
            yAxisId="rev"
            dataKey="revDisplay"
            name="Revenue"
            fill={ACCENT}
            fillOpacity={0.8}
            radius={[3, 3, 0, 0]}
            maxBarSize={48}
          />
          <Line
            yAxisId="margin"
            type="monotone"
            dataKey="netProfitMargin"
            name="Net Margin"
            stroke={MARGIN_C}
            strokeWidth={2}
            dot={{ r: 3, fill: MARGIN_C }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* EPS row if available */}
      {data.some((d) => d.earningsPerShare && d.earningsPerShare !== '—') && (
        <div style={{
          display: 'flex', gap: 8, marginTop: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 10, color: '#4a7a96', marginRight: 4, fontWeight: 600 }}>EPS:</span>
          {data.map((d) => (
            <div key={d.period} style={{
              background: 'rgba(34,211,238,0.06)',
              border: '1px solid rgba(34,211,238,0.18)',
              borderRadius: 5,
              padding: '3px 8px',
              fontSize: 10,
            }}>
              <span style={{ color: '#4a7a96', marginRight: 4 }}>{shortPeriod(d.period)}</span>
              <span style={{ color: '#C4D4DE', fontWeight: 600 }}>
                {d.earningsPerShare && d.earningsPerShare !== '—' ? d.earningsPerShare : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
