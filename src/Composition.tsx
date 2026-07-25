import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { GiaCatLuongVideo, GiaCatLuongVideoProps } from "./GiaCatLuongVideo";
import { FALLBACK_SECONDS, FPS, PADDING_FRAMES, SceneKey } from "./timing";

const SCENE_KEYS = Object.keys(FALLBACK_SECONDS) as SceneKey[];

const resolveSceneDuration = async (key: SceneKey) => {
  try {
    const seconds = await getAudioDurationInSeconds(
      staticFile(`audio/${key}.mp3`)
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
      durationInFrames: Math.round(FALLBACK_SECONDS[key] * FPS),
    };
  }
};

const calculateMetadata: CalculateMetadataFunction<
  GiaCatLuongVideoProps
> = async () => {
  const resolved = await Promise.all(SCENE_KEYS.map(resolveSceneDuration));

  const sceneDurations = Object.fromEntries(
    resolved.map((r) => [r.key, r.durationInFrames])
  ) as Record<SceneKey, number>;

  const hasAudio = Object.fromEntries(
    resolved.map((r) => [r.key, r.hasAudio])
  ) as Record<SceneKey, boolean>;

  const durationInFrames = resolved.reduce(
    (sum, r) => sum + r.durationInFrames,
    0
  );

  return {
    props: { sceneDurations, hasAudio },
    durationInFrames,
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

export const MyComposition = () => {
  return (
    <Composition
      id="GiaCatLuong-TuVi"
      component={GiaCatLuongVideo}
      durationInFrames={720}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        sceneDurations: {
          hook: FALLBACK_SECONDS.hook * FPS,
          quote: FALLBACK_SECONDS.quote * FPS,
          twist: FALLBACK_SECONDS.twist * FPS,
          cta: FALLBACK_SECONDS.cta * FPS,
        },
        hasAudio: { hook: false, quote: false, twist: false, cta: false },
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
