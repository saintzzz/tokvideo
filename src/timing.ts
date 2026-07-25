export const FPS = 30;

// Fallback scene lengths (seconds) used only when the matching voiceover
// file hasn't been generated yet (see scripts/generate-voiceover.mjs).
export const FALLBACK_SECONDS = {
  hook: 3,
  quote: 8,
  twist: 8,
  cta: 5,
} as const;

// Extra frames held after each voiceover line finishes, so scenes don't
// cut the instant the narration stops.
export const PADDING_FRAMES = 15;

export type SceneKey = keyof typeof FALLBACK_SECONDS;
