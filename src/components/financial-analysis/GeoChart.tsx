'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { GeoRow } from '@/lib/types';

interface GeoChartProps {
  data: GeoRow[];
}

const COLORS = ['#22D3EE', '#3491E8', '#8B5CF6', '#10B981', '#F59E0B', '#E63946'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as GeoRow;
  return (
    <div style={{
      background: '#0c1e2d', border: '1px solid #1e4a68',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>{d.region}</div>
      <div style={{ color: '#22D3EE' }}>Revenue: {d.revenue}</div>
      <div style={{ color: '#7eaabf' }}>Share: {d.percentage}%</div>
    </div>
  );
};

export default function GeoChart({ data }: GeoChartProps) {
  const sorted = [...data].sort((a, b) => b.percentage - a.percentage);

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', marginBottom: 12, letterSpacing: 0.5 }}>
        REVENUE BY GEOGRAPHY
      </div>
      <div style={{ height: Math.max(160, sorted.length * 38 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={sorted}
            margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(30,74,104,0.3)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#7eaabf', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fill: '#E8EDF5', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="percentage" name="Share %" radius={[0, 3, 3, 0]} label={{
              position: 'right',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: (v: any) => `${v}%`,
              fill: '#7eaabf',
              fontSize: 11,
            }}>
              {sorted.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
