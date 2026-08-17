import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { typography } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';

export type TextVariant = keyof typeof typography;
export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'brand'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'info';

export interface AppTextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  /** Render numbers with tabular figures so columns line up. */
  tabular?: boolean;
}

/**
 * The only text primitive in the app. Centralising it is what keeps type
 * scale, colour tones and number alignment consistent across every screen.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  align,
  tabular = false,
  style,
  ...rest
}: AppTextProps) {
  const colors = useColors();

  const toneColor: Record<TextTone, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    inverse: colors.textInverse,
    brand: colors.brand,
    positive: colors.positive,
    negative: colors.negative,
    warning: colors.warning,
    info: colors.info,
  };

  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: toneColor[tone] },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] } : null,
        style,
      ]}
    />
  );
}

/** Tone that matches the sign of a financial figure. */
export function toneForValue(value: number | null | undefined, neutral: TextTone = 'primary') {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return neutral;
  return value > 0 ? 'positive' : 'negative';
}
