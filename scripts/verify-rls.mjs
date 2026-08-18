#!/usr/bin/env node
/**
 * Hostile RLS verification against a REAL Supabase project.
 *
 * The SQL suite in supabase/tests/ proves the policies are right at the
 * database level. This proves the whole stack is right: it signs up two real
 * users through Supabase Auth and drives PostgREST with the anon key, exactly
 * as the app does, then has User A attempt to read and modify User B's data —
 * including by substituting B's UUIDs directly rather than going through any
 * app screen.
 *
 * Usage:
 *   node scripts/verify-rls.mjs
 *
 * Reads the URL and publishable key from .env.local, .env, or the
 * environment — either EXPO_PUBLIC_SUPABASE_ANON_KEY or the
 * EXPO_PUBLIC_SUPABASE_KEY name Supabase's own quickstart emits. Only a
 * publishable key is accepted; a secret key would bypass RLS and make every
 * check below meaningless.
 *
 * It creates two throwaway accounts and deletes everything it created. If
 * "Confirm email" is on for the project, sign-up will not return a session;
 * the script says so and tells you what to change.
 */

import { createClient } from '@supabase/supabase-js';
import {
  isPolicyRefusal,
  isTransportFailure,
  looksSecret,
  readBlocked,
  writeBlocked,
} from './lib/http-outcome.mjs';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

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

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = readPublishableKey();

if (!url || !anonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL, or the publishable key.');
  console.error('Set them in .env.local or .env (see .env.example) and try again.');
  process.exit(2);
}

if (looksSecret(anonKey)) {
  console.error('That is a SECRET key (service_role / sb_secret_). It bypasses RLS, so');
  console.error('this test would pass no matter how broken the policies were.');
  console.error('Use the publishable key (sb_publishable_… or the legacy anon key).');
  process.exit(2);
}

const results = [];
const record = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  const tag = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  ${tag}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const why = (error, fallback) =>
  isTransportFailure(error)
    ? `INCONCLUSIVE — request never reached Supabase: ${error.message}`
    : fallback;

const stamp = Date.now();
const accounts = [
  { label: 'A', email: `pp-rls-a-${stamp}@example.com`, password: `A-${stamp}-pw!` },
  { label: 'B', email: `pp-rls-b-${stamp}@example.com`, password: `B-${stamp}-pw!` },
];

const newClient = () =>
  createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

function propertyFor(userId, nickname, value, rent) {
  return {
    user_id: userId,
    nickname,
    street_address: '1 Test St',
    city: 'Erie',
    state: 'PA',
    zip_code: '16501',
    property_type: 'duplex',
    unit_count: 2,
    occupied_units: 2,
    estimated_market_value: value,
    monthly_gross_rent: rent,
  };
}

async function signUp({ email, password, label }) {
  const client = newClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: `RLS Test ${label}` } },
  });

  if (error) throw new Error(`Sign-up failed for ${label}: ${error.message}`);
  if (!data.session) {
    throw new Error(
      `Sign-up for ${label} returned no session. Email confirmation is probably on.\n` +
        'Turn off Authentication → Providers → Email → "Confirm email" while testing,\n' +
        'or pre-create two confirmed users and adapt this script to sign in instead.',
    );
  }

  return { client, userId: data.user.id, email, label };
}

