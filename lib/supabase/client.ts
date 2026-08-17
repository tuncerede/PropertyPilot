import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { env } from '@/lib/config/env';
import type { Database } from './database.types';

/**
 * Supabase client.
 *
 * Only the anon key is used here. The anon key is designed to be public and
 * is safe in a client bundle *because* Row Level Security restricts every
 * row to its owner (see `supabase/migrations`). The service-role key must
 * never appear in this app.
 *
 * Returns null when credentials are absent, which is how the app falls back
 * to demo mode instead of crashing on startup.
 */

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!env.hasSupabaseCredentials) return null;
  if (client) return client;

  client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // React Native has no URL bar to parse a session out of.
      detectSessionInUrl: false,
    },
  });

  return client;
}
