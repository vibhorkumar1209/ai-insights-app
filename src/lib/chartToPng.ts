'use client';

import type { ReportChartSpec, ChartDataPoint, ChartSeriesConfig } from './types';

// Renders a ReportChartSpec onto an offscreen <canvas> and returns PNG bytes.
// Pure browser canvas — no external dependencies.

export interface RenderedChart {
  bytes: Uint8Array;
  width: number;
  height: number;
}

const PALETTE = [
  '#3491E8', '#E63946', '#059669', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#10B981',
];

const NAVY = '#0c3649';
const TEXT = '#333333';
const GRID = '#E5E7EB';
const AXIS = '#9CA3AF';

interface Layout {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  plotX: number;
  plotY: number;
  plotW: number;
  plotH: number;
}

function nz(n: number | undefined | null): number {
  return typeof n === 'number' && isFinite(n) ? n : 0;
}

function getNumeric(d: ChartDataPoint, key: string): number {
  const v = d[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[, ]/g, ''));
    return isFinite(n) ? n : 0;
  }
  return 0;
}

function fmtNum(n: number): string {
  if (!isFinite(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  if (abs >= 10) return n.toFixed(0);
  return n.toFixed(1);
}

function niceMax(max: number): number {
  if (max <= 0) return 10;
  const exp = Math.floor(Math.log10(max));
  const f = max / Math.pow(10, exp);
  let nice;
  if (f <= 1) nice = 1;
  else if (f <= 2) nice = 2;
  else if (f <= 5) nice = 5;
  else nice = 10;
  return nice * Math.pow(10, exp);
}

function setupCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = 'middle';
  ctx.font = '12px Arial, sans-serif';
  return { canvas, ctx };
}

function drawTitle(ctx: CanvasRenderingContext2D, w: number, title: string) {
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 22);
  ctx.textAlign = 'start';
}

function drawAxes(L: Layout, yMax: number, xLabels: string[], yLabel?: string, xLabel?: string) {
  const { ctx, plotX, plotY, plotW, plotH } = L;
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;

  // Y axis
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.stroke();
  // X axis
  ctx.beginPath();
  ctx.moveTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  // Y gridlines + labels
  const ticks = 5;
  ctx.fillStyle = TEXT;
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.strokeStyle = GRID;
  for (let i = 0; i <= ticks; i++) {
    const v = (yMax * i) / ticks;
    const y = plotY + plotH - (plotH * i) / ticks;
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(plotX, y);
      ctx.lineTo(plotX + plotW, y);
      ctx.stroke();
    }
    ctx.fillText(fmtNum(v), plotX - 6, y);
  }

  // X labels
  ctx.textAlign = 'center';
  const slot = plotW / Math.max(xLabels.length, 1);
  const maxChars = Math.max(4, Math.floor(slot / 6));
  // Show every nth label if crowded
  const stride = Math.max(1, Math.ceil((xLabels.length * 7) / plotW));
  xLabels.forEach((lbl, i) => {
    if (i % stride !== 0) return;
    const x = plotX + slot * (i + 0.5);
    let s = String(lbl);
    if (s.length > maxChars) s = s.slice(0, maxChars - 1) + '…';
    ctx.fillText(s, x, plotY + plotH + 14);
  });

  // Axis labels
  ctx.fillStyle = '#555';
  ctx.font = '11px Arial, sans-serif';
  if (xLabel) {
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, plotX + plotW / 2, plotY + plotH + 32);
  }
  if (yLabel) {
    ctx.save();
    ctx.translate(14, plotY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
  ctx.textAlign = 'start';
}

function drawLegend(ctx: CanvasRenderingContext2D, w: number, items: { name: string; color: string }[]) {
  if (!items.length) return;
  ctx.font = '11px Arial, sans-serif';
  ctx.textBaseline = 'middle';
  let totalWidth = 0;
  items.forEach((it) => {
    totalWidth += 14 + ctx.measureText(it.name).width + 14;
  });
  let x = (w - totalWidth) / 2;
  const y = 42;
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(x, y - 5, 10, 10);
    x += 14;
    ctx.fillStyle = TEXT;
    ctx.fillText(it.name, x, y);
    x += ctx.measureText(it.name).width + 14;
  });
}

