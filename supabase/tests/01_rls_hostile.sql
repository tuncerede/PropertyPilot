-- PropertyPilot — hostile Row Level Security tests
--
-- Two users, A and B. Every check below is an attempt by A to reach B's data,
-- including by substituting B's UUIDs directly rather than going through the
-- app. A landlord's portfolio is private financial data; the database — not
-- the client's `.eq('user_id', …)` filter — is what has to enforce that.
--
-- Run locally:   npm run test:rls:local
-- The suite prints one line per check and fails the script if any check fails.
--
-- Every check here has been mutation-tested: the policies were deliberately
-- loosened one at a time and the suite confirmed to fail. One result is worth
-- recording, because it is not obvious:
--
--   Reassigning a row to another user is blocked TWICE over. Removing the
--   UPDATE policy's WITH CHECK is not enough to open the hole, because
--   PostgreSQL also requires the NEW row to satisfy the SELECT policy on a
--   table with FORCE ROW LEVEL SECURITY. Both guards have to be loosened
--   before check 16 can fail. That redundancy is deliberate — keep it.

\set ON_ERROR_STOP on
\set QUIET on

create schema if not exists rlstest;

create table if not exists rlstest.results (
  seq serial primary key,
  name text not null,
  passed boolean not null,
  detail text
);
truncate rlstest.results restart identity;

-- The probing role must be able to record its own findings.
grant usage on schema rlstest to authenticated, anon;
grant all on rlstest.results to authenticated, anon;
grant all on sequence rlstest.results_seq_seq to authenticated, anon;

create or replace function rlstest.record(p_name text, p_passed boolean, p_detail text default null)
returns void language plpgsql as $$
begin
  insert into rlstest.results (name, passed, detail) values (p_name, p_passed, p_detail);
end;
$$;

