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
