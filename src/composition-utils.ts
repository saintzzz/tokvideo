import { staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { FPS, PADDING_FRAMES } from "./timing";

// Frames a fact-reveal diagram holds on screen after its beat's narration
// finishes — fixed, not audio-driven, since the diagram is a silent visual
// reinforcement of what was just said, not a separately-narrated segment.
export const DIAGRAM_HOLD_FRAMES = 120;

/**
 * Resolves per-beat durations for a long-form episode: one entry per
 * dialogue beat (audio-driven, like resolveSceneDurations), plus a fixed
 * DIAGRAM_HOLD_FRAMES bonus immediately after any beat that has a
 * factReveal. Returns a flat, ordered list of segments to lay out as a
 * Series — each either a beat (with its index) or a diagram (tied to the
 * beat index it follows).
 */
export const resolveLongFormDurations = async (
  beatCount: number,
  audioPath: (beatIndex: number) => string,
  hasFactReveal: (beatIndex: number) => boolean
) => {
  const beatResolved = await Promise.all(
    Array.from({ length: beatCount }, (_, i) => i).map(async (i) => {
      try {
        const seconds = await getAudioDurationInSeconds(staticFile(audioPath(i)));
        return { hasAudio: true, durationInFrames: Math.round(seconds * FPS) + PADDING_FRAMES };
      } catch {
        return { hasAudio: false, durationInFrames: Math.round(3 * FPS) };
      }
    })
  );

  const segments: Array<
    | { type: "beat"; beatIndex: number; durationInFrames: number; hasAudio: boolean }
    | { type: "diagram"; beatIndex: number; durationInFrames: number }
  > = [];

  beatResolved.forEach((r, i) => {
    segments.push({ type: "beat", beatIndex: i, durationInFrames: r.durationInFrames, hasAudio: r.hasAudio });
    if (hasFactReveal(i)) {
      segments.push({ type: "diagram", beatIndex: i, durationInFrames: DIAGRAM_HOLD_FRAMES });
    }
  });

  const durationInFrames = segments.reduce((sum, s) => sum + s.durationInFrames, 0);

  return { segments, durationInFrames };
};

export const resolveSceneDurations = async <Key extends string>(
  keys: Key[],
  fallbackSeconds: Record<Key, number>,
  audioPath: (key: Key) => string
) => {
  const resolved = await Promise.all(
    keys.map(async (key) => {
      try {
        const seconds = await getAudioDurationInSeconds(
          staticFile(audioPath(key))
        );
        return {
          key,
          hasAudio: true,
          durationInFrames: Math.round(seconds * FPS) + PADDING_FRAMES,
        };
      } catch {
        return {
          key,
          hasAudio: false,
          durationInFrames: Math.round(fallbackSeconds[key] * FPS),
        };
      }
    })
  );

  const sceneDurations = Object.fromEntries(
    resolved.map((r) => [r.key, r.durationInFrames])
  ) as Record<Key, number>;

  const hasAudio = Object.fromEntries(
    resolved.map((r) => [r.key, r.hasAudio])
  ) as Record<Key, boolean>;

  const durationInFrames = resolved.reduce(
    (sum, r) => sum + r.durationInFrames,
    0
  );

  return { sceneDurations, hasAudio, durationInFrames };
};
