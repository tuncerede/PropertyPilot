-- PropertyPilot — Row Level Security
--
-- A landlord's portfolio is private financial data. These policies are the
-- actual access-control boundary: even though the app also filters by
-- user_id, the database is what guarantees that one user can never read or
-- write another user's rows.
--
-- Every policy is scoped to the `authenticated` role and matched on
-- `(select auth.uid())` — wrapping it in a subselect lets Postgres evaluate
-- it once per query instead of once per row.
--
-- The anon role gets nothing. The service_role bypasses RLS by design and
-- must only ever be used server-side (webhooks, Edge Functions) — never in
-- the mobile app.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

alter table public.properties enable row level security;
alter table public.properties force row level security;

drop policy if exists "Users can read their own properties" on public.properties;
create policy "Users can read their own properties"
  on public.properties for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- WITH CHECK on insert stops a client from writing a row owned by anyone else.
drop policy if exists "Users can insert their own properties" on public.properties;
create policy "Users can insert their own properties"
  on public.properties for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- USING restricts which rows may be updated; WITH CHECK stops an update from
-- reassigning a row to a different owner.
drop policy if exists "Users can update their own properties" on public.properties;
create policy "Users can update their own properties"
  on public.properties for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own properties" on public.properties;
create policy "Users can delete their own properties"
  on public.properties for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- property_scenarios
-- ---------------------------------------------------------------------------

alter table public.property_scenarios enable row level security;
alter table public.property_scenarios force row level security;

drop policy if exists "Users can read their own scenarios" on public.property_scenarios;
create policy "Users can read their own scenarios"
  on public.property_scenarios for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- A scenario must belong to the caller AND hang off a property the caller
-- owns, so a scenario can never be attached to someone else's property.
drop policy if exists "Users can insert their own scenarios" on public.property_scenarios;
create policy "Users can insert their own scenarios"
  on public.property_scenarios for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update their own scenarios" on public.property_scenarios;
create policy "Users can update their own scenarios"
  on public.property_scenarios for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their own scenarios" on public.property_scenarios;
create policy "Users can delete their own scenarios"
  on public.property_scenarios for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- subscription_state
-- ---------------------------------------------------------------------------

alter table public.subscription_state enable row level security;
alter table public.subscription_state force row level security;

-- Read-only from the client: entitlement writes belong to the RevenueCat
-- webhook running with the service role. A client that could write this table
-- could grant itself a subscription.
drop policy if exists "Users can read their own subscription state"
  on public.subscription_state;
create policy "Users can read their own subscription state"
  on public.subscription_state for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own subscription state"
  on public.subscription_state;
create policy "Users can delete their own subscription state"
  on public.subscription_state for delete
  to authenticated
  using ((select auth.uid()) = user_id);
