# tokvideo - Agent Rules

## Local renders on Windows (dev machine)

The bundled `@remotion/compositor-win32-x64-msvc/ffmpeg.exe` and
`ffprobe.exe` crash on this machine (exit 0xC0EA0002, no output) — the
compositor itself (`remotion.exe`) works fine. Workaround for local
`remotion render`:

1. Download a real ffmpeg build (e.g. Gyan `ffmpeg-X.Y.Z-essentials_build`,
   tested with 7.1.1 — 9.x removed `-filter_script:a` which Remotion's
   audio preprocessing needs).
2. Create a binaries dir (e.g. `C:\Users\linhl\remotion-bin`) containing:
   - `remotion.exe` + all `*.dll` copied from
     `node_modules/@remotion/compositor-win32-x64-msvc/`
   - `ffmpeg.exe` + `ffprobe.exe` from the real build.
3. Render with `--binaries-directory=C:\Users\linhl\remotion-bin`.
4. Remotion maps codec `aac` -> `libfdk_aac` which no free Windows build
   ships. For LOCAL PREVIEW renders only, patch
   `node_modules/@remotion/renderer/dist/options/audio-codec.js`
   (`return 'libfdk_aac'` -> `return 'aac'`) — the builtin encoder at
   320k is fine. Never commit this; `npm ci` restores it. CI on ubuntu
   uses the bundled binary and needs none of this.

`remotion still` needs no ffmpeg at all — use it for quick visual checks.

## English Arena ad series

- Episodes: `src/english-arena/episodes/<slug>.json` (hook -> parts ->
  cta, real app shots in `public/images/english-arena/`).
- Voiceover: `npm run generate-voiceover:ea` (voice `vi-VN-HoaiMyNeural`,
  override via `EDGE_TTS_VOICE_EA`).
- Captions: `node scripts/backfill-captions.mjs` rebuilds karaoke JSONs
  from existing mp3s without re-running TTS.
- Render: `npm run render:ea` (all) or `node scripts/render-english-arena.mjs <slug>`.
- These are marketing assets - artifacts only, never auto-uploaded to
  YouTube. Post to FB/Zalo/TikTok/ads manually after review.
- Copy rules: Vietnamese with full diacritics; `-` only, no em/en dash;
  say "theo format đề IOE/Violympic", never "đề IOE thật" or "thay thế
  IOE"; only claim features visible in the app.
- Recapture app screenshots:
  `cd ../student-self-practice-web && node scripts/capture-ea-shots.mjs`
  (`EA_ADMIN_ONLY=1` for just the admin dashboard shots).

## Quality pipeline (free/OSS upgrades)

- AI scene images for stories: add `imagePrompts` (array, one per
  storyPart) to a suckhoe episode JSON, then run
  `node scripts/generate-story-visuals.mjs <slug>` - writes
  `public/images/suckhoe/<slug>/part-N.jpg` via Pollinations anonymous
  tier (free, quota-limited: expect HTTP 402 backoff; the script retries
  across models flux/zimage/klein). Generated paths land in the
  episode's `images` field and StoryScene auto-switches to
  image-and-caption mode with a mid-scene sub-cut.
- Voiceover post-processing is automatic in `generate-voiceover.mjs`:
  silence trim + EQ + compressor + loudnorm via ffmpeg
  (`scripts/lib/audio-polish.mjs`, set `SKIP_POLISH=1` to bypass).
- Captions: `writeAlignedCaptions` (`scripts/lib/captions.mjs`) runs
  word-level Whisper alignment for clips >= 4.5s
  (`scripts/lib/whisper-align.mjs`, `@xenova/transformers`, default
  model `Xenova/whisper-base`, override via `WHISPER_MODEL`, disable via
  `CAPTION_ALIGN=off`) and falls back to duration-proportional timings
  if alignment fails.
- Local render scripts accept `REMOTION_BIN_DIR=<dir>` to inject the
  Windows ffmpeg workaround above without editing commands.
