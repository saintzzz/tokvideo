import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "./scenes-suckhoe/HookScene";
import { RemedyScene } from "./scenes-suckhoe/RemedyScene";
import { StoryScene } from "./scenes-suckhoe/StoryScene";
import { StepsScene } from "./scenes-suckhoe/StepsScene";
import { CTAScene } from "./scenes-suckhoe/CTAScene";
import { MusicBed } from "./components/MusicBed";
import { ProgressBar } from "./components/ProgressBar";
import { PolishOverlay } from "./components/PolishOverlay";
import { TRANSITION_FRAMES } from "./timing";
import { SucKhoeEpisode } from "./suckhoe/types";
import { themeForEpisode } from "./suckhoe/themes";

export type SucKhoeVideoProps = {
  episode: SucKhoeEpisode;
  // Remedy episodes use the fixed keys hook/remedy/steps/cta; story
  // episodes use hook/part-0..part-N/cta, resolved per episode in
  // SucKhoeComposition — so these are keyed loosely by string.
  sceneDurations: Record<string, number>;
  hasAudio: Record<string, boolean>;
};

const transition = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
  />
);

// Generic engine for every "Suc Khoe" episode — new episodes are added as
// content (src/suckhoe/episodes/*.json), not as new scene code.
// MusicBed/ProgressBar/PolishOverlay live at the root so every scene
// inherits them without per-scene wiring.
export const SucKhoeVideo: React.FC<SucKhoeVideoProps> = ({
  episode,
  sceneDurations,
  hasAudio,
}) => {
  const theme = themeForEpisode(episode);
  const isStory = episode.kind === "story";
  return (
    <AbsoluteFill>
      <MusicBed episode={episode} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneDurations.hook}>
          <HookScene episode={episode} hasAudio={hasAudio.hook} />
        </TransitionSeries.Sequence>
        {transition()}
        {isStory ? (
          // One scene per story beat — a real tale needs 5-7 beats
          // (~90-150s total) rather than cramming into the 40s
          // remedy-style slot layout.
          episode.storyParts.map((_, i) => (
            <React.Fragment key={i}>
              <TransitionSeries.Sequence durationInFrames={sceneDurations[`part-${i}`]}>
                <StoryScene
                  episode={episode}
                  hasAudio={hasAudio[`part-${i}`]}
                  partIndex={i}
                  audioKey={`part-${i}`}
                />
              </TransitionSeries.Sequence>
              {transition()}
            </React.Fragment>
          ))
        ) : (
          <>
            <TransitionSeries.Sequence durationInFrames={sceneDurations.remedy}>
              <RemedyScene episode={episode} hasAudio={hasAudio.remedy} />
            </TransitionSeries.Sequence>
            {transition()}
            <TransitionSeries.Sequence durationInFrames={sceneDurations.steps}>
              <StepsScene episode={episode} hasAudio={hasAudio.steps} />
            </TransitionSeries.Sequence>
            {transition()}
          </>
        )}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.cta}>
          <CTAScene episode={episode} hasAudio={hasAudio.cta} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <PolishOverlay />
      <ProgressBar color={theme.accent} />
    </AbsoluteFill>
  );
};
