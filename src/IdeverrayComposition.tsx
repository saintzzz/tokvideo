import { CalculateMetadataFunction, Composition } from "remotion";
import { IdeverrayVideo, IdeverrayVideoProps } from "./IdeverrayVideo";
import { resolveSceneDurations } from "./composition-utils";
import {
  FPS,
  IDEVERRAY_FALLBACK_SECONDS,
  IdeverraySceneKey,
  TRANSITION_FRAMES,
} from "./timing";

const SCENE_KEYS = Object.keys(
  IDEVERRAY_FALLBACK_SECONDS
) as IdeverraySceneKey[];

const TRANSITION_COUNT = SCENE_KEYS.length - 1;

const calculateMetadata: CalculateMetadataFunction<
  IdeverrayVideoProps
> = async () => {
  const { sceneDurations, hasAudio, durationInFrames } =
    await resolveSceneDurations(
      SCENE_KEYS,
      IDEVERRAY_FALLBACK_SECONDS,
      (key) => `audio/ideverray/${key}.mp3`
    );

  return {
    props: { sceneDurations, hasAudio },
    durationInFrames: durationInFrames - TRANSITION_COUNT * TRANSITION_FRAMES,
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

export const IdeverrayComposition = () => {
  return (
    <Composition
      id="Ideverray-AoDoi"
      component={IdeverrayVideo}
      durationInFrames={750}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        sceneDurations: {
          hook: IDEVERRAY_FALLBACK_SECONDS.hook * FPS,
          reveal: IDEVERRAY_FALLBACK_SECONDS.reveal * FPS,
          showcase: IDEVERRAY_FALLBACK_SECONDS.showcase * FPS,
          cta: IDEVERRAY_FALLBACK_SECONDS.cta * FPS,
        },
        hasAudio: { hook: false, reveal: false, showcase: false, cta: false },
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
