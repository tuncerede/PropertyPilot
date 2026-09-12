# Phase 2 — transcript verification (runner + schema)

## Why this folder exists
Phase 2 requires (1) verifying each Tier 1 id against the official channel, (2) excluding the
68-video corpus by exact id, and (3) reading transcripts with timestamps. None of the three can be
done from the Claude Code cloud sandbox this project was started in:

- `youtube.com` (and every transcript mirror tried) is blocked by the egress policy — confirmed with
  `curl` (CONNECT 403), `yt-dlp`, and `youtube-transcript-api`.
- The session has exactly one environment (`Default`, this sandbox) and one repository
  (`PropertyPilot`). No YouTube-capable machine and no Falcon/corpus repository is attached.
- The 68 corpus ids are not in this repository, so exact-id exclusion cannot be applied.

So this folder ships the runner and the evidence schema, ready to execute where YouTube is reachable.

## Run it on the YouTube-capable machine
```bash
cd research/ross-cameron-discovery/phase2
pip install -r requirements.txt
# 1. paste the 68 corpus ids into corpus_ids.txt (one per line)
# 2. dry run, then real run
python3 fetch_transcripts.py --plan
python3 fetch_transcripts.py
git add out/ corpus_ids.txt && git commit -m "Phase 2: Tier 1 metadata + transcripts" && git push
```
Outputs: `out/metadata.json` (exact title / date / channel / official flag / corpus skip) and
`out/transcripts/<id>.json` (timestamped snippets, manual captions preferred).

Once `out/` is on this branch, the extraction step (reading every transcript and filling
`FINDINGS.md` rows with timestamps and classifications) can proceed from any environment.

## Guardrails preserved
No Falcon files, thresholds, VALIDATION/OOS data, or the daily Ross-vs-Falcon automation are read
or written by anything here. The runner only reads `../candidates.csv` and writes under `out/`.
