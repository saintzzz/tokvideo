import { CalculateMetadataFunction, Composition } from "remotion";
import { SucKhoeVideo, SucKhoeVideoProps } from "./SucKhoeVideo";
import { resolveSceneDurations } from "./composition-utils";
import {
  FPS,
  SUCKHOE_FALLBACK_SECONDS,
  SucKhoeSceneKey,
  TRANSITION_FRAMES,
} from "./timing";
import { EPISODES } from "./suckhoe/episodes";

const SCENE_KEYS = Object.keys(SUCKHOE_FALLBACK_SECONDS) as SucKhoeSceneKey[];
const TRANSITION_COUNT = SCENE_KEYS.length - 1;

const defaultSceneDurations = Object.fromEntries(
  SCENE_KEYS.map((key) => [key, SUCKHOE_FALLBACK_SECONDS[key] * FPS])
) as Record<SucKhoeSceneKey, number>;

const defaultHasAudio = Object.fromEntries(
  SCENE_KEYS.map((key) => [key, false])
) as Record<SucKhoeSceneKey, boolean>;

// One <Composition> per episode in src/suckhoe/episodes — add a new
// episode there and it shows up here automatically, no new scene code.
export const SucKhoeCompositions = () => {
  return (
    <>
      {EPISODES.map((episode) => {
        const calculateMetadata: CalculateMetadataFunction<
          SucKhoeVideoProps
        > = async () => {
          const { sceneDurations, hasAudio, durationInFrames } =
            await resolveSceneDurations(
              SCENE_KEYS,
              SUCKHOE_FALLBACK_SECONDS,
              (key) => `audio/suckhoe/${episode.slug}/${key}.mp3`
            );

          return {
            props: { episode, sceneDurations, hasAudio },
            durationInFrames: durationInFrames - TRANSITION_COUNT * TRANSITION_FRAMES,
            fps: FPS,
            width: 1080,
            height: 1920,
          };
        };

        return (
          <Composition
            key={episode.slug}
            id={`SucKhoe-${episode.slug}`}
            component={SucKhoeVideo}
            durationInFrames={690}
            fps={FPS}
            width={1080}
            height={1920}
            defaultProps={{
              episode,
              sceneDurations: defaultSceneDurations,
              hasAudio: defaultHasAudio,
            }}
            calculateMetadata={calculateMetadata}
          />
        );
      })}
    </>
  );
};
