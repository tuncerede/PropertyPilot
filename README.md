# PropertyPilot

**Know when to hold. Know when to sell.**

PropertyPilot is a subscription mobile app for small residential real-estate
investors — landlords with roughly 1–25 rental properties. It answers one
question that spreadsheets make surprisingly hard:

> Is all this equity actually working hard enough for me?

You enter a property once. PropertyPilot then continuously shows its cash
flow, equity, cap rate, cash-on-cash return, cash return on equity, estimated
sale proceeds, a Sell vs. Hold comparison, long-term projections, and how the
property ranks against the rest of your portfolio.

It is deliberately **not** a property-management app. There is no rent
collection, no maintenance tickets, no tenant messaging, no leases. It is an
investment-decision tool.

---

## Screenshots

<!--
Add screenshots here once you have run the app on a device:

| Properties | Property dashboard | Sell vs. Hold | Portfolio |
| --- | --- | --- | --- |
| ![Properties](docs/screenshots/properties.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Sell vs Hold](docs/screenshots/sell-vs-hold.png) | ![Portfolio](docs/screenshots/portfolio.png) |
-->

_Screenshots pending — run the app and drop them in `docs/screenshots/`._

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React Native 0.86 via Expo SDK 57 |
| Language | TypeScript, `strict` (plus `noUncheckedIndexedAccess`, `noUnusedLocals`) |
| Navigation | Expo Router (file-based) |
| Forms | React Hook Form + Zod |
| Client state | Zustand |
| Server state | TanStack Query (wired up, used as the app grows) |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Subscriptions | RevenueCat (entitlement-based) |
| Tests | Jest via `jest-expo` |

Targets **iOS first**, Android second, and web where it comes for free
(web is how the screens in this repo were smoke-tested).

---

## Requirements

