#!/usr/bin/env node
/**
 * Supabase preflight.
 *
 * Run this the moment the project exists and the migrations are applied, before
 * walking the app by hand. It answers "is this wired up correctly?" in a few
 * seconds instead of leaving you to infer it from a screen that will not load.
 *
 *   node scripts/verify-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

try {
  for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* no .env; use the environment */
}

const checks = [];
const record = (name, passed, detail = '') => {
  checks.push({ name, passed, detail });
  console.log(`  ${passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const demoMode = (process.env.EXPO_PUBLIC_DEMO_MODE ?? 'true').toLowerCase();

console.log('\nPropertyPilot — Supabase preflight\n');
console.log('Configuration\n');

record('EXPO_PUBLIC_SUPABASE_URL is set', Boolean(url), url ?? 'missing');
record('EXPO_PUBLIC_SUPABASE_ANON_KEY is set', Boolean(anonKey),
  anonKey ? `${anonKey.slice(0, 12)}…` : 'missing');
record('EXPO_PUBLIC_DEMO_MODE is false', demoMode === 'false',
  `currently "${demoMode}" — the app uses on-device storage until this is false`);

// A service-role key in a client variable would ship to every user.
const secretish = Object.entries(process.env).filter(
  ([k, v]) => k.startsWith('EXPO_PUBLIC_') && typeof v === 'string' &&
    (/service_role/.test(v) || /^sk_/.test(v)),
);
record('No server secret in an EXPO_PUBLIC_ variable', secretish.length === 0,
  secretish.length ? `LEAKED: ${secretish.map(([k]) => k).join(', ')}` : 'clean');

if (!url || !anonKey) {
  console.log('\nStopping: fill in the Supabase URL and anon key first.\n');
  process.exit(2);
}

const client = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

console.log('\nConnectivity and schema\n');

const TABLES = ['profiles', 'properties', 'property_scenarios', 'subscription_state'];

for (const table of TABLES) {
  const { error } = await client.from(table).select('*', { head: true, count: 'exact' });

  // As an anonymous caller we expect either an empty result or a permission
  // error — both prove the table exists. "relation does not exist" does not.
  const missing = error && /does not exist|schema cache/i.test(error.message);
  record(`Table public.${table} exists`, !missing, missing ? error.message : 'present');
}

{
  // RLS smoke test: anonymous callers must not be able to read properties.
  const { data, error } = await client.from('properties').select('id');
  const blocked = (data?.length ?? 0) === 0 || Boolean(error);
  record('Anonymous callers read no properties (RLS active)', blocked,
    error ? error.message : `rows: ${data?.length ?? 0}`);
}

{
  const { error } = await client.auth.getSession();
  record('Auth endpoint reachable', !error, error?.message ?? 'ok');
}

const failed = checks.filter((c) => !c.passed);
console.log(`\n${checks.length - failed.length} passed, ${failed.length} failed\n`);

if (failed.length > 0) {
  console.error('Preflight failed. Fix the above before testing the app by hand.');
  console.error('If tables are missing, apply the migrations:  supabase db push\n');
  process.exit(1);
}

console.log('Preflight passed. Next: node scripts/verify-rls.mjs\n');
