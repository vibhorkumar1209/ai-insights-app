'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RevenueDataPoint, MarginDataPoint } from '@ai-insights/types';
import { currencySymbol } from '@/lib/currencySymbol';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  marginData?: MarginDataPoint[];
  currency?: string;
}

function currSym(c?: string): string {
  return currencySymbol(c);
}

function shortRevenue(val: number, c?: string): string {
  const s = currSym(c);
  if (val >= 1e12) return `${s}${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `${s}${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `${s}${(val / 1e6).toFixed(1)}M`;
  return `${s}${val.toLocaleString()}`;
}

export default function RevenueChart({ data, marginData, currency }: RevenueChartProps) {
  interface TooltipPayloadEntry {
    name: string;
    value: number;
    color: string;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: '#EDF4F8', border: '1px solid #CCDFEA',
        borderRadius: 8, padding: '10px 14px', fontSize: 12,
      }}>
        <div style={{ fontWeight: 700, color: '#1B2A3D', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {p.name === 'Revenue' ? shortRevenue(p.value, currency) : `${p.value >= 0 ? '' : ''}${p.value.toFixed(1)}%`}
          </div>
        ))}
      </div>
    );
  };

  // Merge revenue + margin data by year
  const chartData = data.map((r) => {
    const margin = marginData?.find((m) => m.year === r.year);
    return {
      ...r,
      netMargin: margin?.netMargin,
    };
  });

  const hasMargin = chartData.some((d) => d.netMargin != null);

  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: hasMargin ? 50 : 20, left: 10, bottom: 0 }}>
          <CartesianGrid stroke="rgba(30,74,104,0.3)" strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#4A6274', fontSize: 11 }}
            axisLine={{ stroke: '#CCDFEA' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#4A6274', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => shortRevenue(v, currency)}
          />
          {hasMargin && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#F59E0B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              domain={['auto', 'auto']}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#6B7280', paddingTop: 8 }}
          />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name="Revenue"
            fill="#22D3EE"
            radius={[3, 3, 0, 0]}
            opacity={0.85}
          />
          {hasMargin && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="netMargin"
              name="Net Profit Margin %"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: '#F59E0B', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
