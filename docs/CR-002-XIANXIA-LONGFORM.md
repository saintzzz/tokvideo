# CR-002: Năm bộ truyện tiên hiệp long-form theo tập (~60 phút/tập)

Status: Implemented (retroactive CR - implemented ahead of doc, documented per rules)
Date: 2026-09-27
Requested by: Owner (channel owner directive)

## 1. What / Why

Owner request: "làm thêm 5 bộ truyện dài, theo tập, mỗi tập 60 phút về chủ đề như ở đây: https://webnovel.vn/van-co-than-de-truyen/ - đảm bảo mỗi truyện phải có cốt truyện và nhân vật khác nhau. Cách thể hiện diễn biến tình tiết gay cấn giống như truyện mẫu trên."

Five original xianxia/cultivation serialized story series on the existing long-form pipeline. Genre + pacing inspired by the reference web novel (strong hooks, escalating conflict, reversals, cliffhangers) - explicitly NOT copied: all characters, plots, names, and world details are original.

## 2. Scope

### Content (5 series x tap 1 each, ~4.2k-7.4k words of narration ≈ 40-60 min TTS @125wpm)

| Slug | Series | Premise (original) |
|---|---|---|
| `kiem-hon-thuc-tinh-tap-01` | Kiem Hon Thuc Tinh | Discarded servant disciple + thousand-year sword soul; sect built on his master's grave; conspiracy reaching three god-sects |
| `than-y-ma-de-tap-01` | Than Y Ma De | Pill sovereign reincarnated as the servant who must taste-test poisoned pills for the disciple who murdered him |
| `luyen-khi-muoi-van-nam-tap-01` | Luyen Khi Muoi Van Nam | Founder at Qi-Refining level 99 for 100k years returns to find the sect's teaching manuals were sabotaged 8,000 years ago |
| `hong-tran-nu-de-tap-01` | Hong Tran Nu De | Deposed princess + phoenix contract; her bloodline is the key to a sealed fire-source the court has hunted for 500 years |
| `ma-ton-trong-sinh-tap-01` | Ma Ton Trong Sinh | Demon sovereign reincarnated into a disciple of the righteous sect sworn to kill him; his death was staged to harvest his soul-shards |

Each series has a distinct protagonist, power system, social structure, and conspiracy arc. Episode 1s end on cliffhangers driving tap 2.

### Pipeline changes

- `src/suckhoe/long-form/types.ts`: `scene` union +8 xianxia sets (`sect-mountain`, `cultivation-cave`, `battlefield`, `arena`, `forest-night`, `throne-hall`, `cliff-edge`, `village-dusk`)
- `src/scenes-suckhoe-long/LongFormSceneBackground.tsx`: gradient + animated motif per new scene
- `src/suckhoe/long-form/index.ts`: register 5 new episodes
- `.github/workflows/render.yml`: `long_form_slug` input `choice` -> free-form `string` (default `kiem-hon-thuc-tinh-tap-01`) so any slug in `long-form/` can be dispatched
- Narrator-audiobook format: all beats `speaker: "narrator"` - no new voice mappings needed; existing `narrator` voice covers all dialogue
- No changes needed to `render-suckhoe-long.mjs` (discovers slugs by directory scan) or `generate-voiceover.mjs` (`suckhoe-long-<slug>` arg pattern already supported)

## 3. Impact assessment

- Renders are ~40-60 min of audio per episode - longer TTS generation and Remotion render time than the existing ~5-20 min episodes. Workflow timeout/compute should be observed on first dispatch.
- Uploads stay private by default (`YOUTUBE_LONG_PRIVACY_STATUS` controls) pending owner review.
- No impact on Shorts pipeline or scheduled publish jobs - long-form is dispatch-only.

## 4. Originality boundary

Reference URL is genre/pacing inspiration only. No text, names, plot events, or character relationships were taken from the source novel. Each series bible was written from scratch around a different hook (sword soul, poisoned taster, forgotten founder, phoenix contract, villain reincarnated into enemy sect).

## 5. Verification

- JSON validity + scene-union check: all 5 episodes, 0 unknown scenes, 0 non-narrator speakers
- `npx tsc --noEmit`: clean
- `npx eslint src/suckhoe/long-form src/scenes-suckhoe-long`: clean
- Duration estimate: 59 / 42 / 41 / 44 / 41 min @125wpm - narrator TTS measured slower than this in practice (VN audiobook cadence); tap 2+ episodes should target ~110-130 beats to hold ~60 min

## 6. Remaining work

- Write tap 2+ for each series (episode 1s are launch pilots per series)
- Dispatch `render.yml` with each new slug; verify voiceover gen + render + upload in CI
- Confirm real audio duration meets ~60 min target; expand beats if short
- Optional: dedicated cultivation character art for `DialogueScene` (currently narrator-only, motifs carry visuals)
