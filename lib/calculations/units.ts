/**
 * Shared numeric helpers for the calculation engine.
 *
 * See `types/property.ts` for the units convention. In short: money is in
 * dollars, rates are decimal fractions (0.05 === 5%).
 *
 * Everything here is pure and side-effect free.
 */

export const MONTHS_PER_YEAR = 12;

/** Coerce anything unexpected (NaN, Infinity, null, undefined) to a fallback. */
export function finiteOr(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Coerce to a finite number, defaulting to 0. Used at every engine boundary. */
export function num(value: number | null | undefined): number {
  return finiteOr(value, 0);
}

/**
 * Division that refuses to produce NaN or Infinity.
 * Returns null when the denominator is 0 (or not finite), so callers must
 * decide how to present "not available" rather than rendering garbage.
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function annualToMonthly(annualAmount: number): number {
  return num(annualAmount) / MONTHS_PER_YEAR;
}

export function monthlyToAnnual(monthlyAmount: number): number {
  return num(monthlyAmount) * MONTHS_PER_YEAR;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Compound growth: `base * (1 + rate) ^ periods`.
 * A rate of -1 or lower is clamped to -0.99 so the result stays finite.
 */
export function compound(base: number, rate: number, periods: number): number {
  const safeRate = Math.max(num(rate), -0.99);
  const result = num(base) * Math.pow(1 + safeRate, num(periods));
  return Number.isFinite(result) ? result : 0;
}

/** Round to a fixed number of decimal places without float artefacts. */
export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Round to whole cents. Applied to money that is summed and displayed. */
export function roundCurrency(value: number): number {
  return roundTo(value, 2);
}
