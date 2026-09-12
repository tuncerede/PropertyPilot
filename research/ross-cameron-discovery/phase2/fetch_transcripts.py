#!/usr/bin/env python3
"""Phase 2 runner: verify Tier 1 candidates and pull their transcripts.

Runs on a machine with YouTube access. Does NOT touch Falcon.

Steps per candidate (from ../candidates.csv, tier == 1 by default):
  1. yt-dlp metadata -> verify channel_id == OFFICIAL_CHANNEL_ID, capture exact
     title / upload date / duration.
  2. Skip any id present in corpus_ids.txt (the 68-video corpus, exact match).
  3. Fetch the transcript with timestamps (manual captions preferred, auto as fallback).
  4. Write out/transcripts/<id>.json and out/metadata.json; print a verification table.

Usage:
  python3 fetch_transcripts.py --plan            # offline: show what would be fetched
  python3 fetch_transcripts.py                   # full run
  python3 fetch_transcripts.py --tier 1 --tier 2 # widen scope
"""
import argparse, csv, json, os, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
OFFICIAL_CHANNEL_ID = "UCBayuhgYpKNbhJxfExYkPfA"   # Ross Cameron - Warrior Trading (@DaytradeWarrior)
CANDIDATES = HERE.parent / "candidates.csv"
CORPUS = HERE / "corpus_ids.txt"
OUT = HERE / "out"


def load_candidates(tiers):
    rows = []
    with CANDIDATES.open(newline="") as f:
        for r in csv.DictReader(f):
            if r["tier"] in tiers:
                rows.append(r)
    # dedupe by id, keep first
    seen, uniq = set(), []
    for r in rows:
        if r["video_id"] not in seen:
            seen.add(r["video_id"]); uniq.append(r)
    return uniq


def load_corpus():
    if not CORPUS.exists():
        return set()
    ids = set()
    for line in CORPUS.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            ids.add(line.split()[0])
    return ids


def fetch_metadata(video_id):
    import yt_dlp
    opts = {"quiet": True, "skip_download": True, "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
    return {
        "video_id": video_id,
        "title": info.get("title"),
        "channel_id": info.get("channel_id"),
        "channel": info.get("channel") or info.get("uploader"),
        "upload_date": info.get("upload_date"),
        "duration_s": info.get("duration"),
        "official": info.get("channel_id") == OFFICIAL_CHANNEL_ID,
    }


def fetch_transcript(video_id):
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    tl = api.list(video_id)
    try:
        t = tl.find_manually_created_transcript(["en"]); kind = "manual"
    except Exception:
        t = tl.find_generated_transcript(["en"]); kind = "auto"
    fetched = t.fetch()
    return kind, [{"start": round(s.start, 1), "dur": round(s.duration, 1), "text": s.text} for s in fetched.snippets]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tier", action="append", default=None)
    ap.add_argument("--plan", action="store_true", help="offline dry run")
    args = ap.parse_args()
    tiers = set(args.tier or ["1"])

    cands = load_candidates(tiers)
    corpus = load_corpus()
    todo = [c for c in cands if c["video_id"] not in corpus]
    skipped = [c for c in cands if c["video_id"] in corpus]

    print(f"candidates(tier {sorted(tiers)}): {len(cands)}  corpus ids loaded: {len(corpus)}  "
          f"skip(in corpus): {len(skipped)}  to fetch: {len(todo)}")
    for c in skipped:
        print(f"  SKIP  {c['video_id']}  {c['title']}")
    if not corpus:
        print("  WARNING: corpus_ids.txt is empty -> no corpus exclusion applied. Fill it before a real run.")
    if args.plan:
        for c in todo:
            print(f"  PLAN  {c['video_id']}  {c['title']}")
        return 0

    OUT.mkdir(exist_ok=True); (OUT / "transcripts").mkdir(exist_ok=True)
    meta_all, failures = [], []
    for c in todo:
        vid = c["video_id"]
        try:
            m = fetch_metadata(vid)
        except Exception as e:
            failures.append((vid, f"metadata: {e}")); print(f"  FAIL  {vid}  metadata: {e}"); continue
        m["phase1_title"] = c["title"]; m["phase1_date"] = c["upload_date"]; m["gap_codes"] = c["gap_codes"]
        if not m["official"]:
            m["transcript"] = None
            print(f"  NOT-OFFICIAL  {vid}  channel={m['channel']} ({m['channel_id']})  -> transcript not fetched")
            meta_all.append(m); continue
        try:
            kind, snippets = fetch_transcript(vid)
            (OUT / "transcripts" / f"{vid}.json").write_text(json.dumps(
                {"video_id": vid, "title": m["title"], "upload_date": m["upload_date"],
                 "transcript_kind": kind, "snippets": snippets}, indent=1))
            m["transcript"] = kind; m["n_snippets"] = len(snippets)
            print(f"  OK    {vid}  {m['upload_date']}  {kind:6s}  {m['title']}")
        except Exception as e:
            m["transcript"] = None; failures.append((vid, f"transcript: {e}"))
            print(f"  FAIL  {vid}  transcript: {e}")
        meta_all.append(m); time.sleep(1.0)  # be polite

    (OUT / "metadata.json").write_text(json.dumps(meta_all, indent=1))
    print(f"\nwrote {OUT/'metadata.json'}  transcripts: {sum(1 for m in meta_all if m.get('transcript'))}  failures: {len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
