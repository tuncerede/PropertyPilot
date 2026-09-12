# Inventory — Warrior Trading videos outside the small-account corpus

Legend: **id** = YouTube video id (`https://www.youtube.com/watch?v=<id>`). Dates are upload
dates as reported by search metadata. `S` = YouTube Short. `?` = official-channel status unverified.

Falcon gap codes used below:
`REGIME` market hot/cold · `ENTRY` entry timing · `EXIT` exits / holding winners ·
`RISK` risk management · `CATALYST` news quality · `L2` Level 2 / tape ·
`DAILY` daily-chart setups · `CONT` continuation setups · `FLOAT` float / short interest / squeeze ·
`THEME` themes & sympathy · `SELECT` stock selection / focus · `STRUCT` market structure (halts, VWAP, traps)

---

## Tier 1 — highest value, directly on a stated Falcon gap

| # | Video (id, date) | Gap | What appears new | Why it may matter to Falcon |
|---|---|---|---|---|
| 1 | **The Key to Hot vs Cold Market Trading** (`g2lp_LiHcJ8`, 2024-10-23) | REGIME | Ross's explicit hot/cold spectrum: cold = few 50–100% movers, choppy; hot = multiple 50–100%+ runners. "Trade the market you're in." Says the biggest regime clue is your own recent P&L. | Falcon has no regime state. A regime classifier (count of >50% gainers, recent Falcon/Ross P&L streak) could gate size and trade count. |
| 2 | **Testing a New Strategy for this cold market** (`qButx3c0Bk0`, 2026-03-30) | REGIME | Most recent example of Ross changing *strategy*, not just size, when the market is cold. | Shows what he actually swaps in during cold periods — candidate for a "cold-mode" setup list rather than a single ruleset. |
| 3 | **Stop Overtrading: How Doing Less Made Me 3x** (`Lin4WAwzPNY`, 2026-01-01) | RISK / SELECT | Trade-count reduction as the lever that tripled results; selectivity rules. | Falcon likely trades every qualifying signal. A per-day cap or "A-setup only" filter is a direct, testable change (later, not now). |
| 4 | **The Discipline NOT to Trade Low Quality Setups** (`qfReXP_lpQE`, n/d) | SELECT | Setup grading (A/B/C quality) and refusing B/C setups. | Falcon needs a setup-quality score, not just pass/fail thresholds. |
| 5 | **Ultimate Guide on ADDING to Winners with Scaling (live stream)** (`KzVbXzkoZkA`, 2023-04-04) | EXIT / RISK | Scaling *in* on confirmation and scaling *out* in chunks; holding a runner core; where he adds. | Directly addresses "holding winners longer". Falcon's exits are probably all-out; a partial-exit + runner model is the biggest EXIT gap. |
| 6 | **This is Why Profit Cushion is So Important…** (`f7Wi_8VGtPs`, 2025-08) | RISK | Cushion-based sizing: earn a cushion with small size first, then scale up; give back at most half the day's profit. | Falcon uses fixed size / fixed max loss. Cushion-scaled size and a "give-back-half" stop are new rule types. |
| 7 | **Reducing Max Share Size** (`5KpKVP6oi0A`, 2024-04-12) | RISK / REGIME | Explicitly cutting max size when conditions or personal performance deteriorate. | Links size to regime + streak; complements #1 and #6. |
| 8 | **MAX LOSS** (`-GQjrv7RjGQ`, 2024-11) · **MAX LOSS RED DAY** (`8KQmIREGX6E`) · **MAX LOSS RED DAY (mistakes were made)** (`kIZS4bU2Jpo`) | RISK | Hard rules: daily max loss (~$4k), 3 consecutive losers = stop, lose half of profits = sign off. Post-mortems of days the rules were broken. | Falcon may have a max-loss but almost certainly not the consecutive-loser stop or the profit-give-back stop. |
| 9 | **Reading Level 2 Was HARD Until I Learned This Easy 3-Step Trick** (`yDL2mY9C1h8`, 2024-05-04) · **3 Secrets for using Level 2 to Predict Breakouts** (`QGoLN96KIDI`, 2020-01-14) · **How to use Level 2 (with ZERO experience)** (`q5DRctM5C-Q`, 2024-03-14) | L2 | Big seller / big buyer identification, bid stacking before breakouts, ask thinning, spread behaviour. | Falcon has no order-book features. Even a proxy (spread, bid/ask size imbalance, print aggressiveness) is new signal. |
| 10 | **The Importance of The Daily Chart** (`ZqNYvNkg0_I`, n/d) · **Over 300% in 1 day with a Gap on the Daily Chart** (`IqYXorgXN4o`, 2024-06-24) · **Momentum Day Trading Strategies** (`nhAZOMZCY34`, 2016-08-08) | DAILY | "Suitable daily chart" pillar: clean daily with no overhead resistance / room to run; daily gap through resistance; former runner history. | Falcon likely screens intraday only. Daily-resistance distance and "clean daily" are computable filters. |
| 11 | **Day Trading a "Continuation" Setup** (`nM2MxYk6Eo0`, 2026-03) | CONT | Day-2 / multi-day continuation criteria: prior-day strength, holding gains, first pullback on day 2. | Falcon probably only trades day-1 gappers. Continuation is a distinct setup family. |
| 12 | **I'm Looking For The NEXT 1,000% Short Squeeze** (`H34--Upw0Do`, 2025-11-30) · **a 780% Short Squeeze at 8am!** (`2RA9A-IOlvo`, 2026-05) · **Shorts Got Squeezed AGAIN! +500%** (`kew1-rBx4kk`, 2026-08) · **How to Trade Low Float Stock Runners** (`hRfgCev2TU4`, 2020-10) | FLOAT | Short-interest %, float rotation (≥1× float traded), cost-to-borrow, how squeezes differ from news runners. | Falcon has float but likely not short-interest or float-rotation. These are the FLOAT gap. |
| 13 | **Trading the #1 Leading Gainer & MOST OBVIOUS Stock Today** (`CZLpO0ERlnA`, 2024-07-18) · **The Leading Gainer Gives The Biggest Profits Today** (`cipbQ5yQKH0`, 2025-07-14) · **Did You Find The Obvious Stock?** (`vnmiTC4PotU`, 2025-05-22) · **There's ONE Stock On Watch for Monday** (`l7Z5aqS4zpk`, 2026-08-09) | SELECT / THEME | "Trade the obvious stock": rank by % gain + volume + news, concentrate on the #1 leader; others are sympathy. | Falcon probably treats all qualifying tickers equally. A leader-rank feature and a "leader vs sympathy" tag are new. |
| 14 | **Trading Breaking News Was HARD Until I Learned This…** (`ocDxrUSE9nA`, n/d) | CATALYST | Catalyst tiers (FDA / contract / earnings / partnership vs fluff PRs), timing of the news vs the move. | Falcon's news feature is likely binary. A catalyst-quality score is the CATALYST gap. |
| 15 | **Trading Halts Explained (Common Halt Reasons & Resumption Times)** (`FN-uqfbEVKw`, 2025-02-16) · **Dip & Rip on HALT Resumption!** (`ZAwjAWD45Uw`, 2024-07-02) · **41 Circuit Breaker Halts?!** (`7I-_sXZ5TV8`, 2024-06-05) | STRUCT | LULD halt mechanics, resumption behaviour, halt-count as a momentum indicator, dip-and-rip after resume. | Falcon likely ignores halts. Halt events are both a risk flag and an entry trigger. |
| 16 | **Avoiding the False Breakout & Algo Flush** (`uJy9XIJq1cQ`, 2022-06-23) · **Indicators for Avoiding False Breakouts** (`nH-z-089CgM`, 2022-08-09) · **The "Sub VWAP Trap"** (`W3jXQlgGbBc`, 2024-07-15) · **Too Many False Breakouts -$2,500** (`xEc0cKy_4MI`, 2019-04-16) | ENTRY / STRUCT | Why breakouts fail (algo flushes, sub-VWAP traps), what to check before the break (volume, L2, VWAP side). | Adds pre-entry disqualifiers Falcon likely lacks (below-VWAP, no volume on break). |

