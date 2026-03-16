'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Area, AreaChart,
} from 'recharts';
import { ReportChartSpec, ChartSeriesConfig } from '@/lib/types';

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = ['#059669', '#22D3EE', '#3491E8', '#8B5CF6', '#F59E0B', '#10B981', '#E63946', '#06B6D4'];

interface ReportChartProps {
  chartSpec: ReportChartSpec;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0c1e2d', border: '1px solid #1e4a68',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ color: p.color || '#C4D4DE', marginBottom: 2 }}>
          {p.name}: <span style={{ fontWeight: 700 }}>
            {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Shared axis / grid props ──────────────────────────────────────────────────
const gridProps = { stroke: 'rgba(30,74,104,0.3)', strokeDasharray: '3 3' as const };
const tickStyle = { fill: '#7eaabf', fontSize: 11 };
const rightTickStyle = { fill: '#F59E0B', fontSize: 11 };

// ── Helper: get series color ──────────────────────────────────────────────────
function seriesColor(s: ChartSeriesConfig, i: number): string {
  return s.color || COLORS[i % COLORS.length];
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportChart({ chartSpec }: ReportChartProps) {
  if (!chartSpec?.data?.length) return null;

  const { type, series } = chartSpec;

  // Map data for recharts: use 'name' as the category key
  const data = chartSpec.data.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point: Record<string, any> = { name: d.label, value: d.value };
    // Copy all extra series keys
    for (const key of Object.keys(d)) {
      if (key !== 'label') point[key] = d[key];
    }
    return point;
  });

  // ── Title ───────────────────────────────────────────────────────────────────
  const title = chartSpec.title ? (
    <div style={{ fontSize: 13, fontWeight: 600, color: '#059669', marginBottom: 10, letterSpacing: 0.3 }}>
      {chartSpec.title}
    </div>
  ) : null;

  // ── COMBO: Column + Line (dual Y-axis) ──────────────────────────────────────
  if (type === 'combo' && series?.length) {
    const barSeries = series.filter((s) => (s.type || 'bar') === 'bar');
    const lineSeries = series.filter((s) => s.type === 'line');
    const hasRightAxis = series.some((s) => s.yAxisId === 'right');
    const isPercentRight = (chartSpec.yRightLabel || '').match(/%|CAGR|Growth|Margin/i);

    return (
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        {title}
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: hasRightAxis ? 50 : 20, left: 10, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={{ stroke: '#1e4a68' }} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                label={chartSpec.yLabel ? { value: chartSpec.yLabel, angle: -90, position: 'insideLeft', fill: '#7eaabf', fontSize: 10 } : undefined}
              />
              {hasRightAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={rightTickStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={isPercentRight ? (v: number) => `${v}%` : undefined}
                  label={chartSpec.yRightLabel ? { value: chartSpec.yRightLabel, angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 10 } : undefined}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#7eaabf', paddingTop: 8 }} />
              {barSeries.map((s, i) => (
                <Bar
                  key={s.key}
                  yAxisId={s.yAxisId || 'left'}
                  dataKey={s.key}
                  name={s.name}
                  fill={seriesColor(s, i)}
                  radius={[4, 4, 0, 0]}
                  barSize={Math.max(20, Math.min(40, 300 / data.length))}
                  opacity={0.85}
                />
              ))}
              {lineSeries.map((s, i) => (
                <Line
                  key={s.key}
                  yAxisId={s.yAxisId || 'right'}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={seriesColor(s, barSeries.length + i)}
                  strokeWidth={2.5}
                  dot={{ fill: seriesColor(s, barSeries.length + i), r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── STACKED BAR (+ optional trend line) ─────────────────────────────────────
  if (type === 'stacked_bar' && series?.length) {
    const barSeries = series.filter((s) => (s.type || 'bar') === 'bar');
    const lineSeries = series.filter((s) => s.type === 'line');
    const hasRightAxis = lineSeries.some((s) => s.yAxisId === 'right');

    return (
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        {title}
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: hasRightAxis ? 50 : 20, left: 10, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={{ stroke: '#1e4a68' }} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                label={chartSpec.yLabel ? { value: chartSpec.yLabel, angle: -90, position: 'insideLeft', fill: '#7eaabf', fontSize: 10 } : undefined}
              />
              {hasRightAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={rightTickStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#7eaabf', paddingTop: 8 }} />
              {barSeries.map((s, i) => (
                <Bar
                  key={s.key}
                  yAxisId={s.yAxisId || 'left'}
                  dataKey={s.key}
                  name={s.name}
                  stackId={s.stack || 'stack'}
                  fill={seriesColor(s, i)}
                  radius={i === barSeries.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  barSize={Math.max(25, Math.min(45, 350 / data.length))}
                />
              ))}
              {lineSeries.map((s, i) => (
                <Line
                  key={s.key}
                  yAxisId={s.yAxisId || 'right'}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={seriesColor(s, barSeries.length + i)}
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── PIE / DONUT ─────────────────────────────────────────────────────────────
  if (type === 'pie') {
    return (
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        {title}
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="45%"
                cy="50%"
                innerRadius={60}
                outerRadius={105}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={{ stroke: '#4a7a96' }}
                stroke="none"
                style={{ fontSize: 10 }}
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
      </div>
    );
  }

  // ── AREA (forecast with scenario bands) ─────────────────────────────────────
  if (type === 'area') {
    // Expect data with: value (base), high, low keys
    return (
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        {title}
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3491E8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3491E8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={tickStyle} tickLine={false} />
              <YAxis tick={tickStyle} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#7eaabf', paddingTop: 8 }} />
              <Area type="monotone" dataKey="high" fill="url(#gradBand)" stroke="#059669" strokeDasharray="4 4" strokeWidth={1} name="High scenario" />
              <Area type="monotone" dataKey="value" fill="url(#gradBase)" stroke="#3491E8" strokeWidth={2.5} name="Base forecast" dot={{ r: 4, fill: '#3491E8' }} />
              <Area type="monotone" dataKey="low" fill="url(#gradBand)" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} name="Low scenario" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── HORIZONTAL BAR ──────────────────────────────────────────────────────────
  if (type === 'horizontal_bar') {
    return (
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        {title}
        <div style={{ width: '100%', height: Math.max(250, data.length * 38) }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid {...gridProps} horizontal={false} />
              <XAxis type="number" tick={tickStyle} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={tickStyle} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Market Share %" radius={[0, 4, 4, 0]} barSize={22}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── LINE ────────────────────────────────────────────────────────────────────
  if (type === 'line') {
    return (
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        {title}
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={tickStyle} tickLine={false} />
              <YAxis tick={tickStyle} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ fill: '#059669', r: 4 }}
                activeDot={{ r: 6, fill: '#22D3EE' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── BAR (default) ───────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      {title}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" tick={tickStyle} tickLine={false} />
            <YAxis tick={tickStyle} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(5,150,105,0.08)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
