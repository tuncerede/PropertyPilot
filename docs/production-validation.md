# Production Integration Validation

The milestone before any new feature work. Five gates, in order. **Do not start
a gate until the previous one passes.**

Gates 1 and 2 are largely automated by the scripts in `scripts/`. Gates 3 and 4
need a physical device and store accounts, so they are checklists.

| Gate | What it proves | How |
| --- | --- | --- |
| 1 | The app works against a real Supabase project | `npm run verify:supabase`, then the manual walkthrough |
| 2 | One user's data is unreachable by another | `npm run test:rls:local`, then `npm run verify:rls` |
| 3 | It works on real hardware, in the hand | Dev client on device |
| 4 | Subscriptions and limits behave | RevenueCat + sandbox purchases |
| 5 | PDF export and account deletion | Only after 1–4 pass |

---

## Gate 1 — Real Supabase project

### 1.1 Create and configure

1. Create a project at [supabase.com](https://supabase.com). Keep the database
   password somewhere safe; you will need it for `supabase link`.
2. **Project Settings → API**: copy the Project URL and the **publishable**
   key — either the new-style `sb_publishable_…` key or the legacy `eyJ…`
   anon JWT. Never copy a `sb_secret_…` or `service_role` key into this repo.
3. Write `.env.local` (gitignored; Expo reads it ahead of `.env`):

   ```
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_DEMO_MODE=false
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
   ```

   > Supabase's connect dialog gives you the URL and key but **not**
   > `EXPO_PUBLIC_DEMO_MODE=false`. Without it the app keeps using on-device
   > storage and ignores Supabase entirely — the single most common reason a
   > correctly-configured project appears to do nothing.
   >
   > That dialog also suggests creating `utils/supabase.ts` and replacing
   > `App.tsx`. Do neither: this project already has a typed client at
   > `lib/supabase/client.ts`, and a second client would mean two independent
   > auth sessions in one app. There is no `App.tsx` — the entry point is
   > `expo-router/entry`.

4. Apply the migrations:

   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <ref>
   supabase db push
   ```

5. **Authentication → Providers → Email**: enable it, and turn **off** "Confirm
   email" for now. Sign-up returns no session while confirmation is on, which
   blocks both the walkthrough and the automated RLS test. Turn it back on
   before you have real users.

### 1.2 Preflight

```bash
npm run verify:supabase
```

Checks the env vars are set, `EXPO_PUBLIC_DEMO_MODE=false`, that no server
secret leaked into an `EXPO_PUBLIC_` variable, that all four tables exist, and
that an anonymous caller can read nothing. Fix anything it flags before going
further — a missing table here is five seconds to diagnose and twenty minutes
to diagnose from a blank screen.

### 1.3 Manual walkthrough

Run the app (`npm start`). Work through this in order and tick each line.

- [ ] **Sign up** with a new email. You land on "Add your first property".
- [ ] **Supabase → Table Editor → profiles**: a row exists with your email and
      `subscription_tier = 'free'`. (This proves the `on_auth_user_created`
      trigger fired.)
- [ ] **Add a property** through all six steps. Save.
- [ ] The dashboard shows a value, equity, cash flow, and cash return on equity —
      no `—`, no `NaN`.
- [ ] **Table Editor → properties**: the row is there, `user_id` matches your
      auth user, and the numeric columns hold what you typed.
- [ ] **Edit the property**, change the estimated value, save. The dashboard
      figure updates and the database row updates.
- [ ] **Open Sell vs. Hold.** Change the appreciation rate. The comparison
      recomputes live.
- [ ] **Save a scenario.** A row appears in `property_scenarios` with your
      `user_id` and the assumptions as JSONB.
- [ ] **Sign out**, then **sign in again** with the same account.
- [ ] The property is still there, with the edited value. The saved scenario is
      still there. **This is the persistence gate** — it is what demo mode
      could never prove.
- [ ] Kill the app entirely and reopen it. You are still signed in.
- [ ] Turn airplane mode on and open the app. You get a readable error, not a
      crash and not a raw Supabase message.

**Gate 1 passes when every box above is ticked.**

---

## Gate 2 — Hostile RLS

The most important gate. Consider Supabase incomplete until both halves pass.

### 2.1 Database level (offline, repeatable)

```bash
npm run test:rls:local
```

Applies the real migrations to a throwaway PostgreSQL database on top of a
small shim that recreates `auth.users`, `auth.uid()` and the
`anon`/`authenticated` roles, then runs 26 hostile checks: User A attempting to
read, update, delete, and plant rows belonging to User B, by explicit UUID.

Needs PostgreSQL server binaries locally, or point it at the database that
`supabase start` runs:

```bash
PP_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" \
  npm run test:rls:local
```

It refuses to run against a hosted project, because it truncates `auth.users`.

Every check has been mutation-tested — the policies were deliberately loosened
one at a time and the suite confirmed to fail. If it ever goes green against
broken policies, that is a bug in the suite.

### 2.2 Whole stack, live project

```bash
npm run verify:rls
```

This is the version that matters for your sign-off. It signs up two real users
through Supabase Auth and drives PostgREST with the **anon key**, exactly as
the app does — so it tests the policies *and* the client path together. Then
User A attempts, against User B:

- SELECT by B's exact property id, and by B's user_id
- SELECT B's profile, scenarios, and subscription state
- an unfiltered SELECT, to see whether the table leaks wholesale
- UPDATE and DELETE B's property by its exact id
- DELETE B's scenarios; UPDATE B's profile
- INSERT a property owned by B
- reassign A's own property to B
- attach a scenario to B's property
- INSERT a scenario owned by B
- grant itself an entitlement in `subscription_state`
- read anything at all while signed out

It then confirms B's data is byte-for-byte unchanged and that A's own access
still works — a lockout is its own kind of failure.

It cleans up the properties and scenarios it created. The two auth users
remain; deleting those needs the service role, so remove them from
**Authentication → Users** by hand.

**Gate 2 passes only when both commands exit 0.** If either reports a FAIL,
stop and fix the policy — do not proceed to the device.

---

## Gate 3 — Development build on your iPhone

RevenueCat is a native module, so Expo Go cannot run gate 4. You need a dev
client regardless.

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform ios
```

Install the build on your phone, then `npm start` and open it from the dev
client.

Use it like a customer for a few days, not like a developer for ten minutes.
The things a simulator will not tell you:

- [ ] Do the currency and percent fields behave with the **real iOS keyboard**?
      Does the decimal pad appear? Can you dismiss it? Does the Continue button
      end up underneath it?
- [ ] Does the six-step add-property flow feel long on a phone in one hand?
- [ ] Are the tap targets in the scenario list — rename and delete are small
      icons — actually hittable with a thumb?
- [ ] Does the comparison table scroll horizontally without fighting the
      vertical scroll of the page?
- [ ] Is any headline figure clipped at the **largest Dynamic Type** setting?
- [ ] Does the info sheet dismiss cleanly, every time?
- [ ] Does anything jump when the keyboard opens on the assumptions form?
- [ ] With VoiceOver on, can you reach and understand the property card?

Log what annoys you. That list is worth more than any amount of further
feature work.

---

## Gate 4 — RevenueCat and the tier limits

### 4.1 Create the products

**App Store Connect → your app → Subscriptions.** One subscription group,
four products:

| Product ID | Name | Price |
| --- | --- | --- |
| `propertypilot_pro_monthly` | PropertyPilot Pro Monthly | $9.99 |
| `propertypilot_pro_annual` | PropertyPilot Pro Annual | $99.99 |
| `propertypilot_investor_monthly` | PropertyPilot Investor Monthly | $19.99 |
| `propertypilot_investor_annual` | PropertyPilot Investor Annual | $199.99 |

These identifiers are what `constants/subscription.ts` expects. If you use
different ones, override them via `EXPO_PUBLIC_PRODUCT_*` rather than editing
components.

### 4.2 Wire up RevenueCat

1. Create a RevenueCat project; add the iOS app with your bundle ID
   (`com.propertypilot.app`).
2. Create **two entitlements**, `pro` and `investor` — the identifiers the app
   gates on.
3. Attach the two Pro products to `pro`, the two Investor products to
   `investor`.
4. Build an **Offering** (identifier `default`) containing all four packages.
5. Put the **public** SDK key in `.env` as
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`. Never the secret `sk_` key.
6. Rebuild the dev client — env vars are inlined at build time.

### 4.3 Test with a sandbox account

Create a Sandbox Apple ID in App Store Connect → Users and Access → Sandbox.

- [ ] The paywall shows **store prices**, not the fallback constants. Change a
      price in App Store Connect and confirm the app follows it. (If it shows
      exactly $9.99/$99.99/$19.99/$199.99 with no offering loaded, you are
      seeing the fallback — the offering did not load.)
- [ ] **Free tier**: one property. Adding a second opens the paywall.
- [ ] **Buy Pro Monthly.** The Account screen shows Pro. The property limit
      becomes 5.
- [ ] Sell vs. Hold, Refinance, Portfolio, 10/20-year projections and the
      comparison view all unlock.
- [ ] Add properties up to **5**. The sixth opens the paywall.
- [ ] **Upgrade to Investor.** The limit becomes 25. Portfolio ranking unlocks.
- [ ] **Restore Purchases** on a fresh install of the dev client returns you to
      Investor.
- [ ] **Expiration.** Sandbox subscriptions renew fast (a month ≈ 5 minutes)
      and cancel after six renewals. Let one lapse, or cancel from the sandbox
      account, and confirm the app drops to Free — and that the properties
      beyond the Free limit are **still visible, not deleted**. Downgrading
      must never destroy data. Confirm you cannot *add* past the new limit.
- [ ] **Entitlement failure.** Put the phone in airplane mode and cold-start.
      The app must still open on the free surface rather than hanging or
      crashing (`subscriptionStore.configure` falls back to `free` by design).

### 4.4 Cache the entitlement server-side (optional but recommended)

`subscription_state` is deliberately read-only from the client. To populate it,
add a RevenueCat webhook pointing at a Supabase Edge Function that writes with
the service role. Not required for the app to work — RevenueCat remains the
source of truth — but it is what lets you answer "who is subscribed?" from SQL.

---

## Gate 5 — Only after 1–4

- **PDF export.** The `exportReports` entitlement already gates it; there is no
  implementation behind it yet.
- **Account deletion.** The client removes the user's own rows and signs out.
  Deleting the auth user needs the service role, so it belongs in a Supabase
  Edge Function.

Apple/Google sign-in and dark mode are deliberately below these.
