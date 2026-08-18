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

/**
 * The client-side Supabase key.
 *
 * Supabase issues two generations of publishable key and its own quickstart
 * uses a different variable name from ours, so both are accepted:
 *
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY  — our name; legacy `eyJ…` anon JWT
 *   EXPO_PUBLIC_SUPABASE_KEY       — the name Supabase's Expo quickstart emits;
 *                                    new-style `sb_publishable_…` key
 *
 * Both are designed to be public and are safe in a client bundle *because*
 * Row Level Security restricts every row to its owner. Each access below has
 * to be written out in full: Expo substitutes `process.env.EXPO_PUBLIC_*`
 * literally at build time, so a computed key name would never be replaced.
 */
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

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
