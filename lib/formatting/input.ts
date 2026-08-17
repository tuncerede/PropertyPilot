/**
 * Helpers for numeric text inputs.
 *
 * The rule for financial forms: format on blur, never on every keystroke.
 * Re-formatting mid-typing is what causes the cursor to jump to the end and
 * makes deleting a digit feel broken, so while a field is focused we keep the
 * user's raw text and only sanitise obviously-invalid characters.
 */

/** Strip everything that cannot appear in a decimal number the user is typing. */
export function sanitizeNumericText(text: string, allowNegative = false): string {
  const cleaned = text.replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, '');

  // Keep only the first decimal point.
  const [whole = '', ...rest] = cleaned.split('.');
  const withSingleDot = rest.length > 0 ? `${whole}.${rest.join('')}` : whole;

  if (!allowNegative) return withSingleDot;

  // Keep a minus sign only in the leading position.
  const isNegative = withSingleDot.startsWith('-');
  return (isNegative ? '-' : '') + withSingleDot.replace(/-/g, '');
}

/**
 * Parse user text into a number. Returns null for empty or partial input
 * ("", "-", ".") so a form can stay valid while the user is mid-keystroke.
 */
export function parseNumericText(text: string): number | null {
  const trimmed = text.trim().replace(/[$,%\s]/g, '');
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Add thousands separators to the whole part, preserving what was typed. */
export function withThousandsSeparators(text: string): string {
  if (!text) return text;
  const isNegative = text.startsWith('-');
  const body = isNegative ? text.slice(1) : text;
  const [whole = '', fraction] = body.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const joined = fraction !== undefined ? `${grouped}.${fraction}` : grouped;
  return isNegative ? `-${joined}` : joined;
}

/** Display value for a currency field that is NOT focused. */
export function formatCurrencyInput(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return withThousandsSeparators(text);
}

/** Display value for a currency field that IS focused (no separators). */
export function toEditableNumberText(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * Percent fields are edited in whole percent ("5.5") but stored as decimal
 * fractions (0.055). These two functions are the only place that conversion
 * happens.
 */
export function percentToInputText(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  const asPercent = Math.round(value * 100 * 1000) / 1000;
  return String(asPercent);
}

export function inputTextToPercent(text: string): number | null {
  const parsed = parseNumericText(text);
  if (parsed === null) return null;
  return parsed / 100;
}
