# CR-002: Truyện ma long-form - "Loi nguyen gieng cu" (5 tap x ~18-20 phut)

## What changes

New serialized horror arc on the existing `suckhoe-long` pipeline
(1920x1080 landscape, narrator-only beats), replacing the never-launched
xianxia arc as the active long-form front.

- 5 episode JSONs in `src/suckhoe/long-form/`, one continuous ghost
  story, ~44-62 beats each. Measured narration (NamMinh at rate -5%)
  lands at ~18-20 minutes per episode; owner accepted this length
  over slower TTS or longer scripts.
- Scene backgrounds become AI-generated stills (one image per scene
  setting, reused across beats) instead of procedural gradient+motif -
  the visual-consistency requirement the owner set ("hinh anh lien quan
  chinh chu hon, dong nhat hon giua cac doan va cac tap").
- Narrator voice: `vi-VN-NamMinhNeural` (already the VOICE_VI default)
  with a slower, lower horror prosody profile, set per-episode.
- Render on CI via the existing `suckhoe-long` dispatch job; uploads
  stay private-by-default for human review (existing gate, unchanged).

## Why

Channel reports (2026-10) show the Shorts factory is suppressed:
17 videos, ~1 view each. The watch-time path (4000h) can only come from
long-form, and only original, consistent, episode-authored visuals move
the pipeline away from the "narrated slideshow with superficial
differences" pattern YouTube flags as inauthentic content.

## Impact assessment

- `src/suckhoe/long-form/types.ts`: `scene` union gains horror scene
  names; episode gains optional `sceneImages`, `prosody`. Backwards
  compatible - existing episodes unchanged.
- `LongFormSceneBackground`: optional `image` prop; when set, renders
  the still with slow Ken Burns + vignette and skips the motif/particles
  layer. Procedural path kept as fallback so ungenerated episodes still
  render.
- `DialogueScene` / `SucKhoeLongVideo`: pass-through of the resolved
  image path per beat.
- `scripts/generate-voiceover.mjs`: optional per-episode narrator
  prosody override. Default behavior unchanged.
- `scripts/generate-story-visuals.mjs`: `--long` mode reads
  `scenePrompts` (map scene -> prompt), writes
  `public/images/suckhoe-long/<slug>/<scene>.jpg`, fills `sceneImages`.
- `scripts/render-suckhoe-long.mjs`: `REMOTION_BIN_DIR` env support,
  same as render-english-arena (Windows workaround only).
- No schema/data-model/RBAC impact; no existing feature altered.

## Constraints honored

- Free/OSS only: Pollinations anonymous tier for images (with retry
  backoff - quota is thin, generation is resumable and cached), Edge TTS
  NamMinh for narration, Whisper ONNX for captions where used.
- No auto-publish: the suckhoe-long CI job uploads private; publishing
  is manual after review.
- Vietnamese full diacritics; ASCII `-` only.

## Estimate

Types/scenes/scripts: small. Content authoring (5 x ~4200-word horror
scripts) and image generation (quota-paced) are the bulk. Renders run
on CI.
