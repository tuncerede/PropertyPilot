import {
  formatCompactCurrency,
  formatCurrency,
  formatCurrencyPerMonth,
  formatInteger,
  formatOccupancy,
  formatPercent,
  formatRatio,
  joinParts,
  NOT_AVAILABLE,
} from '@/lib/formatting/number';

describe('formatCurrency', () => {
  it('formats whole dollars with separators', () => {
    expect(formatCurrency(125_000)).toBe('$125,000');
  });

  it('rounds to the nearest dollar by default', () => {
    expect(formatCurrency(318.0033333)).toBe('$318');
  });

  it('shows cents when asked', () => {
    expect(formatCurrency(15_248.891, { decimals: true })).toBe('$15,248.89');
  });

  it('places the minus sign outside the currency symbol', () => {
    expect(formatCurrency(-127)).toBe('-$127');
  });

  it('adds a plus sign only when signed and non-zero', () => {
    expect(formatCurrency(318, { signed: true })).toBe('+$318');
    expect(formatCurrency(0, { signed: true })).toBe('$0');
  });

  it('never renders a negative zero', () => {
    expect(formatCurrency(-0.2)).toBe('$0');
  });

  it('renders a placeholder rather than NaN, Infinity, null or undefined', () => {
    expect(formatCurrency(Number.NaN)).toBe(NOT_AVAILABLE);
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe(NOT_AVAILABLE);
    expect(formatCurrency(null)).toBe(NOT_AVAILABLE);
    expect(formatCurrency(undefined)).toBe(NOT_AVAILABLE);
  });

  it('accepts a custom fallback', () => {
    expect(formatCurrency(null, { fallback: 'Not set' })).toBe('Not set');
  });
});

describe('formatCurrencyPerMonth', () => {
  it('always shows the sign', () => {
    expect(formatCurrencyPerMonth(318)).toBe('+$318/mo');
    expect(formatCurrencyPerMonth(-127)).toBe('-$127/mo');
  });

  it('renders a placeholder for unavailable values', () => {
    expect(formatCurrencyPerMonth(null)).toBe(NOT_AVAILABLE);
  });
});

describe('formatCompactCurrency', () => {
  it('abbreviates millions and hundreds of thousands', () => {
    expect(formatCompactCurrency(1_250_000)).toBe('$1.25M');
    expect(formatCompactCurrency(740_000)).toBe('$740K');
  });

  it('leaves smaller amounts in full', () => {
    expect(formatCompactCurrency(71_400)).toBe('$71,400');
  });

  it('handles negatives', () => {
    expect(formatCompactCurrency(-1_500_000)).toBe('-$1.50M');
  });
});

describe('formatPercent', () => {
  it('converts a decimal fraction to a percentage string', () => {
    expect(formatPercent(0.054)).toBe('5.4%');
  });

  it('does not leak floating point noise', () => {
    expect(formatPercent(0.05399999999)).toBe('5.4%');
  });

  it('honours a decimals option', () => {
    expect(formatPercent(0.09752, { decimals: 2 })).toBe('9.75%');
    expect(formatPercent(0.03, { decimals: 0 })).toBe('3%');
  });

  it('formats negatives and signed values', () => {
    expect(formatPercent(-0.021)).toBe('-2.1%');
    expect(formatPercent(0.021, { signed: true })).toBe('+2.1%');
  });

  it('renders a placeholder for unavailable values', () => {
    expect(formatPercent(null)).toBe(NOT_AVAILABLE);
    expect(formatPercent(Number.NaN)).toBe(NOT_AVAILABLE);
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe(NOT_AVAILABLE);
  });
});

describe('miscellaneous formatters', () => {
  it('formats ratios', () => {
    expect(formatRatio(1.4567)).toBe('1.46x');
    expect(formatRatio(null)).toBe(NOT_AVAILABLE);
  });

  it('formats integers with separators', () => {
    expect(formatInteger(1234)).toBe('1,234');
    expect(formatInteger(null)).toBe(NOT_AVAILABLE);
  });

  it('formats occupancy', () => {
    expect(formatOccupancy(3, 4)).toBe('3 of 4');
    expect(formatOccupancy(0, 0)).toBe(NOT_AVAILABLE);
  });

  it('joins parts and skips blanks', () => {
    expect(joinParts(['Duplex', '', null, 'Erie, PA'])).toBe('Duplex · Erie, PA');
  });
});
