'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PieDataItem {
  name: string;
  value: number;
}

interface RevenuePieChartProps {
  data: PieDataItem[];
  title: string;
  accent?: string;
}

const COLORS = ['#22D3EE', '#3491E8', '#8B5CF6', '#10B981', '#F59E0B', '#E63946', '#06B6D4', '#6366F1'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'rgba(8,15,22,0.97)',
      border: '1px solid #1e4a68',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: d.payload.fill || '#22D3EE' }}>
        {d.value.toFixed(1)}%
      </div>
    </div>
  );
}

export default function RevenuePieChart({ data, title, accent = '#22D3EE' }: RevenuePieChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
        color: accent, marginBottom: 14,
        textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 11, color: '#7eaabf', paddingLeft: 12 }}
            formatter={(value: string) => <span style={{ color: '#C4D4DE' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
