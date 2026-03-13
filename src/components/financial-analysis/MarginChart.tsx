'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { MarginDataPoint } from '@/lib/types';

interface MarginChartProps {
  data: MarginDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0c1e2d', border: '1px solid #1e4a68',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value}%
        </div>
      ))}
    </div>
  );
};

export default function MarginChart({ data }: MarginChartProps) {
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid stroke="rgba(30,74,104,0.3)" strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#7eaabf', fontSize: 11 }}
            axisLine={{ stroke: '#1e4a68' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#7eaabf', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ReferenceLine y={0} stroke="rgba(30,74,104,0.5)" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#7eaabf', paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="operatingMargin"
            name="Operating Margin"
            stroke="#3491E8"
            strokeWidth={2.5}
            dot={{ fill: '#3491E8', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="netMargin"
            name="Net Margin"
            stroke="#E63946"
            strokeWidth={2.5}
            dot={{ fill: '#E63946', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
