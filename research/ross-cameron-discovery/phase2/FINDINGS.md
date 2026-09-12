# Phase 2 findings — Tier 1 transcripts vs Falcon

**Status: BLOCKED — no transcript evidence collected yet.** Nothing below is a finding.
This file holds (a) the evidence schema every finding must satisfy and (b) the register of
Phase 1 claims that the transcripts must confirm, modify, or reject. Every register row is a
*hypothesis from search-result metadata* and is marked `PENDING_TRANSCRIPT`.

## Evidence schema (one row per claimed mechanism)

| field | meaning |
|---|---|
| `video_id` | exact YouTube id, verified official (channel `UCBayuhgYpKNbhJxfExYkPfA`) |
| `timestamp` | `mm:ss` from the transcript snippet where the statement starts |
| `statement` | Ross's words (quoted, minimally trimmed) or the concrete example he walks through |
| `evidence_class` | `RULE` explicit rule he says he follows · `EXAMPLE` a worked trade that shows the rule · `ANECDOTE` a one-off story · `IMPLIED` inferred from what he did, not what he said |
| `falcon_today` | what Falcon currently does for this mechanism (from Falcon's spec, not assumed) |
| `whats_new` | the delta, in one sentence |
| `classification` | `NEW_TO_FALCON` · `ALREADY_KNOWN` · `ROSS_DISCRETION_NOT_YET_QUANTIFIABLE` · `UNCLEAR` |

Rules: no row without a timestamp; `ANECDOTE`/`IMPLIED` rows cannot be `NEW_TO_FALCON` on their
own; a Phase 1 claim with no supporting snippet after reading the full transcript is recorded as
`REJECTED_BY_TRANSCRIPT` in the register below.

## Register of Phase 1 claims to test (all `PENDING_TRANSCRIPT`)

| # | video_id(s) | Phase 1 claim (lead only) | mechanism bucket | status |
|---|---|---|---|---|
| 1 | g2lp_LiHcJ8 | Hot/cold is a spectrum; cold = few 50–100% movers; "trade the market you're in"; own P&L is the main regime clue | regime | PENDING_TRANSCRIPT |
| 2 | qButx3c0Bk0 | In cold markets Ross swaps setups, not only size | regime | PENDING_TRANSCRIPT |
| 3 | Lin4WAwzPNY | Cutting trade count is the lever that "3x'd" results | stopping / selectivity | PENDING_TRANSCRIPT |
| 4 | qfReXP_lpQE | Grades setups A/B/C and refuses B/C | selectivity | PENDING_TRANSCRIPT |
| 5 | KzVbXzkoZkA | Adds on confirmation, scales out in chunks, keeps a runner core | adding / exits | PENDING_TRANSCRIPT |
| 6 | f7Wi_8VGtPs | Earn a cushion small, then size up; give back at most half | sizing / stopping | PENDING_TRANSCRIPT |
| 7 | 5KpKVP6oi0A | Cuts max share size when conditions or performance deteriorate | sizing | PENDING_TRANSCRIPT |
| 8 | -GQjrv7RjGQ, 8KQmIREGX6E, kIZS4bU2Jpo | Daily max loss (~$4k); stop after 3 consecutive losers; sign off after losing half of profits | stopping | PENDING_TRANSCRIPT |
| 9 | yDL2mY9C1h8, QGoLN96KIDI, q5DRctM5C-Q | Big seller/buyer identification; bid stacking before breakouts; ask thinning | Level 2 | PENDING_TRANSCRIPT |
| 10 | ZqNYvNkg0_I, IqYXorgXN4o, nhAZOMZCY34 | "Clean daily" with no overhead resistance; daily gap through resistance; former-runner history | daily chart | PENDING_TRANSCRIPT |
| 11 | nM2MxYk6Eo0 | Day-2 continuation: prior-day strength, held gains, first pullback | continuation | PENDING_TRANSCRIPT |
| 12 | H34--Upw0Do, 2RA9A-IOlvo, kew1-rBx4kk, hRfgCev2TU4 | Short-interest %, float rotation ≥1×, borrow cost; squeezes differ from news runners | float / squeeze | PENDING_TRANSCRIPT |
| 13 | CZLpO0ERlnA, cipbQ5yQKH0, vnmiTC4PotU, l7Z5aqS4zpk | Trade the #1 leader; others are sympathy | selection / themes | PENDING_TRANSCRIPT |
| 14 | ocDxrUSE9nA | Catalyst tiers (FDA/contract/earnings vs fluff); news timing vs move | news quality | PENDING_TRANSCRIPT |
| 15 | FN-uqfbEVKw, ZAwjAWD45Uw, 7I-_sXZ5TV8 | Halt mechanics; halt count as momentum; dip-and-rip after resume | halts | PENDING_TRANSCRIPT |
| 16 | uJy9XIJq1cQ, nH-z-089CgM, W3jXQlgGbBc, xEc0cKy_4MI | Algo flush / sub-VWAP trap; volume and L2 checks before the break | false breakouts | PENDING_TRANSCRIPT |

## Findings table (empty until transcripts are read)

| video_id | timestamp | statement | evidence_class | falcon_today | whats_new | classification |
|---|---|---|---|---|---|---|
