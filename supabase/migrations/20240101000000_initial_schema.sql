-- PropertyPilot — initial schema
--
-- Conventions:
--   * UUID primary keys, generated server-side.
--   * Money is `numeric(14,2)`: exact decimal, never binary floating point,
--     so a balance never drifts by a cent.
--   * Rates are `numeric(6,5)` DECIMAL FRACTIONS — 0.05 means 5%. This is the
--     same convention the TypeScript calculation engine uses.
--   * Every table carries created_at / updated_at, maintained by a trigger.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_type') then
    create type public.property_type as enum (
      'single_family',
      'duplex',
      'triplex',
      'fourplex',
      'multifamily',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'scenario_type') then
    create type public.scenario_type as enum ('hold', 'sell', 'refinance');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('free', 'pro', 'investor');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  -- Cached for display only. RevenueCat entitlements remain the source of
  -- truth for what a user is actually entitled to.
  subscription_tier public.subscription_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Identity
  nickname text not null default '',
  street_address text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  property_type public.property_type not null default 'single_family',
  unit_count integer not null default 1 check (unit_count >= 0),
  occupied_units integer not null default 0 check (occupied_units >= 0),

  -- Acquisition
  purchase_price numeric(14, 2) not null default 0,
  purchase_date date,
  initial_closing_costs numeric(14, 2) not null default 0,
  initial_capex numeric(14, 2) not null default 0,
  -- Nullable on purpose: without it, cash-on-cash return is reported as
  -- unavailable rather than guessed.
  original_down_payment numeric(14, 2),

  -- Financing
  has_mortgage boolean not null default true,
  mortgage_balance numeric(14, 2) not null default 0,
  mortgage_interest_rate numeric(6, 5) not null default 0,
  monthly_principal_interest numeric(14, 2) not null default 0,
  remaining_term_years numeric(5, 2) not null default 0,

  -- Income
  monthly_gross_rent numeric(14, 2) not null default 0,
  monthly_other_income numeric(14, 2) not null default 0,
  vacancy_rate numeric(6, 5) not null default 0.05
    check (vacancy_rate >= 0 and vacancy_rate <= 1),

  -- Operating expenses
  annual_property_tax numeric(14, 2) not null default 0,
  annual_insurance numeric(14, 2) not null default 0,
  monthly_management_cost numeric(14, 2) not null default 0,
  management_percentage numeric(6, 5)
    check (management_percentage is null
           or (management_percentage >= 0 and management_percentage <= 1)),
  annual_repairs_maintenance numeric(14, 2) not null default 0,
  monthly_owner_utilities numeric(14, 2) not null default 0,
  monthly_hoa numeric(14, 2) not null default 0,
  monthly_lawn_snow numeric(14, 2) not null default 0,
  monthly_other_expenses numeric(14, 2) not null default 0,

  -- Valuation (user-supplied estimates, not appraisals)
  estimated_market_value numeric(14, 2) not null default 0,
  appreciation_rate numeric(6, 5) not null default 0.03,
  rent_growth_rate numeric(6, 5) not null default 0.03,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint occupied_units_within_unit_count check (occupied_units <= unit_count)
);

create index if not exists properties_user_id_idx on public.properties (user_id);
create index if not exists properties_user_created_idx
  on public.properties (user_id, created_at);

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- property_scenarios — saved Sell / Hold / Refinance assumption sets
-- ---------------------------------------------------------------------------

create table if not exists public.property_scenarios (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  scenario_type public.scenario_type not null,
  -- JSONB because the assumption set differs per scenario type and evolves
  -- with the product; the shapes are typed in TypeScript.
  assumptions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_scenarios_property_idx
  on public.property_scenarios (property_id);
create index if not exists property_scenarios_user_idx
  on public.property_scenarios (user_id);

drop trigger if exists property_scenarios_set_updated_at on public.property_scenarios;
create trigger property_scenarios_set_updated_at
  before update on public.property_scenarios
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscription_state — cached RevenueCat metadata
-- ---------------------------------------------------------------------------

create table if not exists public.subscription_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  revenuecat_customer_id text,
  entitlement text,
  product_identifier text,
  expiration_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists subscription_state_set_updated_at on public.subscription_state;
create trigger subscription_state_set_updated_at
  before update on public.subscription_state
  for each row execute function public.set_updated_at();

comment on table public.subscription_state is
  'Cached subscription metadata. RevenueCat entitlements are the source of truth; '
  'this table exists for backend reporting and should never be trusted alone to '
  'grant access. Writes normally come from a RevenueCat webhook using the '
  'service role, not from the mobile client.';
