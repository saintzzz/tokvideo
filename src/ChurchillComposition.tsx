import { CalculateMetadataFunction, Composition } from "remotion";
import { ChurchillVideo, ChurchillVideoProps } from "./ChurchillVideo";
import { resolveSceneDurations } from "./composition-utils";
import { CHURCHILL_FALLBACK_SECONDS, ChurchillSceneKey, FPS } from "./timing";

const SCENE_KEYS = Object.keys(
  CHURCHILL_FALLBACK_SECONDS
) as ChurchillSceneKey[];

const calculateMetadata: CalculateMetadataFunction<
  ChurchillVideoProps
> = async () => {
  const { sceneDurations, hasAudio, durationInFrames } =
    await resolveSceneDurations(
      SCENE_KEYS,
      CHURCHILL_FALLBACK_SECONDS,
      (key) => `audio/churchill/${key}.mp3`
    );

  return {
    props: { sceneDurations, hasAudio },
    durationInFrames,
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

export const ChurchillComposition = () => {
  return (
    <Composition
      id="Churchill-GiaoTiep"
      component={ChurchillVideo}
      durationInFrames={750}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        sceneDurations: {
          hook: CHURCHILL_FALLBACK_SECONDS.hook * FPS,
          story: CHURCHILL_FALLBACK_SECONDS.story * FPS,
          twist: CHURCHILL_FALLBACK_SECONDS.twist * FPS,
          cta: CHURCHILL_FALLBACK_SECONDS.cta * FPS,
        },
        hasAudio: { hook: false, story: false, twist: false, cta: false },
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
