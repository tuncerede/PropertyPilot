import {
  formatCurrencyInput,
  inputTextToPercent,
  parseNumericText,
  percentToInputText,
  sanitizeNumericText,
  withThousandsSeparators,
} from '@/lib/formatting/input';

describe('sanitizeNumericText', () => {
  it('strips characters that cannot appear in a number', () => {
    expect(sanitizeNumericText('$1,250.50abc')).toBe('1250.50');
  });

  it('keeps only the first decimal point', () => {
    expect(sanitizeNumericText('12.34.56')).toBe('12.3456');
  });

  it('drops minus signs unless negatives are allowed', () => {
    expect(sanitizeNumericText('-125')).toBe('125');
    expect(sanitizeNumericText('-125', true)).toBe('-125');
  });

  it('keeps a minus sign only in the leading position', () => {
    expect(sanitizeNumericText('12-5', true)).toBe('125');
  });

  it('allows partial input while typing', () => {
    expect(sanitizeNumericText('12.')).toBe('12.');
    expect(sanitizeNumericText('')).toBe('');
  });
});

describe('parseNumericText', () => {
  it('parses plain and decorated numbers', () => {
    expect(parseNumericText('125000')).toBe(125_000);
    expect(parseNumericText('$125,000')).toBe(125_000);
    expect(parseNumericText('5.5%')).toBe(5.5);
  });

  it('returns null for empty or partial input instead of NaN', () => {
    expect(parseNumericText('')).toBeNull();
    expect(parseNumericText('   ')).toBeNull();
    expect(parseNumericText('-')).toBeNull();
    expect(parseNumericText('.')).toBeNull();
  });

  it('returns null for unparseable text', () => {
    expect(parseNumericText('abc')).toBeNull();
  });

  it('parses negatives', () => {
    expect(parseNumericText('-127')).toBe(-127);
  });
});

describe('withThousandsSeparators', () => {
  it('groups the whole part only', () => {
    expect(withThousandsSeparators('1250000.55')).toBe('1,250,000.55');
  });

  it('preserves a trailing decimal point while typing', () => {
    expect(withThousandsSeparators('1250.')).toBe('1,250.');
  });

  it('handles negatives and empty strings', () => {
    expect(withThousandsSeparators('-1250')).toBe('-1,250');
    expect(withThousandsSeparators('')).toBe('');
  });
});

describe('formatCurrencyInput', () => {
  it('renders whole numbers without decimals', () => {
    expect(formatCurrencyInput(125_000)).toBe('125,000');
  });

  it('renders cents when present', () => {
    expect(formatCurrencyInput(15_248.89)).toBe('15,248.89');
  });

  it('renders an empty string for missing values', () => {
    expect(formatCurrencyInput(null)).toBe('');
    expect(formatCurrencyInput(Number.NaN)).toBe('');
  });
});

describe('percent conversions', () => {
  it('shows a decimal fraction as whole percent for editing', () => {
    expect(percentToInputText(0.055)).toBe('5.5');
    expect(percentToInputText(0.03)).toBe('3');
  });

  it('converts typed whole percent back to a decimal fraction', () => {
    expect(inputTextToPercent('5.5')).toBeCloseTo(0.055, 10);
    expect(inputTextToPercent('')).toBeNull();
  });

  it('round-trips without drift', () => {
    expect(inputTextToPercent(percentToInputText(0.0725))).toBeCloseTo(0.0725, 10);
  });
});
