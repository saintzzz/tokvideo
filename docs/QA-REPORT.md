# QA Report — Reliability (W2), Quality (W1), Marketing (W3)

Date: 2026-09-24 · Branch: main · Environment: macOS (dev), Node 22.19.0

## Verified

| Check | Command | Result |
|---|---|---|
| Episode validation + compliance lint | `node scripts/validate-episodes.mjs` | PASS — 0 errors, 49 advisory warnings (missing category / missing folk-wisdom framing) |
| TypeScript strict | `npx tsc --noEmit` | PASS — clean |
| ESLint | `npx eslint src` | PASS — clean |
| New/changed scripts syntax | `node --check` × 12 | PASS — all |
| Automation heartbeat | `node scripts/check-automation-health.mjs` | PASS (function) — correctly reports all 7 jobs stale on this dev machine (logs are produced by Windows Task Scheduler on the content machine; none exist locally) |
| Strategy report | `node scripts/strategy-report.mjs` | PASS — 25/25 VI + 25/25 EN report videos matched to episodes; wrote strategy.md/json |
| Publish-slot learning | `node scripts/publish-slots.mjs` | PASS — joined 43 publishes to views; recommended UTC slots 5/6/7 |
| Title variants | `node scripts/title-variants.mjs` | PASS — 206 variant sets written |
| Audio asset generation | `node scripts/generate-audio-assets.mjs` | PASS — 11 music pads + 3 SFX synthesized via ffmpeg |
| Render smoke test | `npx remotion still SucKhoe-gung-mat-ong --frame=60` | PASS — category theme palette, pattern-interrupt hook, vignette/grain, progress bar all render correctly |

## Partially verified (environment-limited)

- **Full video render**: `remotion render` aborts on this machine because the bundled compositor (`compositor-darwin-x64`) requires macOS 15+ and its ffprobe crashes probing audio (`Symbol not found: _AVCaptureDeviceTypeContinuityCamera`). This predates the change — it affects any composition with audio. CI renders on Ubuntu runners and is unaffected. `remotion still` proves the React render path is sound.
- **TTS voiceover generation**: retry + fallback + mp3-probing code paths verified by inspection/`--check`; a live run requires Edge TTS network access and was not exercised end-to-end here.
- **YouTube API paths** (upload dedupe live-fire, comments-to-content, trend-radar): degrade cleanly with exit 0 when `YOUTUBE_*` env vars are absent. Dedupe logic handles both `published.json` value shapes (string legacy + object) — verified by inspection and a dry normalization test.

## Known gaps / follow-ups

- Music beds are ffmpeg-synthesized starter pads — intentionally replaceable under the same filenames in `public/music/` with licensed tracks (see `scripts/generate-audio-assets.mjs`).
- Karaoke captions render only when `public/captions/<videoId>/<scene>.json` exists (emitted by the updated `generate-voiceover.mjs` on its next run).
- `ingredient images` (Q-05) render when `episode.images` is populated — no episodes populate it yet; writers/ingest must add `images` arrays pointing at `public/` assets.
- `SafeZone` is a dev overlay — intentionally not mounted in `SucKhoeVideo` (production renders would paint it).
