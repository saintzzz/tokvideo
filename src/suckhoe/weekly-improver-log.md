# Weekly Improver Log - Truyen Ma Dai Ky

## 2026-11-11 (first run)

**Data seen:**
- channel-report-vi (28d): 4118 views, 710 watch-min, +16 net subs, 275 subs total.
- Funnel: 5/7 videos under 15% avg retention. Mapped videoIds via published-long.json -
  ALL low-retention rows are long-form episodes (mieu-hoang taps 3-5, cau-khi tap-01:
  5.7-13.9%, viewers gone in 13-34s of a ~4min video). Teasers retain fine
  (44.6%, one at 493% = looping).
- Teaser->long conversion near zero: cau-khi teasers 886/249 views but longs 0-11 views.
- Review: winning arcs hu-ma-ga (352 avg teaser views), cau-khi (229), loi-nguyen-gieng-cu
  (189); dead arcs dung-tra-loi (1.0), chuyen-do-dem (0.6), dem-kham-liem (0.0).
  Motif steering already auto-applied into strategy-directives.json.
- Manual beat-1 audit: losing arcs open with narrator self-intro or exposition
  ("Nghe cua toi thuo truoc la buon trau...", "Nguoi ta don rang..."); winning arcs
  open on the cursed object/taboo itself (cau khi, cay da). Correlates with funnel.

**Decision:** one theme - first-30-seconds hook on long-form. Teasers reuse the same
first beats, so this fixes both surfaces at once.

**Changes:**
- `scripts/queue-refill.mjs` SCHEMA_NOTE: new mandatory rule - BEAT 1 of every episode
  must open on a concrete disturbing image/event (cursed object, corpse, strange sound,
  taboo breaking); bans occupation/name/age intros, "nguoi ta don rang", generic
  scenery/weather opens. Beat 2 must escalate into a concrete unanswered question;
  exposition deferred to beat 3+.
- `scripts/queue-refill.mjs` arcPrompt: tap 1 no longer "dat boi canh" - opens at the
  moment the taboo breaks or its first consequence.
- `scripts/pin-teaser-comments.mjs`: replaced an em-dash in pinned-comment copy with a
  hyphen (violated the hyphen-only Vietnamese copy rule; upload-long-teaser already
  uses `-`).

**Not changed, and why:**
- Cadence/render.yml cron: teaser views are spiky (0-886), subs rising (+16) but not a
  sustained >100-everywhere signal; no upload-limit errors. No evidence for a change.
- Titles/thumbnails: premise-first teaser titles already perform on winning arcs; no
  look-alike flag in the review.
- Review script: retention lives in channel-report (Analytics scope), not reachable via
  videos.list - adding it here is out of scope and redundant with channel-report.
- In-flight queue (23 unpublished episodes): prompt changes only affect NEW arcs;
  normalization/ledger untouched, fully backward-compatible.
