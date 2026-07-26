export const FPS = 30;

// Extra frames held after each voiceover line finishes, so scenes don't
// cut the instant the narration stops.
export const PADDING_FRAMES = 15;

// Fallback scene lengths (seconds) used only when the matching voiceover
// file hasn't been generated yet (see scripts/generate-voiceover.mjs).
export const GIA_CAT_LUONG_FALLBACK_SECONDS = {
  hook: 3,
  quote: 8,
  twist: 8,
  cta: 5,
} as const;

export type GiaCatLuongSceneKey = keyof typeof GIA_CAT_LUONG_FALLBACK_SECONDS;

export const CHURCHILL_FALLBACK_SECONDS = {
  hook: 3,
  story: 9,
  twist: 8,
  cta: 5,
} as const;

export type ChurchillSceneKey = keyof typeof CHURCHILL_FALLBACK_SECONDS;

export const HIPPOCRATES_FALLBACK_SECONDS = {
  hook: 4,
  quote: 8,
  twist: 10,
  cta: 5,
} as const;

export type HippocratesSceneKey = keyof typeof HIPPOCRATES_FALLBACK_SECONDS;

// Crossfade length (frames) between scenes in videos that use
// @remotion/transitions — each transition eats this many frames from both
// the outgoing and incoming scene, so it must be subtracted when summing
// scene durations into a composition's total duration.
export const TRANSITION_FRAMES = 15;

export const IDEVERRAY_FALLBACK_SECONDS = {
  hook: 3,
  reveal: 5,
  showcase: 12,
  cta: 5,
} as const;

export type IdeverraySceneKey = keyof typeof IDEVERRAY_FALLBACK_SECONDS;

export const AMMUU_FALLBACK_SECONDS = {
  hook: 4,
  quote: 6,
  twist: 8,
  cta: 5,
} as const;

export type AmMuuSceneKey = keyof typeof AMMUU_FALLBACK_SECONDS;
