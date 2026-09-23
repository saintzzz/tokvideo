# PRD — tokvideo quality, reliability & marketing-agent upgrade

Date: 2026-09-24. Binding context: `docs/CHANNEL-STRATEGY.md` (both Shorts
channels are at zero distribution; every requirement below serves either
(a) changing the content fingerprint, (b) making the pipeline safe, or
(c) closing the analytics→content loop).

Legend: R = reliability, Q = video quality, M = marketing agent.

## Requirements (RTM)

### Reliability

- **R-01 Episode validator.** `scripts/validate-episodes.mjs` — for every
  `src/suckhoe/episodes/*.json` and `src/suckhoe/long-form/*.json`: required
  fields/types, slug matches filename & unique, `locale ∈ {vi,en}`,
  `category ∈ playlist-map.json`, banned-claim lint (`chữa`, `trị bệnh`,
  `thay thuốc`, `cure`, `treat`, `diagnose`, `guaranteed`), mandatory
  folk-wisdom framing check, `caution` type. Exit 1 with a per-file error
  list. npm script `validate:episodes`.
- **R-02 Retry helper.** `scripts/lib/retry.mjs` — exponential backoff
  (base 2s, ×2, jitter, max 4) for network ops; applied to TTS synthesis
  and every YouTube API call.
- **R-03 TTS hardening.** generate-voiceover: voice healthcheck (1-sample
  synthesis) before a batch; fallback voice list per locale; per-file
  sanity (exists, size > 4 KB, duration via ffprobe when available).
  Fail loudly listing which scene files failed — never silent-fallback.
- **R-04 CI quality gate.** New `lint-validate` job in render.yml running
  `npm run lint` + `npm run validate:episodes` on every push/schedule;
  render/publish jobs `needs:` it.
- **R-05 Publish dedupe fix.** Normalize `published.json` values
  (string → `{publishedAt}`) on read/write; record `videoId` returned by
  YouTube; `upload-youtube.mjs` refuses to upload a slug whose entry has
  a `videoId`, and `publish-next` skips slugs already recorded — kills
  the 4× duplicate-upload class of bug seen on EN 2026-09-17.
- **R-06 Automation heartbeat.** `scripts/check-automation-health.mjs` —
  verifies the three Task Scheduler log files were written within 36h;
  prints which job is stale and exits 1. Wired to a daily CI step so a
  dead local machine surfaces as a red check, not silence.
- **R-07 Git state helper.** `scripts/lib/git-sync.mjs` — single
  `pull --rebase`-then-push helper used by every script that commits
  state files (published.json, reports, logs).

### Video quality (fingerprint change)

- **Q-01 Music bed.** `MusicBed` component playing
  `public/music/{category|default}-{locale}.mp3` (when present) for the
  full composition, volume envelope (fade in/out, duck under voice).
  Starter tracks generated procedurally (ffmpeg-synthesized soft pads,
  per category) so the feature is real on day one; files are replaceable
  with licensed tracks without code change.
- **Q-02 SFX.** Three generated assets (transition whoosh, step pop, CTA
  chime) in `public/sfx/` wired into TransitionSeries + StepsScene +
  CTAScene at low volume.
- **Q-03 Karaoke captions.** generate-voiceover additionally emits
  `captions/{slug}/{scene}.json` word timings (proportional allocation
  over measured mp3 duration). `KaraokeCaption` component renders
  word-by-word highlight inside RemedyScene/StepsScene, off by default
  for legacy videos, on for suckhoe episodes.
- **Q-04 Category theming.** `src/suckhoe/themes.ts` — palette + motif
  per category; `NutritionBackground` accepts a `theme` prop; scenes use
  it so consecutive uploads visibly differ.
- **Q-05 Ingredient imagery.** Optional `images: string[]` in episode
  JSON (paths under `public/images/suckhoe/<slug>/`); RemedyScene/StepsScene
  render `KenBurnsImage` when provided, current visuals otherwise.
  Validator checks referenced files exist when field present.
- **Q-06 Hook variants.** `hookStyle ∈ {question,statement,countdown,pov}`
  optional per episode; HookScene renders a distinct intro animation per
  style; when absent, style rotates deterministically by slug hash.
- **Q-07 Polish + safe zones.** `SafeZone` dev overlay, bottom-safe
  padding for captions/CTA, top progress bar component, subtle
  vignette+grain overlay component applied to suckhoe scenes.

### Marketing agent

- **M-01 Strategy report.** `scripts/strategy-report.mjs` — parses
  `channel-report-{vi,en}.md` + `published.json` → per-category stats,
  cadence/suppression status, recommended next categories, publish-slot
  suggestion → writes `src/suckhoe/strategy-{locale}.md`. npm script +
  weekly CI job committing the file.
- **M-02 Comments→content.** `scripts/mine-comments.mjs` — runs
  youtube-list-new-comments, classifies questions, emits
  `src/suckhoe/comment-ideas.json` episode stubs; writer prompt updated
  to consume it.
- **M-03 Title variants.** daily-content-writer prompt: emit 3 candidate
  `channelTitle` per episode with distinct hook patterns; writer picks
  using strategy file guidance.
- **M-04 Trend radar.** `scripts/trend-scan.mjs` — wraps
  youtube-search-similar for the niche, dedupes, writes
  `src/suckhoe/trends-{locale}.md` consumed by the writer prompt.
- **M-05 Publish-slot learning.** strategy-report buckets performance by
  publish hour and recommends the best slots (advisory — human changes
  cron).

## Acceptance criteria (headline)

1. `npm run lint` and `npm run validate:episodes` green on the full
   episode catalog (all current JSON files pass or are fixed in this PR).
2. One suckhoe episode renders end-to-end locally (`render-suckhoe.mjs
   <slug>`) producing an mp4 with: audible music bed, SFX, karaoke
   captions, themed background — verified via ffprobe streams + frame
   extraction.
3. `publish-next-suckhoe.mjs` run twice for the same slug results in
   exactly one upload path (second run no-ops on recorded videoId).
4. `strategy-report` produces a file with per-category table +
   recommendation block; CI job defined.
5. No new runtime dependencies beyond dev tooling already present;
   zero secrets in repo; all new scripts documented in README.

## Non-goals

- New channel creation, ad spend, thumbnail pipeline for Shorts (Shorts
  ignores custom thumbs), migrating state out of the repo.
- Retrying the FlowKit-style external video gen (separate project).