## Tier 2 — useful, but narrower or partly overlapping known rules

| # | Video (id, date) | Gap | What appears new | Why it may matter |
|---|---|---|---|---|
| 17 | **The REAL Reason Pre-Market Trading Is Better…** (`BZwJFPk3cBM`, 2026-07-03) · **Day Trading the Leading Pre-Market Gainers** (`zTMeTAbbtsM`, 2025-02-28) · **When do I trade Pre-Market?** (`UwjyQpl9hQU`) · **A 1,000% Pre-Market Squeeze then a 100% Biotech Gain** (`AuSHflRILjU`, 2025-10-24) | ENTRY / STRUCT | Pre-market entry rules, 7–9:30 behaviour, when pre-market is *more* tradeable than the open. | Only relevant if Falcon can act pre-market. |
| 18 | **Day Trading the Break of VWAP Setup** (`P5Sn_mWJdy0`, 2026-06-25) · **Trading the Break of VWAP Setup** (`aIqF9OvWYZ4`, 2024-03-07) · **Ross Avoids Trading Stocks Below VWAP** (`WLR6M9dqbmQ`, S, 2024-10-04) | ENTRY / STRUCT | VWAP as a hard side filter and as a reclaim setup. | Cheap filter if VWAP isn't already in Falcon. |
| 19 | **Day Trading the 1-Minute Dip & Rip Strategy** (`6w-7geIsq1A`, 2024-08-21) | ENTRY | Dip-and-rip criteria (depth of dip, reclaim candle). | Second entry family beyond micro-pullback. |
| 20 | **Increased Volume During the Opening Bell** (`WCX3lR9-lOw`, 2024-11-09) · **Why Relative Volume Matters In Day Trading** (`AQ-2_TWZweY`) | SELECT | RVOL ≥3–5× and opening-bell volume expansion as confirmation. | Probably known; confirm thresholds only. |
| 21 | **Reverse Splits & Secondary Offerings** (`zah2D5eLPLI`, 2022-12-19) · **+$15,113.96 Day Trading a SPAC and a Recent Reverse Split Setup** (`jpPgEAAVMxY`, 2025-12-31) | SELECT / RISK | Dilution risk (S-3, warrants, offerings), and the post-reverse-split squeeze setup. | A filings-based disqualifier / enhancer Falcon lacks. |
| 22 | **THIS is the best time of day to Day Trade** (`v21qoYNw4Cw`, S, 2023-10-30) · **My Afternoon Trades & Why The S&P 500 Bounced Off The Lows** (`lgpcgyVPQ-g`, 2025-04-07) | REGIME / STRUCT | Time-of-day edge; index context on small-cap momentum. | Time window and SPY-context gates. |
| 23 | **My Proven 3 Step System for Recovering Losses** (`4WXrIW5k-hc`) · **5 MUST HAVE Skills for Day Trading Success** (`q2bFqtniOJw`) | RISK | Post-drawdown re-entry protocol (size down, prove accuracy, size back up). | Drawdown-state machine for Falcon sizing. |
| 24 | **Watch List for FRIDAY & The Most Important Setup I'll be Watching!** (`HTgPBJIKoHg`) · **Watch List for MONDAY!** (`Voixr-cPSIM`) · **Day Trading Watch List and Game Plan for Monday!** (`SYiYw1Aixyk`) | SELECT / DAILY | Applied 5-Pillars checklist on real tickers; reference the 5 Pillars PDF. | Good labelled examples of daily-chart + catalyst grading. |
| 25 | **Ultimate Beginners Guide to Timing Entries & Exits for Momentum/Trend Trading** (`ZS8x6xK8-Vk`, ?) | ENTRY / EXIT | Entry/exit timing walkthrough. | Verify it is official-channel before use. |

