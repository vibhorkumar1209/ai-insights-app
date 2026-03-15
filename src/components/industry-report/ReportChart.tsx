'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ReportChartSpec } from '@/lib/types';

const COLORS = ['#059669', '#22D3EE', '#3491E8', '#8B5CF6', '#F59E0B', '#10B981', '#E63946', '#06B6D4'];

interface ReportChartProps {
  chartSpec: ReportChartSpec;
}

const tooltipStyle = {
  backgroundColor: '#0c1e2d',
  border: '1px solid #1e4a68',
  borderRadius: 8,
  fontSize: 12,
  color: '#C4D4DE',
};

export default function ReportChart({ chartSpec }: ReportChartProps) {
  if (!chartSpec?.data?.length) return null;

  const data = chartSpec.data.map((d) => ({ name: d.label, value: d.value, category: d.category }));

  return (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      {chartSpec.title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#059669', marginBottom: 10, letterSpacing: 0.3 }}>
          {chartSpec.title}
        </div>
      )}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          {chartSpec.type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={{ stroke: '#4a7a96' }}
                style={{ fontSize: 11 }}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#7eaabf' }} />
            </PieChart>
          ) : chartSpec.type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(30,74,104,0.3)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#7eaabf', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#7eaabf', fontSize: 11 }} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ fill: '#059669', r: 4 }}
                activeDot={{ r: 6, fill: '#22D3EE' }}
              />
            </LineChart>
          ) : (
            /* bar (default) and stacked_bar */
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(30,74,104,0.3)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#7eaabf', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#7eaabf', fontSize: 11 }} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(5,150,105,0.08)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
