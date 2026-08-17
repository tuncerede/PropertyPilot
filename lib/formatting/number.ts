/**
 * Every number the user sees passes through this module.
 *
 * Rules enforced here so no screen has to think about them:
 *   - `NaN`, `Infinity`, `null` and `undefined` never reach the UI. They
 *     render as an em dash placeholder.
 *   - Currency is whole dollars by default; cents only where asked for.
 *   - Percentages take DECIMAL FRACTIONS (0.054 renders as "5.4%").
 */

export const NOT_AVAILABLE = '—';

function isRenderable(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export interface CurrencyOptions {
  /** Show cents. Default false. */
  decimals?: boolean;
  /** Always show a leading + or -. Default false. */
  signed?: boolean;
  /** Placeholder for unavailable values. Default "—". */
  fallback?: string;
}

/** `125000` → `"$125,000"`; `-127.5` with signed → `"-$128"`. */
export function formatCurrency(
  value: number | null | undefined,
  options: CurrencyOptions = {},
): string {
  const { decimals = false, signed = false, fallback = NOT_AVAILABLE } = options;
  if (!isRenderable(value)) return fallback;

  const fractionDigits = decimals ? 2 : 0;
  const magnitude = Math.abs(value);
  const formatted = magnitude.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  // Round-to-zero should not render as "-$0".
  const rounded = Number(magnitude.toFixed(fractionDigits));
  const isNegative = value < 0 && rounded !== 0;

  if (isNegative) return `-${formatted}`;
  if (signed && rounded !== 0) return `+${formatted}`;
  return formatted;
}

/** `318` → `"+$318/mo"`, `-127` → `"-$127/mo"`. */
export function formatCurrencyPerMonth(
  value: number | null | undefined,
  options: CurrencyOptions = {},
): string {
  const fallback = options.fallback ?? NOT_AVAILABLE;
  if (!isRenderable(value)) return fallback;
  return `${formatCurrency(value, { signed: true, ...options })}/mo`;
}

/** `1250000` → `"$1.25M"`. Used for tight portfolio headers only. */
export function formatCompactCurrency(
  value: number | null | undefined,
  fallback = NOT_AVAILABLE,
): string {
  if (!isRenderable(value)) return fallback;

  const magnitude = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (magnitude >= 1_000_000) return `${sign}$${(magnitude / 1_000_000).toFixed(2)}M`;
  if (magnitude >= 100_000) return `${sign}$${Math.round(magnitude / 1_000)}K`;
  return formatCurrency(value, { fallback });
}

export interface PercentOptions {
  /** Decimal places. Default 1. */
  decimals?: number;
  signed?: boolean;
  fallback?: string;
}

/** Takes a DECIMAL FRACTION: `0.054` → `"5.4%"`. */
export function formatPercent(
  value: number | null | undefined,
  options: PercentOptions = {},
): string {
  const { decimals = 1, signed = false, fallback = NOT_AVAILABLE } = options;
  if (!isRenderable(value)) return fallback;

  const asPercent = value * 100;
  const rounded = Number(asPercent.toFixed(decimals));
  const body = `${Math.abs(rounded).toFixed(decimals)}%`;

  if (rounded < 0) return `-${body}`;
  if (signed && rounded !== 0) return `+${body}`;
  return body;
}

/** `2` → `"2.00x"`. Used for debt service coverage. */
export function formatRatio(value: number | null | undefined, fallback = NOT_AVAILABLE): string {
  if (!isRenderable(value)) return fallback;
  return `${value.toFixed(2)}x`;
}

export function formatInteger(value: number | null | undefined, fallback = NOT_AVAILABLE): string {
  if (!isRenderable(value)) return fallback;
  return Math.round(value).toLocaleString('en-US');
}

/** `3` of `4` → `"3 of 4 occupied"`. */
export function formatOccupancy(occupied: number, total: number): string {
  if (!Number.isFinite(occupied) || !Number.isFinite(total) || total <= 0) return NOT_AVAILABLE;
  return `${Math.round(occupied)} of ${Math.round(total)}`;
}

/** ISO date → `"Mar 2019"`. Returns the placeholder for missing/invalid dates. */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return NOT_AVAILABLE;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** ISO date → `"Mar 14, 2019"`. */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return NOT_AVAILABLE;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** `"Duplex · Erie, PA"` from parts, skipping blanks. */
export function joinParts(parts: (string | null | undefined)[], separator = ' · '): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(separator);
}
