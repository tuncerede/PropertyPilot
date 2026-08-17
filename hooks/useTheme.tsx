import React, { createContext, useContext, useMemo } from 'react';
import { darkPalette, lightPalette, type Palette } from '@/constants/theme';

/**
 * Theme access.
 *
 * Light mode is what ships. The provider already resolves a scheme, so
 * enabling dark mode later means passing `useColorScheme()` in here rather
 * than touching any component: nothing below reads a hex value directly.
 */

export type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  colors: Palette;
  scheme: ColorScheme;
}

const defaultValue: ThemeContextValue = { colors: lightPalette, scheme: 'light' };

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export function ThemeProvider({
  children,
  scheme = 'light',
}: {
  children: React.ReactNode;
  scheme?: ColorScheme;
}) {
  const value = useMemo<ThemeContextValue>(
    () => ({ colors: scheme === 'dark' ? darkPalette : lightPalette, scheme }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Convenience for the common case of only needing colors. */
export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}
