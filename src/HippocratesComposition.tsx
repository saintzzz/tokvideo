import { CalculateMetadataFunction, Composition } from "remotion";
import { HippocratesVideo, HippocratesVideoProps } from "./HippocratesVideo";
import { resolveSceneDurations } from "./composition-utils";
import {
  FPS,
  HIPPOCRATES_FALLBACK_SECONDS,
  HippocratesSceneKey,
  TRANSITION_FRAMES,
} from "./timing";

const SCENE_KEYS = Object.keys(
  HIPPOCRATES_FALLBACK_SECONDS
) as HippocratesSceneKey[];

const TRANSITION_COUNT = SCENE_KEYS.length - 1;

const calculateMetadata: CalculateMetadataFunction<
  HippocratesVideoProps
> = async () => {
  const { sceneDurations, hasAudio, durationInFrames } =
    await resolveSceneDurations(
      SCENE_KEYS,
      HIPPOCRATES_FALLBACK_SECONDS,
      (key) => `audio/hippocrates/${key}.mp3`
    );

  return {
    props: { sceneDurations, hasAudio },
    // TransitionSeries overlaps adjacent scenes by TRANSITION_FRAMES each,
    // so the total timeline is shorter than the sum of scene durations.
    durationInFrames: durationInFrames - TRANSITION_COUNT * TRANSITION_FRAMES,
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

export const HippocratesComposition = () => {
  return (
    <Composition
      id="Hippocrates-DinhDuong"
      component={HippocratesVideo}
      durationInFrames={800}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        sceneDurations: {
          hook: HIPPOCRATES_FALLBACK_SECONDS.hook * FPS,
          quote: HIPPOCRATES_FALLBACK_SECONDS.quote * FPS,
          twist: HIPPOCRATES_FALLBACK_SECONDS.twist * FPS,
          cta: HIPPOCRATES_FALLBACK_SECONDS.cta * FPS,
        },
        hasAudio: { hook: false, quote: false, twist: false, cta: false },
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
