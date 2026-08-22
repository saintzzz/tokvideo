import { CalculateMetadataFunction, Composition } from "remotion";
import { SucKhoeLongVideo, SucKhoeLongVideoProps } from "./SucKhoeLongVideo";
import { resolveLongFormDurations } from "./composition-utils";
import { FPS } from "./timing";
import { LONG_FORM_EPISODES } from "./suckhoe/long-form";

// One <Composition> per long-form episode. Landscape 1920x1080 — this
// format is regular long-form YouTube video, not a vertical Short.
export const SucKhoeLongCompositions = () => {
  return (
    <>
      {LONG_FORM_EPISODES.map((episode) => {
        const calculateMetadata: CalculateMetadataFunction<SucKhoeLongVideoProps> = async () => {
          const { segments, durationInFrames } = await resolveLongFormDurations(
            episode.beats.length,
            (beatIndex) => `audio/suckhoe-long/${episode.slug}/beat-${beatIndex}.mp3`,
            (beatIndex) => !!episode.beats[beatIndex].factReveal
          );

          return {
            props: { episode, segments },
            durationInFrames,
            fps: FPS,
            width: 1920,
            height: 1080,
          };
        };

        return (
          <Composition
            key={episode.slug}
            id={`SucKhoeLong-${episode.slug}`}
            component={SucKhoeLongVideo}
            durationInFrames={FPS * 60 * 20}
            fps={FPS}
            width={1920}
            height={1080}
            defaultProps={{ episode, segments: [] }}
            calculateMetadata={calculateMetadata}
          />
        );
      })}
    </>
  );
};
