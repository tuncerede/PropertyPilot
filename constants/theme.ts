/**
 * PropertyPilot design tokens.
 *
 * Light mode is the shipped experience. A dark palette is defined here with
 * the identical shape so that turning dark mode on later is a provider
 * change, not a rewrite: components read tokens from `useTheme()` and never
 * hard-code a hex value.
 */

export interface Palette {
  // Surfaces
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Brand
  brand: string;
  brandDark: string;
  brandMuted: string;
  brandOnMuted: string;

  // Semantic — used consistently: positive = favourable, negative =
  // unfavourable, warning = needs attention, info = neutral/informational.
  positive: string;
  positiveMuted: string;
  positiveOnMuted: string;
  negative: string;
  negativeMuted: string;
  negativeOnMuted: string;
  warning: string;
  warningMuted: string;
  warningOnMuted: string;
  info: string;
  infoMuted: string;
  infoOnMuted: string;

  // Controls
  overlay: string;
  skeleton: string;
  tabInactive: string;
}

export const lightPalette: Palette = {
  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  surfaceRaised: '#FFFFFF',
  border: '#E4E8EE',
  borderStrong: '#CBD5E1',

  textPrimary: '#0F172A',
  textSecondary: '#5A6B82',
  textTertiary: '#8A99AC',
  textInverse: '#FFFFFF',

  brand: '#0B3B5A',
  brandDark: '#072941',
  brandMuted: '#E8F0F6',
  brandOnMuted: '#0B3B5A',

  positive: '#0B7A4B',
  positiveMuted: '#E7F6EE',
  positiveOnMuted: '#066140',
  negative: '#B42318',
  negativeMuted: '#FDECEA',
  negativeOnMuted: '#912018',
  warning: '#B54708',
  warningMuted: '#FEF3E2',
  warningOnMuted: '#93370D',
  info: '#175CD3',
  infoMuted: '#EAF1FD',
  infoOnMuted: '#134BA6',

  overlay: 'rgba(15, 23, 42, 0.45)',
  skeleton: '#E9EDF2',
  tabInactive: '#8A99AC',
};

export const darkPalette: Palette = {
  background: '#0B1220',
  surface: '#131C2E',
  surfaceMuted: '#0F1829',
  surfaceRaised: '#1A2438',
  border: '#22304A',
  borderStrong: '#33425E',

  textPrimary: '#F2F5F9',
  textSecondary: '#A5B3C6',
  textTertiary: '#7A8AA0',
  textInverse: '#0B1220',

  brand: '#4C9BC6',
  brandDark: '#2D7CA8',
  brandMuted: '#12293B',
  brandOnMuted: '#8FC5E2',

  positive: '#35C08A',
  positiveMuted: '#0F2A20',
  positiveOnMuted: '#6BD9AC',
  negative: '#F17B6E',
  negativeMuted: '#2C1512',
  negativeOnMuted: '#F5A79D',
  warning: '#E0A25A',
  warningMuted: '#2B1D0E',
  warningOnMuted: '#EFC392',
  info: '#6BA6F5',
  infoMuted: '#11203A',
  infoOnMuted: '#9CC4F8',

  overlay: 'rgba(2, 6, 16, 0.6)',
  skeleton: '#1B2438',
  tabInactive: '#7A8AA0',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  /** Hero financial figure, e.g. the property value on the dashboard. */
  hero: { fontSize: 40, lineHeight: 46, fontWeight: '700' as const, letterSpacing: -0.8 },
  /** Large figure inside a metric card. */
  figure: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  figureSmall: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.2 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  /** All-caps section/metric label. */
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

/** Minimum touch target, kept above the 44pt accessibility floor. */
export const HIT_TARGET = 44;
