# George Gammon — "Do This...Before It's Too Late" — transcript retrieval record

Status: **TRANSCRIPT NOT RETRIEVED.** Every route to the source was denied by the
session's organization egress policy. No passage-level findings could be made.
Nothing below is a paraphrase of the video's content; nothing has been inferred
about the rule it describes.

## Source identification (from the request and search-engine metadata only)

| Field | Value | Provenance |
|---|---|---|
| Source URL (as given) | https://youtu.be/t3UNqs4Hjks | user request |
| Canonical URL | https://www.youtube.com/watch?v=t3UNqs4Hjks | search-engine result link |
| Video ID | t3UNqs4Hjks | user request; matches search result |
| Title | Do This...Before It's Too Late | user request; confirmed by search-engine result title |
| Channel | George Gammon | search-engine snippet |
| Description (snippet) | "Learn the 3 Contrarian Steps to Protect & Grow Your Wealth During the Biggest Financial Bubble in History (The AI Bubble)" | search-engine snippet, not verified against the page |
| Publication date | Not verified. Search snippet on 2026-09-10 read "4 hours ago". | search-engine snippet only |
| Transcript type | None obtained (neither creator captions nor auto-captions nor audio) | — |
| Content hashes | None. No transcript, caption, or media bytes were received. | — |

## Retrieval attempts (2026-09-10, all failed)

Bash route (curl / yt-dlp 2026.08.19, via the session agent proxy):

- www.youtube.com, i.ytimg.com — CONNECT rejected, 403 (organization policy)
- noembed.com, yewtu.be, inv.nadeko.net, invidious.nerdvpn.de, iv.ggtyler.dev,
  pipedapi.kavin.rocks, api.piped.private.coffee, youtubetranscript.com,
  r.jina.ai, rumble.com, georgegammon.com, rebelcapitalist.com, odysee.com,
  web.archive.org, archive.org — CONNECT rejected

WebFetch route (separate egress):

- www.youtube.com (watch page and oEmbed), youtubetranscript.com, yewtu.be,
  inv.nadeko.net, r.jina.ai, archive.org, rumble.com, georgegammon.com,
  rcp.georgegammon.com, podcasts.apple.com, www.listennotes.com,
  en.wikipedia.org — all returned EGRESS_BLOCKED

WebSearch route: reachable, but returns result titles and snippets only. No
transcript text for this video is indexed in any result returned.

Audio-transcript fallback: not possible. No media bytes can be fetched, so
there is nothing to run speech-to-text on. No "established media-ingestion
method" exists in this repository (searched for transcript/yt-dlp/whisper/
ingestion tooling; none found) and no other repository is attached to the
session.

## Findings against the eight questions

Not answerable from evidence. For each of: (1) S&P 500, (2) 200-day moving
average, (3) sell/reduce condition, (4) duration below the average,
(5) price-cross vs. average-declining, (6) destination of proceeds,
(7) buy-back condition, (8) whole-portfolio vs. partial — there is no
timestamp, no quotation, no explicit rule, no interpretation, and nothing
that can be classified as "left unspecified", because the primary source was
never observed.

## What would unblock this

Any one of:

- Egress allowance for youtube.com (captions via yt-dlp `--write-auto-subs`)
  or for a caption mirror.
- The user supplies the caption file (.vtt/.srt/.json3) or an audio file into
  the session; hashes and timestamps can then be recorded from it directly.