## Parked — gap confirmed but no single official video found yet

| Gap | Finding | Suggested follow-up |
|---|---|---|
| THEME / sympathy | No dedicated official YouTube video surfaced. Concept is documented in Ross's Medium piece *Capitalizing on Momentum and Sympathy Momentum* and the Warrior Trading News definition (2023-10-13): sympathy momentum = secondary tickers moving on the leader's news; Ross treats it as lower-risk than the leader late in its move. | Search the daily morning-show archive and podcast for "sympathy"; extract examples from #13's leader videos. |
| L2 / tape (time & sales) | Only a Warrior Trading site clip *Time and Sales Window* found; no recent official YouTube tape-reading video. | Combine with #9. |
| Podcast (456 eps, playlist `PL1xI23WKVWicsaGYpcuE19v3qzhUX6SVD`) | Separate audio corpus; episodes cover entries, exits, indicators, psychology. Not enumerable from this sandbox. | Enumerate titles on a YouTube-capable machine; cherry-pick regime / exit episodes. |
| Live morning-show archive (~2h daily) | Highest-fidelity source for L2 and exits in real time, but far too large for bulk processing. | Sample only specific days referenced by Tier 1 videos. |

## Surfaced but likely third-party — discard unless verified

`o7aqpFAZ-KE` Warrior Trading's PreMarket Scanner (Free in ThinkorSwim) · `M2a_bLFEN0w` $10M Pre-Market Scanner ·
`JiGRJAy4Ufg` $1M Momentum Scanner · `0PNVuLVvFuE` $5M Breakout Strategy · `99j0TuIBlDY` I Built Warrior Trading's $1M Strategy in ThinkorSwim ·
`1FKu4LH0Xss` How to AVOID False Breakouts · `Wwr5bWaC_MI` How to Spot False Breakouts · `xkqouY8PwOg` Lesson 01 – The Bull Trap ·
`mLOFuCvd5Lo` How To Use VOLUME in Trading (Full Course) · `sxjsqauWE9E` / `A-G9L_EwQX4` / `b2guOX-v6RE` reaction & review videos.