- Node.js 20 or newer (developed on 22)
- npm 10+
- For device builds: [Expo Go](https://expo.dev/go) for the JS-only paths, or
  an [Expo Dev Client](#creating-an-expo-development-build) build for
  RevenueCat, which is a native module

Nothing else is required to run the app — see [Demo mode](#demo-mode).

---

## Installation

```bash
git clone https://github.com/tuncerede/propertypilot.git
cd propertypilot
npm install
cp .env.example .env
```

That is enough to run. `.env` ships with `EXPO_PUBLIC_DEMO_MODE=true`, so the
app boots against a local sample portfolio with no accounts or credentials.

---

## Running locally

```bash
npm start          # Metro bundler, then press i / a / w
npm run ios        # iOS simulator (macOS only)
npm run android    # Android emulator
npm run web        # browser
```

Quality gates:

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint, zero warnings allowed
npm test           # jest
npm run check      # all three, in order
```

---

## Demo mode

Demo mode is the reason this repo is runnable the moment you clone it.

When `EXPO_PUBLIC_DEMO_MODE=true` (or whenever Supabase credentials are
missing), the app swaps in local implementations of the same interfaces the
production services satisfy:

| Port | Production | Demo |
| --- | --- | --- |
| `AuthService` | Supabase Auth | `DemoAuthService` — any email, 6+ char password, session persisted on-device |
| `PropertyRepository` | Supabase + RLS | `LocalPropertyRepository` — AsyncStorage, seeded once with sample properties |
| `ScenarioRepository` | Supabase + RLS | `LocalScenarioRepository` — AsyncStorage, never seeded |
| `SubscriptionService` | RevenueCat | `MockSubscriptionService` — purchases and restores succeed, no money moves |

Everything else — every screen, every calculation, the paywall, the property
limits — is the real thing. The demo tier defaults to `pro`; set
`EXPO_PUBLIC_DEMO_TIER=free` to see the free-tier paywalls and the 1-property
limit.

The sample portfolio (`constants/demo.ts`) is **fictional**. The headline
property is a duplex worth $125,000 with $71,400 of equity and $318/mo of cash
flow — figures chosen to be hand-checkable, not to describe a real building.

---

## Environment variables

Copy `.env.example` to `.env` and fill in what you have.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_APP_ENV` | `development` / `staging` / `production` |
| `EXPO_PUBLIC_DEMO_MODE` | `true` runs entirely on-device |
| `EXPO_PUBLIC_DEMO_TIER` | Tier the mock subscription reports: `free`, `pro`, `investor` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public by design, protected by RLS) |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | RevenueCat **public** iOS SDK key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | RevenueCat **public** Android SDK key |
| `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` | Offering to show on the paywall |

> **Anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and is
> readable by anyone who downloads it.** Never put the Supabase `service_role`
> key, a RevenueCat secret (`sk_…`) key, or a store private key in these
> variables or anywhere else in this repo. `.env` is gitignored; `.env.example`
> is the only env file that is committed.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and the **anon** key into `.env`.
3. Set `EXPO_PUBLIC_DEMO_MODE=false`.
4. Apply the migrations (below).
5. In **Authentication → Providers**, enable Email. For a smoother first run,
   turn off "Confirm email" while developing.

### Database migrations

Migrations live in `supabase/migrations/` and are plain SQL, applied in
filename order.

Using the Supabase CLI (recommended):

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

For a local stack:

```bash
supabase start
supabase db reset      # applies migrations, then supabase/seed.sql
```

Or paste each file into the SQL editor in the dashboard, in this order:

1. `20240101000000_initial_schema.sql` — tables, enums, triggers
2. `20240101000001_row_level_security.sql` — RLS policies

Regenerate the TypeScript row types after a schema change:

```bash
npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
```

### Security model

Row Level Security is enabled and **forced** on every table. A user can only
select, insert, update, and delete their own rows, matched on `auth.uid()`.
Scenario inserts additionally verify that the parent property belongs to the
caller, so a scenario can never be attached to someone else's property.

`subscription_state` is deliberately **read-only from the client** — a client
that could write it could grant itself a subscription. Entitlement writes
belong to a RevenueCat webhook running server-side with the service role.

---

## RevenueCat setup

1. Create a RevenueCat project and add your iOS/Android apps.
2. Create two entitlements: **`pro`** and **`investor`**.
3. Create the subscription products in App Store Connect / Google Play, and
   attach them to the entitlements. The identifiers PropertyPilot expects
   (overridable via env) are in `constants/subscription.ts`:
   - `propertypilot_pro_monthly` — $9.99/mo
   - `propertypilot_pro_annual` — $99.99/yr
   - `propertypilot_investor_monthly` — $19.99/mo
   - `propertypilot_investor_annual` — $199.99/yr
4. Build an Offering (default id `default`) containing those packages.
5. Put the **public** SDK keys in `.env`.
6. Build a dev client — RevenueCat is a native module and does not run in
   Expo Go.

The app gates on **entitlements**, never on product identifiers. Prices shown
on the paywall come from the store via RevenueCat; the numbers in
`constants/subscription.ts` are only a layout fallback so the screen is never
blank while an offering loads.

### Tiers

| | Free | Pro | Investor |
| --- | --- | --- | --- |
| Properties | 1 | 5 | 25 |
| Cash flow, equity, cap rate | ✅ | ✅ | ✅ |
| 5-year projection | ✅ | ✅ | ✅ |
| Sell vs. Hold | — | ✅ | ✅ |
| Refinance analysis | — | ✅ | ✅ |
| Portfolio dashboard | — | ✅ | ✅ |
| 10 / 20-year projections | — | ✅ | ✅ |
| Portfolio Sell/Hold ranking | — | — | ✅ |

---

## Creating an Expo development build

Needed for RevenueCat, and for anything else native.

```bash
npm install -g eas-cli
eas login
eas build:configure

eas build --profile development --platform ios
eas build --profile development --platform android
```

Then `npm start` and open the build on your device.

---

## Architecture overview

```
app/                  Expo Router routes (the only place that owns navigation)
  (auth)/             welcome, sign-in, sign-up, forgot-password
  (tabs)/             properties · portfolio · account
  property/           new, [id] dashboard / edit / analysis / refinance
  paywall.tsx
components/           ui/ primitives · property/ · portfolio/ · analysis/ · forms/
lib/
  calculations/       the financial engine — pure, tested, React-free
  formatting/         every number the user sees passes through here
  validation/         Zod schemas
  supabase/           client, row types, row ↔ domain mappers
  config/             environment
services/             ports + adapters: auth, properties, scenarios, subscription, analytics
store/                Zustand stores (auth, properties, scenarios, subscription)
constants/            theme, branding, subscription tiers, analysis thresholds
types/                domain and result types
supabase/             SQL migrations and seed data
tests/                unit tests
```

Three rules hold the codebase together:

**1. The calculation engine is pure.** Everything in `lib/calculations` is a
plain function of its inputs — no React, no network, no storage. Screens never
re-derive a formula inline; they read metrics from the engine. That is what
keeps the number on the property card identical to the one on the dashboard.

**2. Services are ports, not implementations.** `AuthService`,
`PropertyRepository`, and `SubscriptionService` are interfaces. Demo and
production implementations are interchangeable, which is why the app runs with
zero credentials.

**3. Constants are the only place with magic numbers.** Performance
thresholds, default assumptions, tier limits, and product ids all live in
`constants/`. Nothing is hard-coded in a component.

### Units convention

Money is a plain number of **dollars**. Rates are **decimal fractions** — 5% is
`0.05` everywhere in the engine, converted to `"5.0%"` only by
`lib/formatting`. Division that could divide by zero returns `null`, never
`NaN` or `Infinity`, so the UI shows an em dash instead of garbage.

### Transparency

Every headline metric has an ℹ️ affordance that opens a sheet explaining what
it means, the formula used, and the actual inputs that produced the number on
screen. The explanations read from the same metrics object the screen renders,
so they cannot drift from the figures they explain.

---

## The Sell vs. Hold engine

The signature feature. It projects two futures over 5, 10, or 20 years:

**Hold** — property value compounds at the appreciation assumption; rent grows
at the rent-growth assumption; fixed operating expenses inflate; percentage
management is re-derived from each year's income; and the mortgage is
**properly amortized month by month**, never straight-lined. Terminal wealth
separates property equity from accumulated cash flow, and (by default)
subtracts estimated selling costs so both sides are compared net of a sale.

**Sell + Invest** — estimated sale proceeds today, compounded at the
alternative-return assumption.

It also solves, by bisection, for the **break-even appreciation rate**: the
rate at which holding exactly matches selling.

The result never says "you should sell". It says which path produces the
higher projected value *under these assumptions*, shows the gap, and lists the
factors driving it.

### Saved scenarios

Any assumption set — Sell vs. Hold or Refinance — can be saved under a name
and reloaded later. Each saved scenario lists its own outcome ("20 yr ·
Keeping ahead by $235,326"), so the list reads as a comparison rather than a
set of opaque names. Editing a loaded scenario marks it dirty and offers
"Update" alongside "Save as new", so refining assumptions never silently
creates duplicates.

Assumptions are stored as JSONB and read back through Zod schemas where every
field has a default. A scenario saved by an older build still opens in a newer
one, picking up sensible defaults for fields that did not exist when it was
saved — losing a user's saved analysis to a schema change is not an acceptable
failure mode.

Scenarios are capped at 10 per property (`MAX_SCENARIOS_PER_PROPERTY`) as a
storage guard, and are deleted along with their property.

---

## Testing

```bash
npm test
npm test -- --coverage
```

256 unit tests cover the calculation engine, the formatters, scenario
persistence and the subscription gates: effective
income, vacancy, operating expenses, NOI, cash flow, equity, cap rate,
cash-on-cash, return on equity, sale proceeds, loan payments, amortization,
appreciation, rent growth, hold and sell projections, the Sell vs. Hold
comparison, break-even appreciation, refinance analysis, and portfolio
aggregation.

Each is exercised against normal values plus the cases that break naive
implementations: zeros, negative cash flow, no mortgage, zero market value,
100% vacancy, negative equity, zero interest, and missing optional inputs.
Expected results are deterministic and hand-checkable.

---

## Known MVP limitations

- **Taxes are experimental and off by default.** The optional sale-tax figure
  applies one blended rate to an estimated gain. It ignores depreciation and
  recapture, suspended passive losses, holding period, state tax, and 1031
  exchanges. The architecture leaves room for a real tax engine; this is not
  one, and the UI says so.
- **Estimated market value is user-supplied.** No valuation API is connected.
  It is not an appraisal, and the app never implies otherwise.
- **No dedicated side-by-side scenario comparison.** Saved scenarios each show
  their own outcome in the list, which covers the common case, but there is no
  full comparison view yet.
- **Account deletion is partial without a server.** Deleting an auth user
  requires the service role, which cannot live in the app. The client removes
  all of the user's own rows and signs out; a Supabase Edge Function should
  finish the job in production.
- **PDF export is not built.** `exportReports` exists as an entitlement so the
  gate is ready.
- **Dark mode is prepared, not shipped.** A full dark palette exists with the
  same shape as the light one, and no component hard-codes a colour — enabling
  it is a change to the theme provider.
- **Apple / Google sign-in are not wired up.** Email and password work; the
  auth service interface is where the other providers would slot in.
- **Analytics has no provider.** Events are defined and emitted to a logger.
  Payload types deliberately exclude property financials.

---

## Disclaimer

PropertyPilot provides estimates and scenario analysis for informational
purposes only. It does not provide financial, investment, legal, tax, lending,
or real-estate advice. Results depend on assumptions supplied by the user and
may differ materially from actual outcomes.