async function main() {
  console.log(`\nHostile RLS verification against ${url}\n`);

  console.log('Creating two throwaway accounts…');
  const a = await signUp(accounts[0]);
  const b = await signUp(accounts[1]);
  console.log(`  A = ${a.userId}`);
  console.log(`  B = ${b.userId}\n`);

  console.log('Seeding one property per user…');
  const { data: aRows, error: aErr } = await a.client
    .from('properties')
    .insert(propertyFor(a.userId, 'A Duplex', 125000, 1850))
    .select()
    .single();
  if (aErr) throw new Error(`A could not create their own property: ${aErr.message}`);

  const { data: bRows, error: bErr } = await b.client
    .from('properties')
    .insert(propertyFor(b.userId, 'B Fourplex', 400000, 4200))
    .select()
    .single();
  if (bErr) throw new Error(`B could not create their own property: ${bErr.message}`);

  const aProperty = aRows.id;
  const bProperty = bRows.id;
  console.log(`  A's property = ${aProperty}`);
  console.log(`  B's property = ${bProperty}\n`);

  const { data: bScenario } = await b.client
    .from('property_scenarios')
    .insert({
      property_id: bProperty,
      user_id: b.userId,
      name: 'B private scenario',
      scenario_type: 'sell',
      assumptions: { projectionYears: 10 },
    })
    .select()
    .single();

  console.log('Baseline\n');
  {
    const { data } = await a.client.from('properties').select('id');
    record('A sees exactly one property (their own)', data?.length === 1,
      `rows: ${data?.length ?? 'null'}`);
  }

  console.log('\nA attempts to READ B\'s data, by explicit id\n');
  {
    const { data, error } = await a.client.from('properties').select('*').eq('id', bProperty);
    record("A cannot SELECT B's property by its exact id", readBlocked(data, error),
      why(error, `rows: ${data?.length ?? 0}`));
  }
  {
    const { data, error } = await a.client.from('properties').select('*').eq('user_id', b.userId);
    record("A cannot SELECT B's properties by B's user_id", readBlocked(data, error),
      `rows: ${data?.length ?? 0}`);
  }
  {
    const { data, error } = await a.client.from('profiles').select('*').eq('id', b.userId);
    record("A cannot SELECT B's profile", readBlocked(data, error), `rows: ${data?.length ?? 0}`);
  }
  {
    const { data, error } = await a.client.from('property_scenarios').select('*').eq('user_id', b.userId);
    record("A cannot SELECT B's saved scenarios", readBlocked(data, error),
      `rows: ${data?.length ?? 0}`);
  }
  {
    const { data, error } = await a.client.from('subscription_state').select('*').eq('user_id', b.userId);
    record("A cannot SELECT B's subscription state", readBlocked(data, error),
      `rows: ${data?.length ?? 0}`);
  }
  {
    // No filter at all: does the table leak everything?
    const { data } = await a.client.from('properties').select('id, user_id');
    const foreign = (data ?? []).filter((row) => row.user_id !== a.userId);
    record('An unfiltered SELECT returns nothing belonging to B', foreign.length === 0,
      `foreign rows: ${foreign.length}`);
  }

  console.log('\nA attempts to MODIFY B\'s data\n');
  {
    const { data, error } = await a.client
      .from('properties').update({ nickname: 'PWNED' }).eq('id', bProperty).select();
    record("A cannot UPDATE B's property by its exact id", writeBlocked(data, error),
      why(error, `rows updated: ${data?.length ?? 0}`));
  }
  {
    const { data, error } = await a.client
      .from('properties').delete().eq('id', bProperty).select();
    record("A cannot DELETE B's property by its exact id", writeBlocked(data, error),
      why(error, `rows deleted: ${data?.length ?? 0}`));
  }
  {
    const { data, error } = await a.client
      .from('property_scenarios').delete().eq('user_id', b.userId).select();
    record("A cannot DELETE B's scenarios", writeBlocked(data, error),
      why(error, `rows deleted: ${data?.length ?? 0}`));
  }
  {
    const { data, error } = await a.client
      .from('profiles').update({ subscription_tier: 'investor' }).eq('id', b.userId).select();
    record("A cannot UPDATE B's profile", writeBlocked(data, error),
      why(error, `rows updated: ${data?.length ?? 0}`));
  }

  console.log('\nA attempts to WRITE rows owned by B\n');
  {
    const { error } = await a.client.from('properties').insert(propertyFor(b.userId, 'planted by A', 1, 1));
    record("A cannot INSERT a property owned by B", isPolicyRefusal(error),
      why(error, error ? 'rejected' : 'ACCEPTED — policy hole'));
  }
  {
    const { data, error } = await a.client
      .from('properties').update({ user_id: b.userId }).eq('id', aProperty).select();
    const blocked = writeBlocked(data, error);
    record("A cannot reassign their own property to B", blocked,
      why(error, blocked ? 'rejected' : 'ACCEPTED — policy hole'));
  }
  {
    const { error } = await a.client.from('property_scenarios').insert({
      property_id: bProperty, user_id: a.userId,
      name: "A on B's property", scenario_type: 'sell', assumptions: {},
    });
    record("A cannot attach a scenario to B's property", isPolicyRefusal(error),
      why(error, error ? 'rejected' : 'ACCEPTED — policy hole'));
  }
  {
    const { error } = await a.client.from('property_scenarios').insert({
      property_id: aProperty, user_id: b.userId,
      name: 'planted by A', scenario_type: 'sell', assumptions: {},
    });
    record("A cannot INSERT a scenario owned by B", isPolicyRefusal(error),
      why(error, error ? 'rejected' : 'ACCEPTED — policy hole'));
  }

  console.log('\nEntitlements are not client-writable\n');
  {
    const { error } = await a.client
      .from('subscription_state').insert({ user_id: a.userId, entitlement: 'investor' });
    record('A cannot grant themselves an entitlement', isPolicyRefusal(error),
      why(error, error ? 'rejected' : 'ACCEPTED — a user could self-upgrade'));
  }

  console.log('\nAn anonymous caller\n');
  {
    const anon = newClient();
    const { data, error } = await anon.from('properties').select('*');
    record('A signed-out caller reads no properties', readBlocked(data, error),
      `rows: ${data?.length ?? 0}`);
  }

  console.log('\nB\'s data survived intact\n');
  {
    const { data } = await b.client.from('properties').select('*').eq('id', bProperty).single();
    const intact = data?.nickname === 'B Fourplex' && Number(data?.estimated_market_value) === 400000;
    record("B's property is unchanged after every attempt", Boolean(intact),
      `nickname: ${data?.nickname ?? 'MISSING'}`);
    const { data: scenarios } = await b.client.from('property_scenarios').select('id');
    record("B's scenario still exists", (scenarios?.length ?? 0) === 1,
      `rows: ${scenarios?.length ?? 0}`);
  }

  console.log('\nA\'s own access still works\n');
  {
    const { data, error } = await a.client
      .from('properties').update({ nickname: 'A Duplex (renamed)' }).eq('id', aProperty).select();
    record('A can still update their own property', !error && data?.length === 1,
      error ? error.message : `rows: ${data?.length ?? 0}`);
  }

  // Clean up everything this script created that it is allowed to delete.
  console.log('\nCleaning up…');
  if (bScenario) await b.client.from('property_scenarios').delete().eq('id', bScenario.id);
  await a.client.from('properties').delete().eq('id', aProperty);
  await b.client.from('properties').delete().eq('id', bProperty);
  console.log('  Test properties and scenarios deleted.');
  console.log(`  Two auth users remain (deleting them needs the service role):`);
  console.log(`    ${a.email}`);
  console.log(`    ${b.email}`);

  const failed = results.filter((r) => !r.passed);
  console.log(
    `\n${results.length - failed.length} passed, ${failed.length} failed, ${results.length} total\n`,
  );

  if (failed.length > 0) {
    console.error('RLS VERIFICATION FAILED. Do not ship this configuration.');
    for (const f of failed) console.error(`  - ${f.name} (${f.detail})`);
    process.exit(1);
  }

  console.log('All hostile RLS checks passed against the live project.');
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exit(1);
});