function makeLayout(width: number, height: number, hasLegend: boolean): Layout {
  const { ctx } = setupCanvas(width, height); // throwaway, real created by caller
  void ctx;
  // Real path: caller does setup. This helper only declares plot region.
  const plotX = 56;
  const plotY = hasLegend ? 60 : 44;
  const plotW = width - plotX - 24;
  const plotH = height - plotY - 44;
  // ctx is replaced by caller
  return { ctx: null as unknown as CanvasRenderingContext2D, w: width, h: height, plotX, plotY, plotW, plotH };
}

function getSeries(spec: ReportChartSpec): ChartSeriesConfig[] {
  if (spec.series && spec.series.length) return spec.series;
  // Synthesize a single "value" series
  return [{ key: 'value', name: spec.yLabel || 'Value' }];
}

function maxValue(spec: ReportChartSpec, series: ChartSeriesConfig[]): number {
  let max = 0;
  if (spec.type === 'stacked_bar') {
    spec.data.forEach((d) => {
      const sum = series.reduce((a, s) => a + getNumeric(d, s.key), 0);
      if (sum > max) max = sum;
    });
  } else {
    spec.data.forEach((d) => {
      series.forEach((s) => {
        const v = getNumeric(d, s.key);
        if (v > max) max = v;
      });
    });
  }
  return niceMax(max);
}

function renderBar(spec: ReportChartSpec, horizontal: boolean, width: number, height: number): HTMLCanvasElement {
  const series = getSeries(spec);
  const showLegend = series.length > 1;
  const { canvas, ctx } = setupCanvas(width, height);
  drawTitle(ctx, width, spec.title || '');
  if (showLegend) {
    drawLegend(ctx, width, series.map((s, i) => ({ name: s.name, color: s.color || PALETTE[i % PALETTE.length] })));
  }
  const L = makeLayout(width, height, showLegend);
  L.ctx = ctx;

  if (horizontal) {
    // Swap axes
    const yMax = maxValue(spec, series);
    const { plotX, plotY, plotW, plotH } = L;
    // Y axis = categories, X axis = value
    const slot = plotH / Math.max(spec.data.length, 1);
    // Draw axes
    ctx.strokeStyle = AXIS;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();
    // X gridlines
    ctx.strokeStyle = GRID;
    ctx.fillStyle = TEXT;
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'center';
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const v = (yMax * i) / ticks;
      const x = plotX + (plotW * i) / ticks;
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(x, plotY);
        ctx.lineTo(x, plotY + plotH);
        ctx.stroke();
      }
      ctx.fillText(fmtNum(v), x, plotY + plotH + 14);
    }
    // Category labels & bars
    ctx.textAlign = 'right';
    spec.data.forEach((d, i) => {
      const yCenter = plotY + slot * (i + 0.5);
      let lbl = String(d.label || '');
      if (lbl.length > 12) lbl = lbl.slice(0, 11) + '…';
      ctx.fillStyle = TEXT;
      ctx.fillText(lbl, plotX - 6, yCenter);
      const barH = Math.max(8, slot * 0.6);
      const yTop = yCenter - barH / 2;
      let xCursor = plotX;
      series.forEach((s, si) => {
        const v = getNumeric(d, s.key);
        const w = (v / yMax) * plotW;
        ctx.fillStyle = s.color || PALETTE[si % PALETTE.length];
        const segW = series.length > 1 ? w / series.length : w;
        const segY = series.length > 1 ? yTop + (barH / series.length) * si : yTop;
        const segH = series.length > 1 ? barH / series.length - 1 : barH;
        ctx.fillRect(xCursor, segY, segW, segH);
        if (series.length === 1) {
          ctx.fillStyle = TEXT;
          ctx.textAlign = 'left';
          ctx.font = '10px Arial, sans-serif';
          ctx.fillText(fmtNum(v), xCursor + w + 4, yCenter);
          ctx.textAlign = 'right';
          ctx.font = '11px Arial, sans-serif';
        }
      });
    });
    return canvas;
  }

  const yMax = maxValue(spec, series);
  drawAxes(L, yMax, spec.data.map((d) => String(d.label || '')), spec.yLabel, spec.xLabel);

  const { plotX, plotY, plotW, plotH } = L;
  const slot = plotW / Math.max(spec.data.length, 1);

  if (spec.type === 'stacked_bar') {
    spec.data.forEach((d, i) => {
      const xCenter = plotX + slot * (i + 0.5);
      const barW = Math.max(6, slot * 0.6);
      let yCursor = plotY + plotH;
      series.forEach((s, si) => {
        const v = getNumeric(d, s.key);
        const h = (v / yMax) * plotH;
        ctx.fillStyle = s.color || PALETTE[si % PALETTE.length];
        ctx.fillRect(xCenter - barW / 2, yCursor - h, barW, h);
        yCursor -= h;
      });
    });
  } else {
    // grouped bars
    const groupW = Math.max(6, slot * 0.7);
    const seriesW = groupW / series.length;
    spec.data.forEach((d, i) => {
      const xCenter = plotX + slot * (i + 0.5);
      series.forEach((s, si) => {
        const v = getNumeric(d, s.key);
        const h = (v / yMax) * plotH;
        ctx.fillStyle = s.color || PALETTE[si % PALETTE.length];
        const x = xCenter - groupW / 2 + seriesW * si;
        ctx.fillRect(x, plotY + plotH - h, seriesW - 1, h);
      });
    });
  }
  return canvas;
}

