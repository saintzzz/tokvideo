import { CalculateMetadataFunction, Composition } from "remotion";
import { EnglishArenaVideo, EnglishArenaVideoProps } from "./EnglishArenaVideo";
import { resolveSceneDurations } from "./composition-utils";
import { FPS, TRANSITION_FRAMES } from "./timing";
import { EA_EPISODES } from "./english-arena/episodes";

// One <Composition> per ad in src/english-arena/episodes — add a new
// episode JSON there and it shows up here automatically.
export const EnglishArenaCompositions = () => {
  return (
    <>
      {EA_EPISODES.map((episode) => {
        const keys = [
          "hook",
          ...episode.parts.map((_, i) => `part-${i}`),
          "cta",
        ];
        const fallbackSeconds = Object.fromEntries(
          keys.map((k) => [k, k === "hook" ? 5 : k === "cta" ? 6 : 9])
        );
        const defaultSceneDurations = Object.fromEntries(
          keys.map((k) => [k, (fallbackSeconds[k] ?? 9) * FPS])
        );
        const defaultHasAudio = Object.fromEntries(keys.map((k) => [k, false]));

        const calculateMetadata: CalculateMetadataFunction<
          EnglishArenaVideoProps
        > = async () => {
          const { sceneDurations, hasAudio, durationInFrames } =
            await resolveSceneDurations(
              keys,
              fallbackSeconds,
              (key) => `audio/english-arena/${episode.slug}/${key}.mp3`
            );

          return {
            props: { episode, sceneDurations, hasAudio },
            durationInFrames:
              durationInFrames - (keys.length - 1) * TRANSITION_FRAMES,
            fps: FPS,
            width: 1080,
            height: 1920,
          };
        };

        return (
          <Composition
            key={episode.slug}
            id={`EnglishArena-${episode.slug}`}
            component={EnglishArenaVideo}
            durationInFrames={600}
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
