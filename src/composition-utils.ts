import { staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { FPS, PADDING_FRAMES } from "./timing";

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
