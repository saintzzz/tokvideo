# Weekly Improver Log - Truyen Ma Dai Ky

## 2026-11-22 (third run)

**Data seen:**
- channel-report-vi (28d): 9292 views (was 5757), 1631 watch-min (was 1115),
  +39 net subs (was +25), 294 subs. Third consecutive week up.
- Retention recovered: 3/13 videos under 15% avg (was 5/7 last week). The
  2026-11-11 beat-1 hook fix is landing - den-dau-xanh teasers hold 21-36%,
  quan-tai-troi longs 15.6-21.9% at 110-132s avg view. No further hook
  tightening warranted.
- New bottleneck is long-form CTR. Longs now get real browse/suggested
  impressions (quan-tai-troi-tap-01 2911, tap-02 1752, den-dau-xanh-tap-02
  825, tap-01 368) but convert at 0.0-1.7% while teasers sit at 2.5-8.5%.
- Root cause found on inspection: the live long thumbnails for the two
  arcs with the most impressions carry a visible tofu box (missing glyph)
  at the end of headline line 1 - "Bai Tha[]", "Ong[]", "Doi[]", "Vang[]".
  The drawtext fix (per-line textfiles, 7734ed4, 2026-11-18) postdates all
  these uploads; only den-dau-xanh-tap-02 was ever re-rendered. Confirmed
  defect on 8 thumbs: den-dau-xanh taps 01/03/04/05, chiec-khan-trang taps
  02/03/04/05.
- The "Shorts -> Long funnel" metric is structurally blind: it counts
  SHORTS-sourced views on longs, but longs are never distributed in the
  Shorts feed and pinned-comment taps attribute to other source types.
  Its own premise comment ("long videos get ~0 browse/suggested
  impressions") is now contradicted by the reach data. The query already
  fetches every source type but threw the breakdown away.

**Decision:** one theme - long-form discovery. Repair the visibly broken
thumbnails that sit on the highest-impression videos, and make the funnel
table report where long views actually enter so next week's data is
actionable.

**Changes:**
- Regenerated `thumb-composed.jpg` locally (full ffmpeg + Arial) for the 8
  confirmed-defect thumbs with the current make-long-thumbnail.mjs. All 8
  verified visually - identical layout, boxes gone. The watchdog's
  fix-thumbnails md5-diff picks these up and pushes them to YouTube on its
  next tick (<=6 pushes/run, ~2 watchdog cycles to cover all 8).
- `scripts/channel-report.mjs`: funnel block now keeps the full
  insightTrafficSourceType breakdown it already fetched and prints a
  "Top sources" column per long video; summary line explains the Shorts
  column's blind spot; stale "only discovery path" comment updated.

**Not changed, and why:**
- Titles: keyword-first format ("Truyen Ma Co Thay | ...") vs premise-first
  is a plausible CTR factor, but teaser-vs-long CTR comparison is confounded
  by different impression surfaces (feed vs browse). Fix the unambiguous
  rendering defect first; revisit title order only if CTR stays <1% after
  repaired thumbs have had a week in the field.
- Hooks/retention: improving on its own (3/13 vs 5/7 under 15%).
- Cadence/render.yml: teaser views still spiky (0-943), subs rising, no
  upload-limit errors - no evidence for a slot change.
- quan-tai-troi-tap-01's murky abstract still (2911 imp, 0.58% CTR - worst
  of all) has no tofu but a weak subject; changing gen-thumb-visuals
  guidance without more data is premature. Note it for next week.
- Retired jobs untouched; ledgers only appended by upload scripts;
  thumb-sync.json left alone (watchdog owns it).

## 2026-11-15 (second run)

**Data seen:**
- channel-report-vi (28d): 5757 views (was 4118), 1115 watch-min (was 710),
  +25 net subs (was +16), 283 subs. Trend up across the board.
- Reach table landed for the first time (channel_reach_basic_a1 CSVs). Long
  episodes get real impressions: cau-khi-tap-04 236, cay-da-tap-02 116,
  cau-khi-tap-01 104, cay-da-tap-01 103, cau-khi-tap-05 68, cau-khi-tap-03 62.
- Found a metric bug while reading it: the report's `CTR%` column prints the
  CSV's raw 0-1 ratio unscaled - "0.05" reads as 0.05% but is actually 5%.
  Verified: 236 imp x 0.05 = ~12 clicks ~ the video's 11 views;
  103 x 0.01 = ~1 ~ its 1 view. True CTR is 1-5% - normal for this scale, so
  no thumbnail emergency. The mislabel nearly produced a wrong diagnosis.
- Teaser->long conversion still ~0.3%: cau-khi-tap-05-teaser 969 views vs
  cau-khi-tap-05 long 3 views; chiec-khan-trang-tap-01-teaser 712 views in <1d.
  The pinned comment is the only bridge and its copy was generic
  ("Nghe TRON TAP day du tren kenh") with no episode identifier.
- Long retention still weak (cau-khi/cay-da longs 1.3-24.5%) but every
  measured episode predates last week's beat-1 hook fix - too early to judge.

**Decision:** one theme - the teaser->long handoff. Fix the CTR metric that
misreads the click surface, and name the concrete episode in the pinned
comment so the only bridge tells viewers exactly what they get.

**Changes:**
- `scripts/channel-report.mjs`: CTR now displayed as a real percent (x100);
  comment notes the CSV field is a 0-1 ratio.
- `scripts/upload-long-teaser.mjs` + `scripts/pin-teaser-comments.mjs`:
  teaser pinned comment now reads `Nghe TRON TAP "<Arc> - Tap N" tai day`
  instead of generic "day du tren kenh". pin-teaser-comments hoists the
  episode JSON read so both branches share arcLabel. Only new/unpinned
  teasers get the new copy - existing pins untouched (no churn).

**Not changed, and why:**
- Hook rules / queue-refill: last week's beat-1 fix is in-flight only; all
  measured longs were written before it. Re-tightening now = acting without
  new evidence.
- Cadence/render.yml: teaser views spiky (0-969), not the sustained >100
  signal required to add slots; no upload-limit errors this week.
- Thumbnails: true CTR 1-5% is acceptable on 60-236 impressions; one video
  at 0% on 62 imp is too small a sample to conclude weakness.
- Legacy/retired jobs untouched; ledgers only appended by upload scripts.

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
