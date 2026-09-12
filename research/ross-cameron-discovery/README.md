# Ross Cameron Discovery Project (Warrior Trading, outside the 68-video corpus)

**Status:** Phase 1 complete — inventory only. Nothing downloaded, nothing extracted, Falcon untouched.

## Goal
Find trading knowledge Ross Cameron uses repeatedly on the official Warrior Trading
YouTube channel (`@DaytradeWarrior`, channel id `UCBayuhgYpKNbhJxfExYkPfA`) that the
existing 68-video small-account corpus did not cover and that Falcon does not currently represent.

## Hard constraints (from the brief)
- Discovery only. Do NOT modify Falcon, thresholds, or any optimisation.
- Do NOT use VALIDATION / OOS data.
- Do NOT touch the daily Ross-vs-Falcon automation.
- Do NOT bulk-download or process the Warrior Trading library until the inventory is reviewed.

## Method used for Phase 1
1. Topic-driven web search against the Warrior Trading channel (30+ queries across the
   requested topics: regime, entries, exits, risk, catalysts, Level 2, daily chart,
   continuation, float/short interest, themes/sympathy, plus halts, VWAP, false breakouts,
   pre-market, volume, offerings/splits, time-of-day, psychology).
2. Excluded anything that is a Small Account Challenge / $2,000 Webull challenge / $583
   challenge "Day N" episode (the small-account corpus family). See `INVENTORY.md`
   section "Excluded as likely already in corpus".
3. Ranked the remaining candidates by (a) how directly they target a Falcon gap and
   (b) recency / how repeatedly Ross returns to the concept.

## Environment caveats (important for review)
- In this sandbox `youtube.com`, `warriortrading.com`, `medium.com`, Apple Podcasts and
  the transcript mirrors are all blocked at the egress proxy. The inventory was built from
  search-engine metadata only (titles, upload dates, snippets, video ids). Titles and
  dates should be spot-checked when the next phase runs on a machine with YouTube access.
- The 68-video corpus list and Falcon's feature spec are not in this repository, so the
  exclusion was done by *series family* (challenge episodes), not by exact video id.
  Strike any inventory rows that were already studied.
- "What appears new" is judged against the gap list in the brief (regime, exits, L2,
  daily chart, catalysts, float/squeeze, themes) and the usual small-account Ross ruleset
  (gap %, RVOL, float, price band, micro-pullback entry, fixed stop, fixed max loss).
- Rows marked `channel: unverified` surfaced in search but could not be confirmed as
  official-channel uploads; several look like third-party ThinkorSwim rebuilds and are
  listed only so they can be consciously discarded.

## Files
- `INVENTORY.md` — the prioritised inventory (Tier 1 / Tier 2 / parked / excluded).
- `candidates.csv` — the same rows in machine-readable form for the next phase.

## Next step (blocked on review)
Pick the Tier 1 rows to approve, then a Phase 2 run (on a YouTube-capable machine) would
pull transcripts for only those ids and extract rules into a Falcon-gap matrix.