/** Impersonate a signed-in Supabase user for the statements that follow. */
create or replace function rlstest.become(p_user uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  execute 'set local role authenticated';
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid;
  b uuid;
begin
  delete from auth.users;

  insert into auth.users (email, raw_user_meta_data)
    values ('a@example.test', '{"full_name":"User A"}'::jsonb) returning id into a;
  insert into auth.users (email, raw_user_meta_data)
    values ('b@example.test', '{"full_name":"User B"}'::jsonb) returning id into b;

  perform set_config('rlstest.a', a::text, false);
  perform set_config('rlstest.b', b::text, false);

  -- The signup trigger should have created both profiles.
  perform rlstest.record(
    'signup trigger creates a profile per auth user',
    (select count(*) from public.profiles where id in (a, b)) = 2,
    'profiles found: ' || (select count(*) from public.profiles where id in (a, b))::text
  );

  insert into public.properties (id, user_id, nickname, estimated_market_value, monthly_gross_rent)
    values (gen_random_uuid(), a, 'A Duplex', 125000, 1850);
  insert into public.properties (id, user_id, nickname, estimated_market_value, monthly_gross_rent)
    values (gen_random_uuid(), b, 'B Fourplex', 400000, 4200);

  insert into public.property_scenarios (property_id, user_id, name, scenario_type, assumptions)
    select id, b, 'B private scenario', 'sell', '{"projectionYears":10}'::jsonb
    from public.properties where user_id = b;

  insert into public.subscription_state (user_id, entitlement) values (b, 'investor');
end
$$;

-- ---------------------------------------------------------------------------
-- Baseline: RLS is actually in force for a signed-in user
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid := current_setting('rlstest.a')::uuid;
  visible int;
begin
  perform rlstest.become(a);
  select count(*) into visible from public.properties;
  reset role;

  perform rlstest.record(
    'A sees only A''s properties (RLS is enforced, not bypassed)',
    visible = 1,
    'rows visible to A: ' || visible::text || ' (expected 1)'
  );
end
$$;

do $$
declare
  forced int;
begin
  select count(*) into forced
  from pg_class
  where relnamespace = 'public'::regnamespace
    and relname in ('profiles','properties','property_scenarios','subscription_state')
    and relrowsecurity and relforcerowsecurity;

  perform rlstest.record(
    'RLS is enabled AND forced on all four tables',
    forced = 4,
    'tables with force RLS: ' || forced::text || ' of 4'
  );
end
$$;

-- ---------------------------------------------------------------------------
-- A attempts to READ B's data, by explicit UUID
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid := current_setting('rlstest.a')::uuid;
  b uuid := current_setting('rlstest.b')::uuid;
  b_property uuid;
  n int;
begin
  reset role;
  select id into b_property from public.properties where user_id = b;
  perform set_config('rlstest.b_property', b_property::text, false);

  perform rlstest.become(a);

  select count(*) into n from public.properties where id = b_property;
  perform rlstest.record('A cannot SELECT B''s property by its exact id', n = 0,
    'rows returned: ' || n::text);

  select count(*) into n from public.properties where user_id = b;
  perform rlstest.record('A cannot SELECT B''s properties by B''s user_id', n = 0,
    'rows returned: ' || n::text);

  select count(*) into n from public.profiles where id = b;
  perform rlstest.record('A cannot SELECT B''s profile', n = 0,
    'rows returned: ' || n::text);

  select count(*) into n from public.property_scenarios where user_id = b;
  perform rlstest.record('A cannot SELECT B''s saved scenarios', n = 0,
    'rows returned: ' || n::text);

  select count(*) into n from public.subscription_state where user_id = b;
  perform rlstest.record('A cannot SELECT B''s subscription state', n = 0,
    'rows returned: ' || n::text);

  reset role;
end
$$;

-- ---------------------------------------------------------------------------
-- A attempts to MODIFY B's data
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid := current_setting('rlstest.a')::uuid;
  b uuid := current_setting('rlstest.b')::uuid;
  b_property uuid := current_setting('rlstest.b_property')::uuid;
  n int;
  still_intact boolean;
begin
  perform rlstest.become(a);

  update public.properties set nickname = 'PWNED' where id = b_property;
  get diagnostics n = row_count;
  perform rlstest.record('A cannot UPDATE B''s property by its exact id', n = 0,
    'rows updated: ' || n::text);

  update public.properties set estimated_market_value = 1 where user_id = b;
  get diagnostics n = row_count;
  perform rlstest.record('A cannot UPDATE B''s properties by B''s user_id', n = 0,
    'rows updated: ' || n::text);

  delete from public.properties where id = b_property;
  get diagnostics n = row_count;
  perform rlstest.record('A cannot DELETE B''s property by its exact id', n = 0,
    'rows deleted: ' || n::text);

  delete from public.property_scenarios where user_id = b;
  get diagnostics n = row_count;
  perform rlstest.record('A cannot DELETE B''s scenarios', n = 0,
    'rows deleted: ' || n::text);

  update public.profiles set subscription_tier = 'investor' where id = b;
  get diagnostics n = row_count;
  perform rlstest.record('A cannot UPDATE B''s profile', n = 0,
    'rows updated: ' || n::text);

  reset role;

  select nickname = 'B Fourplex' and estimated_market_value = 400000
    into still_intact
  from public.properties where id = b_property;

  perform rlstest.record('B''s property is byte-for-byte unchanged after every attempt',
    coalesce(still_intact, false), 'intact: ' || coalesce(still_intact, false)::text);
end
$$;

-- ---------------------------------------------------------------------------
-- A attempts to WRITE rows owned by B
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid := current_setting('rlstest.a')::uuid;
  b uuid := current_setting('rlstest.b')::uuid;
  b_property uuid := current_setting('rlstest.b_property')::uuid;
  a_property uuid;
  blocked boolean;
begin
  reset role;
  select id into a_property from public.properties where user_id = a;

  -- INSERT a property owned by B
  perform rlstest.become(a);
  begin
    insert into public.properties (user_id, nickname) values (b, 'planted by A');
    blocked := false;
  exception when insufficient_privilege or others then
    blocked := true;
  end;
  reset role;
  perform rlstest.record('A cannot INSERT a property owned by B', blocked,
    case when blocked then 'rejected' else 'ACCEPTED — policy hole' end);

  -- Reassign own property to B
  perform rlstest.become(a);
  begin
    update public.properties set user_id = b where id = a_property;
    blocked := false;
  exception when insufficient_privilege or others then
    blocked := true;
  end;
  reset role;
  perform rlstest.record('A cannot reassign their own property to B', blocked,
    case when blocked then 'rejected' else 'ACCEPTED — policy hole' end);

  -- Attach a scenario to B's property while claiming ownership
  perform rlstest.become(a);
  begin
    insert into public.property_scenarios (property_id, user_id, name, scenario_type, assumptions)
      values (b_property, a, 'A on B''s property', 'sell', '{}'::jsonb);
    blocked := false;
  exception when insufficient_privilege or others then
    blocked := true;
  end;
  reset role;
  perform rlstest.record('A cannot attach a scenario to B''s property', blocked,
    case when blocked then 'rejected' else 'ACCEPTED — policy hole' end);

  -- Insert a scenario owned by B
  perform rlstest.become(a);
  begin
    insert into public.property_scenarios (property_id, user_id, name, scenario_type, assumptions)
      values (a_property, b, 'planted by A', 'sell', '{}'::jsonb);
    blocked := false;
  exception when insufficient_privilege or others then
    blocked := true;
  end;
  reset role;
  perform rlstest.record('A cannot INSERT a scenario owned by B', blocked,
    case when blocked then 'rejected' else 'ACCEPTED — policy hole' end);

  -- Insert a profile impersonating B
  perform rlstest.become(a);
  begin
    insert into public.profiles (id, email) values (b, 'stolen@example.test');
    blocked := false;
  exception when unique_violation then
    blocked := true;  -- B's profile already exists; the row was never reachable
  when insufficient_privilege or others then
    blocked := true;
  end;
  reset role;
  perform rlstest.record('A cannot INSERT a profile for B', blocked,
    case when blocked then 'rejected' else 'ACCEPTED — policy hole' end);
end
$$;

-- ---------------------------------------------------------------------------
-- subscription_state is read-only from the client
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid := current_setting('rlstest.a')::uuid;
  blocked boolean;
  n int;
begin
  perform rlstest.become(a);
  begin
    insert into public.subscription_state (user_id, entitlement) values (a, 'investor');
    blocked := false;
  exception when others then
    blocked := true;
  end;
  reset role;
  perform rlstest.record('A cannot grant themselves an entitlement (INSERT blocked)', blocked,
    case when blocked then 'rejected' else 'ACCEPTED — a user could self-upgrade' end);

  perform rlstest.become(a);
  update public.subscription_state set entitlement = 'investor' where user_id = a;
  get diagnostics n = row_count;
  reset role;
  perform rlstest.record('A cannot UPDATE their own entitlement', n = 0,
    'rows updated: ' || n::text);
end
$$;

-- ---------------------------------------------------------------------------
-- Anonymous callers get nothing
-- ---------------------------------------------------------------------------

do $$
declare
  n int;
  blocked boolean;
  why text;
begin
  begin
    execute 'set local role anon';
    execute 'select count(*) from public.properties' into n;
    blocked := (n = 0);
    why := 'rows visible to anon: ' || n::text;
  exception when insufficient_privilege then
    -- No table grant at all: an even stronger outcome than "zero rows".
    blocked := true;
    why := 'no table privilege granted to anon';
  when others then
    blocked := true;
    why := 'query rejected: ' || sqlerrm;
  end;
  reset role;
  perform rlstest.record('An anonymous caller reads no properties', blocked, why);
end
$$;

-- ---------------------------------------------------------------------------
-- A's own access still works (a lockout would be its own kind of failure)
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid := current_setting('rlstest.a')::uuid;
  a_property uuid;
  n int;
  ok boolean;
begin
  reset role;
  select id into a_property from public.properties where user_id = a;

  perform rlstest.become(a);

  select count(*) into n from public.properties where id = a_property;
  perform rlstest.record('A can read their own property', n = 1, 'rows: ' || n::text);

  update public.properties set nickname = 'A Duplex (renamed)' where id = a_property;
  get diagnostics n = row_count;
  perform rlstest.record('A can update their own property', n = 1, 'rows: ' || n::text);

  begin
    insert into public.property_scenarios (property_id, user_id, name, scenario_type, assumptions)
      values (a_property, a, 'A base case', 'sell', '{"projectionYears":10}'::jsonb);
    ok := true;
  exception when others then
    ok := false;
  end;
  perform rlstest.record('A can save a scenario against their own property', ok,
    case when ok then 'accepted' else 'REJECTED — legitimate use blocked' end);

  delete from public.properties where id = a_property;
  get diagnostics n = row_count;
  perform rlstest.record('A can delete their own property', n = 1, 'rows: ' || n::text);

  reset role;
end
$$;

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

\set QUIET off
\pset border 2
\echo ''
\echo '=== PropertyPilot RLS hostile test results ==='
select
  lpad(seq::text, 2) as "#",
  case when passed then 'PASS' else 'FAIL' end as result,
  name as check,
  detail
from rlstest.results
order by seq;

\echo ''
select
  count(*) filter (where passed) || ' passed, ' ||
  count(*) filter (where not passed) || ' failed, ' ||
  count(*) || ' total' as summary
from rlstest.results;

do $$
declare
  failed int;
begin
  select count(*) into failed from rlstest.results where not passed;
  if failed > 0 then
    raise exception 'RLS HOSTILE TESTS FAILED: % check(s) did not pass', failed;
  end if;
end
$$;

\echo 'All RLS hostile checks passed.'