## Excluded as likely already in the 68-video corpus (challenge-series family)

`4syXgXshgsc` What Beginners Get Wrong About Level 2 — Day 4 SAC · `iIC62xnblLc` The ONLY Pattern I'm Trading — Day 2 SAC ·
`0qQR-VmmaY0` Day 2 of My New Small Account Challenge (2021) · `-6gIqlVhxeI` I Reset My Account to $2,000 (AGAIN) Ep 1 ·
`FuDhJrtboDE` Day 1 of Day Trading with $2,000 at Webull · `cWph88qKZ0w` Day 3 Webull · `1ZM1u762e8U` Day 5 Webull (High Short Interest Squeeze) ·
`pKHzgYSBCEc` Day 10 Webull · `8SWCCRLg1p0` Ultimate Guide to Trading in a Small Account · `xGIa8Vg0PWM` Growing a $2k Account to $65,662.04 in 30 Days ·
playlist `PLSVVJ-3WcEd2_NCwZmfTLV2ezNtJ-gtGw` ($500 challenge).
If any of these are NOT in the corpus, `1ZM1u762e8U` (short-interest squeeze) and `4syXgXshgsc` (Level 2) are the two worth promoting to Tier 1.

---

## Recommended review order
1. Regime + sizing cluster: #1, #2, #6, #7, #8 — one coherent "state machine" for Falcon.
2. Exits: #5 (scaling) — the single biggest behavioural gap.
3. Selection quality: #3, #4, #13, #14 — trade less, trade the leader, grade the catalyst.
4. New signal sources: #9 (L2), #10 (daily), #12 (short interest), #15 (halts), #16 (traps).
5. Then Tier 2 and the parked items.
