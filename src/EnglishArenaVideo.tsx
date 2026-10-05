import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { EaHookScene } from "./scenes-ea/EaHookScene";
import { EaShowcaseScene } from "./scenes-ea/EaShowcaseScene";
import { EaCtaScene } from "./scenes-ea/EaCtaScene";
import { ProgressBar } from "./components/ProgressBar";
import { PolishOverlay } from "./components/PolishOverlay";
import { EA_GOLD } from "./scenes-ea/EaBackdrop";
import { TRANSITION_FRAMES } from "./timing";
import { EnglishArenaEpisode } from "./english-arena/types";

export type EnglishArenaVideoProps = {
  episode: EnglishArenaEpisode;
  sceneDurations: Record<string, number>;
  hasAudio: Record<string, boolean>;
};

const transition = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
  />
);

// Pain-first ad engine: hook (pain) -> showcase beats (agitate + product
// proof) -> CTA. New ads are added as JSON in src/english-arena/episodes,
// not as new scene code.
export const EnglishArenaVideo: React.FC<EnglishArenaVideoProps> = ({
  episode,
  sceneDurations,
  hasAudio,
}) => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneDurations.hook}>
          <EaHookScene episode={episode} hasAudio={hasAudio.hook} />
        </TransitionSeries.Sequence>
        {transition()}
        {episode.parts.map((_, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence
              durationInFrames={sceneDurations[`part-${i}`]}
            >
              <EaShowcaseScene
                episode={episode}
                hasAudio={hasAudio[`part-${i}`]}
                partIndex={i}
                audioKey={`part-${i}`}
              />
            </TransitionSeries.Sequence>
            {transition()}
          </React.Fragment>
        ))}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.cta}>
          <EaCtaScene episode={episode} hasAudio={hasAudio.cta} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <ProgressBar color={EA_GOLD} />
      <PolishOverlay />
    </AbsoluteFill>
  );
};
