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
import { isTransportFailure, looksLikeSupabase, looksSecret } from './lib/http-outcome.mjs';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Loads .env.local then .env, matching Expo's precedence: a value already
 * present (real environment, or an earlier file) always wins.
 */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      for (const line of readFileSync(resolve(root, file), 'utf8').split('\n')) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
        if (match && match[1] && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // File absent: fall through to the next one.
    }
  }
}

/**
 * Supabase's Expo quickstart emits EXPO_PUBLIC_SUPABASE_KEY; our own
 * .env.example uses EXPO_PUBLIC_SUPABASE_ANON_KEY. Accept either.
 */
function readPublishableKey() {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
}


loadEnv();

const checks = [];
const record = (name, passed, detail = '') => {
  checks.push({ name, passed, detail });
  console.log(`  ${passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = readPublishableKey();
const demoMode = (process.env.EXPO_PUBLIC_DEMO_MODE ?? 'true').toLowerCase();

console.log('\nPropertyPilot — Supabase preflight\n');
console.log('Configuration\n');

record('EXPO_PUBLIC_SUPABASE_URL is set', Boolean(url), url ?? 'missing');
record('A publishable Supabase key is set', Boolean(anonKey) && !looksSecret(anonKey),
  !anonKey ? 'missing (set EXPO_PUBLIC_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_KEY)'
    : looksSecret(anonKey) ? 'SECRET KEY — this must never ship in a client bundle'
    : `${anonKey.slice(0, 20)}…`);
record('EXPO_PUBLIC_DEMO_MODE is false', demoMode === 'false',
  `currently "${demoMode}" — the app uses on-device storage until this is false`);

// A service-role key in a client variable would ship to every user.
const secretish = Object.entries(process.env).filter(
  ([k, v]) => k.startsWith('EXPO_PUBLIC_') && typeof v === 'string' && v !== '' &&
    (looksSecret(v) || /^sk_/.test(v)),
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

console.log('\nConnectivity\n');

{
  // A direct request, so the result cannot be confused with a schema problem.
  let reachable = false;
  let detail = '';
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.text();

    // A status code alone is not proof: a blocking proxy returns a perfectly
    // well-formed 403 of its own. PostgREST always answers in JSON, so the
    // body is what actually identifies the far end as Supabase.
    const isJson = looksLikeSupabase(response.status, body);

    reachable = isJson;
    detail = isJson
      ? `HTTP ${response.status}, JSON response`
      : `HTTP ${response.status}, but the body is not JSON — something other ` +
        `than Supabase answered: ${body.slice(0, 120).replace(/\s+/g, ' ')}`;
  } catch (error) {
    detail = error?.cause?.message ?? error?.message ?? String(error);
  }

  record('Supabase REST endpoint is reachable', reachable, detail);

  if (!reachable) {
    console.error('\nStopping: the project could not be reached, so nothing below');
    console.error('could be verified. Every remaining check would be inconclusive,');
    console.error('and reporting them as passes would be worse than useless.\n');
    console.error('If you are running this inside a sandboxed agent environment,');
    console.error('add the Supabase host to its network egress allowlist, or run');
    console.error('this command from your own machine.\n');
    process.exit(1);
  }
}

console.log('\nSchema\n');

const TABLES = ['profiles', 'properties', 'property_scenarios', 'subscription_state'];

for (const table of TABLES) {
  const { error } = await client.from(table).select('*', { head: true, count: 'exact' });

  // As an anonymous caller we expect either an empty result or a permission
  // error — both prove the table exists. "relation does not exist" does not,
  // and neither does a transport failure, which proves nothing at all.
  const missing = Boolean(error) && /does not exist|schema cache/i.test(error.message);
  const inconclusive = isTransportFailure(error) || (Boolean(error) && !missing &&
    !/permission|denied|42501|JWT|not authorized/i.test(error.message));
  record(`Table public.${table} exists`, !missing && !inconclusive,
    inconclusive ? `could not tell — ${error.message}` : missing ? error.message : 'present');
}

{
  // RLS smoke test. A transport failure returns no rows too, so it must not
  // be allowed to masquerade as "the policy blocked it".
  const { data, error } = await client.from('properties').select('id');
  const permissionDenied =
    Boolean(error) && /permission|denied|42501|JWT|not authorized/i.test(error.message);
  const emptyResult = !error && (data?.length ?? 0) === 0;

  record('Anonymous callers read no properties (RLS active)',
    emptyResult || permissionDenied,
    isTransportFailure(error) ? `could not tell — ${error.message}`
      : error ? error.message
      : `rows: ${data?.length ?? 0}`);
}

{
  // getSession() reads local storage and never touches the network, so it
  // would pass while completely offline. Sign in with a deliberately bogus
  // credential instead: a 400 back from GoTrue proves the endpoint answered.
  let answered = false;
  let detail = '';
  try {
    const { error } = await client.auth.signInWithPassword({
      email: `preflight-${Date.now()}@example.invalid`,
      password: 'not-a-real-password',
    });
    answered = Boolean(error) && !isTransportFailure(error);
    detail = error ? `rejected bad credentials (${error.message})` : 'unexpectedly signed in';
  } catch (error) {
    detail = error?.message ?? String(error);
  }
  record('Auth endpoint answers', answered, detail);
}

const failed = checks.filter((c) => !c.passed);
console.log(`\n${checks.length - failed.length} passed, ${failed.length} failed\n`);

if (failed.length > 0) {
  console.error('Preflight failed. Fix the above before testing the app by hand.');
  console.error('If tables are missing, apply the migrations:  supabase db push\n');
  process.exit(1);
}

console.log('Preflight passed. Next: node scripts/verify-rls.mjs\n');
