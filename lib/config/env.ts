import { Platform } from 'react-native';

/**
 * Environment configuration.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so these must be
 * referenced as full static property accesses — destructuring `process.env`
 * or building the key dynamically would break the substitution.
 *
 * Only values that are safe to ship inside a client bundle appear here. The
 * Supabase service-role key, RevenueCat secret keys and any store private key
 * must never be read by this app.
 */

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const revenueCatIosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
const revenueCatAndroidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';

export const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseAnonKey);

export const revenueCatApiKey = Platform.select({
  ios: revenueCatIosKey,
  android: revenueCatAndroidKey,
  default: '',
});

export const hasRevenueCatCredentials = Boolean(revenueCatApiKey);

/**
 * Demo mode is on when explicitly requested, and also whenever Supabase
 * credentials are missing — the app must always be runnable, never a blank
 * screen complaining about configuration.
 */
const demoModeRequested = readBoolean(process.env.EXPO_PUBLIC_DEMO_MODE, true);

export const env = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  isProduction: process.env.EXPO_PUBLIC_APP_ENV === 'production',
  supabaseUrl,
  supabaseAnonKey,
  hasSupabaseCredentials,
  revenueCatApiKey: revenueCatApiKey ?? '',
  hasRevenueCatCredentials,
  demoMode: demoModeRequested || !hasSupabaseCredentials,
  /** Entitlement the mock subscription service reports in demo mode. */
  demoTier: (process.env.EXPO_PUBLIC_DEMO_TIER ?? 'pro') as 'free' | 'pro' | 'investor',
} as const;

export type Env = typeof env;
