'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Area, AreaChart,
  ScatterChart, Scatter, ZAxis, ReferenceLine, LabelList,
} from 'recharts';
import { ReportChartSpec, ChartSeriesConfig } from '@/lib/types';

// ── Refined colour palette (dark-navy friendly) ─────────────────────────────
const COLORS = [
  '#3491E8', // primary blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#E63946', // rose
  '#22D3EE', // sky
  '#059669', // green
  '#EC4899', // pink
  '#A78BFA', // light violet
];

const PIE_COLORS = [
  '#3491E8', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4',
  '#E63946', '#22D3EE', '#059669', '#EC4899', '#A78BFA',
];

interface ReportChartProps {
  chartSpec: ReportChartSpec;
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(8,15,22,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(52,145,232,0.3)',
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      minWidth: 140,
    }}>
      <div style={{ fontWeight: 700, color: '#E8EDF5', marginBottom: 6, fontSize: 13, borderBottom: '1px solid rgba(52,145,232,0.15)', paddingBottom: 6 }}>
        {label}
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || '#C4D4DE', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: '#9CB8C8' }}>{p.name}</span>
          </div>
          <span style={{ fontWeight: 700, color: '#E8EDF5', fontVariantNumeric: 'tabular-nums' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Custom Pie Tooltip ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'rgba(8,15,22,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(52,145,232,0.3)',
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.payload?.fill || d.color, display: 'inline-block' }} />
        <span style={{ fontWeight: 700, color: '#E8EDF5' }}>{d.name}</span>
      </div>
      <div style={{ marginTop: 6, color: '#9CB8C8' }}>
        Share: <span style={{ fontWeight: 700, color: '#E8EDF5' }}>{typeof d.value === 'number' ? d.value.toFixed(1) : d.value}%</span>
      </div>
    </div>
  );
}

