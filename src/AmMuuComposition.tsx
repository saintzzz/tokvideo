import { CalculateMetadataFunction, Composition } from "remotion";
import { AmMuuVideo, AmMuuVideoProps } from "./AmMuuVideo";
import { resolveSceneDurations } from "./composition-utils";
import { AMMUU_FALLBACK_SECONDS, AmMuuSceneKey, FPS, TRANSITION_FRAMES } from "./timing";

const SCENE_KEYS = Object.keys(AMMUU_FALLBACK_SECONDS) as AmMuuSceneKey[];
const TRANSITION_COUNT = SCENE_KEYS.length - 1;

const calculateMetadata: CalculateMetadataFunction<AmMuuVideoProps> = async () => {
  const { sceneDurations, hasAudio, durationInFrames } =
    await resolveSceneDurations(
      SCENE_KEYS,
      AMMUU_FALLBACK_SECONDS,
      (key) => `audio/ammuu/${key}.mp3`
    );

  return {
    props: { sceneDurations, hasAudio },
    durationInFrames: durationInFrames - TRANSITION_COUNT * TRANSITION_FRAMES,
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

export const AmMuuComposition = () => {
  return (
    <Composition
      id="AmMuu-ChienLuoc"
      component={AmMuuVideo}
      durationInFrames={690}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        sceneDurations: {
          hook: AMMUU_FALLBACK_SECONDS.hook * FPS,
          quote: AMMUU_FALLBACK_SECONDS.quote * FPS,
          twist: AMMUU_FALLBACK_SECONDS.twist * FPS,
          cta: AMMUU_FALLBACK_SECONDS.cta * FPS,
        },
        hasAudio: { hook: false, quote: false, twist: false, cta: false },
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
