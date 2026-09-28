// Display formatting for spend figures.
//
// The API returns every spend value as raw USD millions — a Level-3 line item for a
// small company can legitimately be 0.0004 (i.e. $400). Formatting those naively as
// millions printed "$0.0M", and even a K-suffixed `(value * 1000).toFixed(0)` printed
// "$0K", which reads as "nothing here" for a figure that is genuinely non-zero. So
// each value is shown in the largest unit where it still has significant digits, down
// to whole dollars, and only an exact zero ever prints as $0.

/** Formats a USD-million figure: $B ≥ $1B · $M ≥ $1M · $K ≥ $1K · whole dollars below that. */
export function formatUsdMillion(usdMillion: number): string {
  if (!isFinite(usdMillion)) return '—';
  const sign = usdMillion < 0 ? '-' : '';
  const abs = Math.abs(usdMillion);

  if (abs === 0) return '$0';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}B`;
  if (abs >= 10) return `${sign}$${Math.round(abs).toLocaleString('en-US')}M`;
  // 0.9995 and up rounds to "1.0M" — below that it would print as "$1,000K".
  if (abs >= 0.9995) return `${sign}$${abs.toFixed(1)}M`;

  const thousands = abs * 1000;
  if (thousands >= 1) return `${sign}$${Math.round(thousands).toLocaleString('en-US')}K`;

  const dollars = Math.round(thousands * 1000);
  // Sub-dollar but non-zero: say so rather than printing a rounded-down $0.
  if (dollars === 0) return `${sign}<$1`;
  return `${sign}$${dollars.toLocaleString('en-US')}`;
}

/** Formats a share-of-budget percentage, keeping small slices visible instead of "0.0%". */
export function formatSharePct(pct: number): string {
  if (!isFinite(pct)) return '—';
  const abs = Math.abs(pct);
  if (abs === 0) return '0%';
  if (abs >= 0.1) return `${pct.toFixed(1)}%`;
  if (abs >= 0.01) return `${pct.toFixed(2)}%`;
  return pct < 0 ? '>-0.01%' : '<0.01%';
}