// ── Bar value labels ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarValueLabel(props: any) {
  const { x, y, width, value } = props;
  if (value == null || value === 0) return null;
  const formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}K` :
                    value >= 1 ? value.toFixed(value % 1 === 0 ? 0 : 1) :
                    value.toFixed(2);
  return (
    <text x={x + width / 2} y={y - 6} fill="#9CB8C8" fontSize={9} fontWeight={600} textAnchor="middle">
      {formatted}
    </text>
  );
}

// ── Shared styles ───────────────────────────────────────────────────────────
const gridProps = { stroke: 'rgba(30,74,104,0.25)', strokeDasharray: '3 3' as const };
const tickStyle = { fill: '#6B8FA5', fontSize: 11, fontWeight: 500 as const };
const rightTickStyle = { fill: '#F59E0B', fontSize: 11, fontWeight: 500 as const };
const legendStyle = { fontSize: 11, color: '#6B8FA5', paddingTop: 10 };

function seriesColor(s: ChartSeriesConfig, i: number): string {
  return s.color || COLORS[i % COLORS.length];
}

// ── Chart wrapper with title ────────────────────────────────────────────────
function ChartWrapper({ title, height, children }: { title?: string; height: number; children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 20,
      marginBottom: 12,
      background: 'rgba(8,15,22,0.4)',
      border: '1px solid rgba(30,74,104,0.25)',
      borderRadius: 12,
      padding: '16px 16px 8px',
    }}>
      {title && (
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#22D3EE',
          marginBottom: 14,
          letterSpacing: 0.2,
          lineHeight: 1.4,
        }}>
          {title}
        </div>
      )}
      <div style={{ width: '100%', height: `${height}px`, minHeight: `${height}px`, position: 'relative', overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLegendValue(value: string) {
  return <span style={{ color: '#9CB8C8', fontSize: 11 }}>{value}</span>;
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ReportChart({ chartSpec }: ReportChartProps) {
  if (!chartSpec?.data?.length) return null;

  const { type, series } = chartSpec;

  // Map data: use 'name' as the category key
  const data = chartSpec.data.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point: Record<string, any> = { name: d.label, value: d.value };
    for (const key of Object.keys(d)) {
      if (key !== 'label') point[key] = d[key];
    }
    return point;
  });

  // ── COMBO: Column + Line (dual Y-axis) ──────────────────────────────────
  if (type === 'combo' && series?.length) {
    const barSeries = series.filter((s) => (s.type || 'bar') === 'bar');
    const lineSeries = series.filter((s) => s.type === 'line');
    const hasRightAxis = series.some((s) => s.yAxisId === 'right');
    const isPercentRight = (chartSpec.yRightLabel || '').match(/%|CAGR|Growth|Margin/i);
    const barWidth = Math.max(24, Math.min(50, 400 / data.length));

    return (
      <ChartWrapper title={chartSpec.title} height={340}>
        <ComposedChart data={data} margin={{ top: 20, right: hasRightAxis ? 60 : 24, left: 12, bottom: 4 }}>
          <defs>
            {barSeries.map((s, i) => (
              <linearGradient key={s.key} id={`barGrad_${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesColor(s, i)} stopOpacity={0.95} />
                <stop offset="100%" stopColor={seriesColor(s, i)} stopOpacity={0.65} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="name"
            tick={tickStyle}
            axisLine={{ stroke: 'rgba(30,74,104,0.4)' }}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            yAxisId="left"
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            tickMargin={4}
            label={chartSpec.yLabel ? { value: chartSpec.yLabel, angle: -90, position: 'insideLeft', fill: '#6B8FA5', fontSize: 10, dy: 40 } : undefined}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={rightTickStyle}
              axisLine={false}
              tickLine={false}
              tickMargin={4}
              tickFormatter={isPercentRight ? (v: number) => `${v}%` : undefined}
              label={chartSpec.yRightLabel ? { value: chartSpec.yRightLabel, angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 10, dy: -30 } : undefined}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={legendStyle} formatter={renderLegendValue} />
          {barSeries.map((s, i) => (
            <Bar
              key={s.key}
              yAxisId={s.yAxisId || 'left'}
              dataKey={s.key}
              name={s.name}
              fill={`url(#barGrad_${s.key})`}
              radius={[5, 5, 0, 0]}
              barSize={barWidth}
              label={barSeries.length === 1 ? <BarValueLabel /> : undefined}
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
              dot={{ fill: seriesColor(s, barSeries.length + i), r: 4, strokeWidth: 2, stroke: '#080f16' }}
              activeDot={{ r: 7, fill: seriesColor(s, barSeries.length + i), stroke: '#080f16', strokeWidth: 2 }}
            />
          ))}
        </ComposedChart>
      </ChartWrapper>
    );
  }

  // ── STACKED BAR (+ optional trend line) ─────────────────────────────────
  if (type === 'stacked_bar' && series?.length) {
    const barSeries = series.filter((s) => (s.type || 'bar') === 'bar');
    const lineSeries = series.filter((s) => s.type === 'line');
    const hasRightAxis = lineSeries.some((s) => s.yAxisId === 'right');
    const barWidth = Math.max(28, Math.min(55, 420 / data.length));

    return (
      <ChartWrapper title={chartSpec.title} height={360}>
        <ComposedChart data={data} margin={{ top: 20, right: hasRightAxis ? 60 : 24, left: 12, bottom: 4 }}>
          <defs>
            {barSeries.map((s, i) => (
              <linearGradient key={s.key} id={`stackGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesColor(s, i)} stopOpacity={0.9} />
                <stop offset="100%" stopColor={seriesColor(s, i)} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" tick={tickStyle} axisLine={{ stroke: 'rgba(30,74,104,0.4)' }} tickLine={false} tickMargin={8} />
          <YAxis
            yAxisId="left"
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            label={chartSpec.yLabel ? { value: chartSpec.yLabel, angle: -90, position: 'insideLeft', fill: '#6B8FA5', fontSize: 10, dy: 40 } : undefined}
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
          <Legend wrapperStyle={legendStyle} formatter={renderLegendValue} />
          {barSeries.map((s, i) => (
            <Bar
              key={s.key}
              yAxisId={s.yAxisId || 'left'}
              dataKey={s.key}
              name={s.name}
              stackId={s.stack || 'stack'}
              fill={`url(#stackGrad_${i})`}
              radius={i === barSeries.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]}
              barSize={barWidth}
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
              dot={{ fill: seriesColor(s, barSeries.length + i), r: 4, strokeWidth: 2, stroke: '#080f16' }}
              activeDot={{ r: 7, fill: seriesColor(s, barSeries.length + i), stroke: '#080f16', strokeWidth: 2 }}
            />
          ))}
        </ComposedChart>
      </ChartWrapper>
    );
  }

  // ── PIE / DONUT ───────────────────────────────────────────────────────────
  if (type === 'pie') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderPieLabel = ({ cx, cy, midAngle, outerRadius, value, percent }: any) => {
      if (percent < 0.05) return null;
      const RADIAN = Math.PI / 180;
      const radius = outerRadius + 14;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      return (
        <text x={x} y={y} fill="#C4D4DE" textAnchor={x > cx ? 'start' : 'end'} fontSize={11} fontWeight={600}>
          {typeof value === 'number' ? value.toFixed(1) : value}%
        </text>
      );
    };

    return (
      <ChartWrapper title={chartSpec.title} height={340}>
        <PieChart>
          <defs>
            {data.map((_, i) => (
              <linearGradient key={i} id={`pieGrad_${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={0.95} />
                <stop offset="100%" stopColor={PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius={55}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={renderPieLabel}
            labelLine={{ stroke: '#3a6a82', strokeWidth: 1 }}
            stroke="rgba(8,15,22,0.6)"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#pieGrad_${i})`} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 11, color: '#6B8FA5', paddingLeft: 12, lineHeight: '22px' }}
            formatter={(value: string) => <span style={{ color: '#C4D4DE', fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ChartWrapper>
    );
  }

  // ── AREA (forecast with scenario bands) ───────────────────────────────────
  if (type === 'area') {
    return (
      <ChartWrapper title={chartSpec.title} height={340}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 12, bottom: 4 }}>
          <defs>
            <linearGradient id="areaGradBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3491E8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3491E8" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="areaGradHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="areaGradLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" tick={tickStyle} tickLine={false} tickMargin={8} />
          <YAxis tick={tickStyle} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={legendStyle} formatter={renderLegendValue} />
          <Area type="monotone" dataKey="high" fill="url(#areaGradHigh)" stroke="#10B981" strokeDasharray="5 4" strokeWidth={1.5} name="High scenario" />
          <Area type="monotone" dataKey="value" fill="url(#areaGradBase)" stroke="#3491E8" strokeWidth={2.5} name="Base forecast" dot={{ r: 4, fill: '#3491E8', stroke: '#080f16', strokeWidth: 2 }} />
          <Area type="monotone" dataKey="low" fill="url(#areaGradLow)" stroke="#F59E0B" strokeDasharray="5 4" strokeWidth={1.5} name="Low scenario" />
        </AreaChart>
      </ChartWrapper>
    );
  }

  // ── HORIZONTAL BAR ────────────────────────────────────────────────────────
  if (type === 'horizontal_bar') {
    const chartHeight = Math.max(260, data.length * 46);
    return (
      <ChartWrapper title={chartSpec.title} height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 40, left: 12, bottom: 4 }}>
          <defs>
            {data.map((_, i) => (
              <linearGradient key={i} id={`hbarGrad_${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.7} />
                <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.95} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} horizontal={false} />
          <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={{ stroke: 'rgba(30,74,104,0.4)' }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#C4D4DE', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name={chartSpec.yLabel || 'Value'} radius={[0, 6, 6, 0]} barSize={26}>
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#hbarGrad_${i})`} />
            ))}
          </Bar>
        </BarChart>
      </ChartWrapper>
    );
  }

  // ── SCATTER / BCG MATRIX ─────────────────────────────────────────────────
  if (type === 'scatter') {
    const QUADRANT_COLORS: Record<string, string> = {
      star: '#10B981',
      cash_cow: '#3491E8',
      question_mark: '#F59E0B',
      dog: '#E63946',
    };
    const QUADRANT_LABELS: Record<string, string> = {
      star: 'Stars',
      cash_cow: 'Cash Cows',
      question_mark: 'Question Marks',
      dog: 'Dogs',
    };

    // Group data by quadrant for coloring
    const quadrants = ['star', 'cash_cow', 'question_mark', 'dog'];
    const grouped = quadrants.map((q) => ({
      quadrant: q,
      data: data.filter((d) => d.category === q).map((d) => ({ ...d, z: 80 })),
    })).filter((g) => g.data.length > 0);

    // Calculate midpoints for reference lines
    const allX = data.map((d) => d.value || 0);
    const allY = data.map((d) => (d as Record<string, unknown>).growth as number || 0);
    const midX = (Math.min(...allX) + Math.max(...allX)) / 2;
    const midY = (Math.min(...allY) + Math.max(...allY)) / 2;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ScatterLabel = (props: any) => {
      const { x, y, value: labelVal } = props;
      if (!labelVal) return null;
      return (
        <text x={x} y={y - 12} textAnchor="middle" fill="#C4D4DE" fontSize={9} fontWeight={600}>
          {String(labelVal).length > 12 ? String(labelVal).slice(0, 11) + '...' : labelVal}
        </text>
      );
    };

    return (
      <ChartWrapper title={chartSpec.title} height={400}>
        <ScatterChart margin={{ top: 30, right: 40, left: 20, bottom: 20 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            type="number"
            dataKey="value"
            name={chartSpec.xLabel || 'Market Size'}
            tick={tickStyle}
            tickLine={false}
            label={{ value: chartSpec.xLabel || 'Market Size', position: 'bottom', fill: '#6B8FA5', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="growth"
            name={chartSpec.yLabel || 'Growth Rate %'}
            tick={tickStyle}
            tickLine={false}
            label={{ value: chartSpec.yLabel || 'Growth Rate %', angle: -90, position: 'insideLeft', fill: '#6B8FA5', fontSize: 10, dy: 40 }}
          />
          <ZAxis type="number" dataKey="z" range={[200, 200]} />
          <ReferenceLine x={midX} stroke="rgba(52,145,232,0.3)" strokeDasharray="5 5" />
          <ReferenceLine y={midY} stroke="rgba(52,145,232,0.3)" strokeDasharray="5 5" />
          <Tooltip content={<CustomTooltip />} />
          {grouped.map((g) => (
            <Scatter
              key={g.quadrant}
              name={QUADRANT_LABELS[g.quadrant] || g.quadrant}
              data={g.data}
              fill={QUADRANT_COLORS[g.quadrant] || '#3491E8'}
            >
              <LabelList dataKey="name" content={<ScatterLabel />} />
            </Scatter>
          ))}
          <Legend wrapperStyle={legendStyle} formatter={renderLegendValue} />
        </ScatterChart>
      </ChartWrapper>
    );
  }

  // ── LINE ──────────────────────────────────────────────────────────────────
  if (type === 'line') {
    return (
      <ChartWrapper title={chartSpec.title} height={320}>
        <LineChart data={data} margin={{ top: 20, right: 24, left: 12, bottom: 4 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3491E8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3491E8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" tick={tickStyle} tickLine={false} tickMargin={8} />
          <YAxis tick={tickStyle} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3491E8"
            strokeWidth={2.5}
            dot={{ fill: '#3491E8', r: 4, strokeWidth: 2, stroke: '#080f16' }}
            activeDot={{ r: 7, fill: '#22D3EE', stroke: '#080f16', strokeWidth: 2 }}
          />
        </LineChart>
      </ChartWrapper>
    );
  }

  // ── BAR (default) ─────────────────────────────────────────────────────────
  const barWidth = Math.max(28, Math.min(55, 420 / data.length));
  return (
    <ChartWrapper title={chartSpec.title} height={320}>
      <BarChart data={data} margin={{ top: 24, right: 24, left: 12, bottom: 4 }}>
        <defs>
          {data.map((_, i) => (
            <linearGradient key={i} id={`defBarGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.95} />
              <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" tick={tickStyle} tickLine={false} tickMargin={8} />
        <YAxis tick={tickStyle} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(52,145,232,0.06)' }} />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={barWidth} label={<BarValueLabel />}>
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#defBarGrad_${i})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  );
}