function renderLineOrArea(spec: ReportChartSpec, area: boolean, width: number, height: number): HTMLCanvasElement {
  const series = getSeries(spec);
  const showLegend = series.length > 1;
  const { canvas, ctx } = setupCanvas(width, height);
  drawTitle(ctx, width, spec.title || '');
  if (showLegend) {
    drawLegend(ctx, width, series.map((s, i) => ({ name: s.name, color: s.color || PALETTE[i % PALETTE.length] })));
  }
  const L = makeLayout(width, height, showLegend);
  L.ctx = ctx;
  const yMax = maxValue(spec, series);
  drawAxes(L, yMax, spec.data.map((d) => String(d.label || '')), spec.yLabel, spec.xLabel);

  const { plotX, plotY, plotW, plotH } = L;
  const slot = plotW / Math.max(spec.data.length - 1, 1);

  series.forEach((s, si) => {
    const color = s.color || PALETTE[si % PALETTE.length];
    const points: { x: number; y: number }[] = spec.data.map((d, i) => {
      const v = getNumeric(d, s.key);
      return {
        x: plotX + slot * i,
        y: plotY + plotH - (v / yMax) * plotH,
      };
    });
    if (area) {
      ctx.fillStyle = color + '40';
      ctx.beginPath();
      ctx.moveTo(points[0].x, plotY + plotH);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, plotY + plotH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.fillStyle = color;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  return canvas;
}

function renderCombo(spec: ReportChartSpec, width: number, height: number): HTMLCanvasElement {
  const series = getSeries(spec);
  const { canvas, ctx } = setupCanvas(width, height);
  drawTitle(ctx, width, spec.title || '');
  drawLegend(ctx, width, series.map((s, i) => ({ name: s.name, color: s.color || PALETTE[i % PALETTE.length] })));
  const L = makeLayout(width, height, true);
  L.ctx = ctx;
  const yMax = maxValue(spec, series);
  drawAxes(L, yMax, spec.data.map((d) => String(d.label || '')), spec.yLabel, spec.xLabel);

  const { plotX, plotY, plotW, plotH } = L;
  const slot = plotW / Math.max(spec.data.length, 1);

  // Bars first
  series.forEach((s, si) => {
    if (s.type === 'line') return;
    const color = s.color || PALETTE[si % PALETTE.length];
    const barW = Math.max(6, slot * 0.5);
    spec.data.forEach((d, i) => {
      const v = getNumeric(d, s.key);
      const h = (v / yMax) * plotH;
      const xCenter = plotX + slot * (i + 0.5);
      ctx.fillStyle = color;
      ctx.fillRect(xCenter - barW / 2, plotY + plotH - h, barW, h);
    });
  });
  // Lines
  series.forEach((s, si) => {
    if (s.type !== 'line') return;
    const color = s.color || PALETTE[si % PALETTE.length];
    const points = spec.data.map((d, i) => ({
      x: plotX + slot * (i + 0.5),
      y: plotY + plotH - (getNumeric(d, s.key) / yMax) * plotH,
    }));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.fillStyle = color;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  return canvas;
}

function renderPie(spec: ReportChartSpec, width: number, height: number): HTMLCanvasElement {
  const { canvas, ctx } = setupCanvas(width, height);
  drawTitle(ctx, width, spec.title || '');
  const total = spec.data.reduce((a, d) => a + nz(d.value), 0) || 1;
  const cx = width / 2 - 60;
  const cy = height / 2 + 10;
  const r = Math.min(width - 200, height - 80) / 2;

  let start = -Math.PI / 2;
  spec.data.forEach((d, i) => {
    const slice = (nz(d.value) / total) * Math.PI * 2;
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fill();
    start += slice;
  });
  // Legend on the right
  ctx.font = '11px Arial, sans-serif';
  ctx.textBaseline = 'middle';
  const legendX = cx + r + 24;
  let legendY = cy - (spec.data.length * 16) / 2;
  spec.data.forEach((d, i) => {
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fillRect(legendX, legendY - 5, 10, 10);
    ctx.fillStyle = TEXT;
    const pct = ((nz(d.value) / total) * 100).toFixed(1);
    let lbl = String(d.label || '');
    if (lbl.length > 18) lbl = lbl.slice(0, 17) + '…';
    ctx.fillText(`${lbl} (${pct}%)`, legendX + 14, legendY);
    legendY += 16;
  });
  return canvas;
}

function renderScatter(spec: ReportChartSpec, width: number, height: number): HTMLCanvasElement {
  const series = getSeries(spec);
  const { canvas, ctx } = setupCanvas(width, height);
  drawTitle(ctx, width, spec.title || '');
  if (series.length > 1) {
    drawLegend(ctx, width, series.map((s, i) => ({ name: s.name, color: s.color || PALETTE[i % PALETTE.length] })));
  }
  const L = makeLayout(width, height, series.length > 1);
  L.ctx = ctx;
  const yMax = maxValue(spec, series);
  drawAxes(L, yMax, spec.data.map((d) => String(d.label || '')), spec.yLabel, spec.xLabel);
  const { plotX, plotY, plotW, plotH } = L;
  const slot = plotW / Math.max(spec.data.length, 1);
  series.forEach((s, si) => {
    const color = s.color || PALETTE[si % PALETTE.length];
    spec.data.forEach((d, i) => {
      const v = getNumeric(d, s.key);
      const x = plotX + slot * (i + 0.5);
      const y = plotY + plotH - (v / yMax) * plotH;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  return canvas;
}

export async function renderChartToPng(
  spec: ReportChartSpec,
  width = 720,
  height = 420
): Promise<RenderedChart | null> {
  if (typeof document === 'undefined') return null;
  if (!spec || !spec.data?.length) return null;

  let canvas: HTMLCanvasElement;
  switch (spec.type) {
    case 'pie':
      canvas = renderPie(spec, width, height);
      break;
    case 'line':
      canvas = renderLineOrArea(spec, false, width, height);
      break;
    case 'area':
      canvas = renderLineOrArea(spec, true, width, height);
      break;
    case 'horizontal_bar':
      canvas = renderBar(spec, true, width, height);
      break;
    case 'combo':
      canvas = renderCombo(spec, width, height);
      break;
    case 'scatter':
      canvas = renderScatter(spec, width, height);
      break;
    case 'stacked_bar':
    case 'bar':
    default:
      canvas = renderBar(spec, false, width, height);
      break;
  }

  // Canvas → PNG bytes
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, width, height };
}
