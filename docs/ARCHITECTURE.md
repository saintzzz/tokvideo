# Architecture — tokvideo upgrade (2026-09-24)

Brownfield additions only — no restructure of the existing Remotion
layout. New code lands in three seams that already exist:

## 1. Render-time seam (`src/`)

```
src/
  components/
    MusicBed.tsx        # per-category ambient track + volume envelope
    KaraokeCaption.tsx  # word-level synced caption (reads captions/*.json via staticFile fetch)
    Sfx.tsx             # thin <Audio> wrapper w/ volume + startAt helpers
    SafeZone.tsx        # dev-only overlay showing Shorts UI occlusion bands
    ProgressBar.tsx     # top hairline progress over composition duration
    PolishOverlay.tsx   # vignette + animated film grain
  suckhoe/
    themes.ts           # category -> palette/motif map (locale-aware accents)
    captions/           # generated word-timing JSON per scene (public/)
```

Data flow for captions: `generate-voiceover.mjs` measures each scene mp3
(ffprobe when present, else size-estimate) → allocates duration across
words weighted by char length → writes `public/captions/<slug>/<scene>.json`
→ `KaraokeCaption` fetches via `staticFile` + `useCurrentFrame`.

`SucKhoeVideo` gains `<MusicBed/>`, `<ProgressBar/>`, `<PolishOverlay/>`
once at the composition root so every scene inherits them without edits;
scenes opt into `KaraokeCaption` and theme via existing props.

## 2. Script seam (`scripts/`)

```
scripts/
  lib/
    retry.mjs           # exp-backoff wrapper (2s base, x2, jitter, 4 tries)
    git-sync.mjs        # pull --rebase + push helper for state commits
    audio-probe.mjs     # ffprobe duration w/ graceful absence fallback
  validate-episodes.mjs # schema + compliance lint (R-01)
  strategy-report.mjs   # analytics -> strategy-<locale>.md (M-01/M-05)
  mine-comments.mjs     # comments -> comment-ideas.json (M-02)
  trend-scan.mjs        # niche scan -> trends-<locale>.md (M-04)
  check-automation-health.mjs # Task Scheduler heartbeat (R-06)
```

Shared conventions: all new scripts are ESM `.mjs`, zero new npm deps,
fail loudly with per-item error lists, and are idempotent (safe to
re-run). State files keep the existing "commit to repo" pattern — R-07
only centralizes the pull-rebase incantation the workflow comments
already demand.

## 3. CI seam (`.github/workflows/render.yml`)

- New `lint-validate` job first in the graph: `npm ci`, `npm run lint`,
  `npm run validate:episodes`. All render/publish jobs get
  `needs: lint-validate` (added without touching their internals).
- New `strategy-report` job: weekly (`cron`), runs script, commits
  `src/suckhoe/strategy-*.md` via the git-sync helper pattern.
- New `automation-health` step inside the daily report window: runs
  R-06 check; failure posts a warning annotation (not a pipeline block —
  the check reports *local* scheduler staleness).

## Key decisions (ADRs)

- **D1 Estimated karaoke timing, not TTS word boundaries.** msedge-tts
  exposes boundary events only over its streaming API; proportional
  allocation over real mp3 duration is deterministic, testable offline,
  and visually indistinguishable at caption granularity. Ruling: accept
  ±80ms drift per word.
- **D2 Generated starter music.** ffmpeg-synthesized pad loops are real
  audio, copyright-clean, and replaceable — better than shipping a
  music feature with no track. Files live in `public/music/` with a
  README noting they're placeholders for licensed tracks.
- **D3 Validation hand-rolled, no zod.** The repo currently has zero
  runtime deps for validation; a ~150-line checker with per-file error
  reporting is more maintainable here than a new dependency. Field rules
  mirror `src/suckhoe/types.ts` (single source of truth stays the type).
- **D4 Dedupe via recorded videoId.** Root cause of the EN 4× duplicate:
  `published.json` recorded only timestamps, so a crashed/missed state
  commit re-uploaded the same slug. Recording `videoId` and refusing
  second uploads is idempotent at the API boundary, not just the queue.
- **D5 Suppression-safe defaults.** No work here raises publish cadence;
  Q-* changes are exactly the "different fingerprint" CHANNEL-STRATEGY
  requires before cadence can be re-evaluated.

## Risk register

| Risk | Mitigation |
|---|---|
| Music/SFX bloat repo | starter tracks < 500 KB each, loops; document replacement path |
| Karaoke drift on long scenes | per-scene files (max ~15s), drift bounded |
| Validator false-positives on legacy episodes | run on full catalog now; fix data, not the rule |
| CI `needs:` chain slows urgent manual renders | `workflow_dispatch` bypass stays: manual choice "all" still works |
| Strategy report misreads md format | parser is tolerant (regex row scan), unit-smoke on current files |
