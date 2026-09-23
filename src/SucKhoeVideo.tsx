import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "./scenes-suckhoe/HookScene";
import { RemedyScene } from "./scenes-suckhoe/RemedyScene";
import { StepsScene } from "./scenes-suckhoe/StepsScene";
import { CTAScene } from "./scenes-suckhoe/CTAScene";
import { MusicBed } from "./components/MusicBed";
import { ProgressBar } from "./components/ProgressBar";
import { PolishOverlay } from "./components/PolishOverlay";
import { SucKhoeSceneKey, TRANSITION_FRAMES } from "./timing";
import { SucKhoeEpisode } from "./suckhoe/types";
import { themeForEpisode } from "./suckhoe/themes";

export type SucKhoeVideoProps = {
  episode: SucKhoeEpisode;
  sceneDurations: Record<SucKhoeSceneKey, number>;
  hasAudio: Record<SucKhoeSceneKey, boolean>;
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
  return (
    <AbsoluteFill>
      <MusicBed episode={episode} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneDurations.hook}>
          <HookScene episode={episode} hasAudio={hasAudio.hook} />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.remedy}>
          <RemedyScene episode={episode} hasAudio={hasAudio.remedy} />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.steps}>
          <StepsScene episode={episode} hasAudio={hasAudio.steps} />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.cta}>
          <CTAScene episode={episode} hasAudio={hasAudio.cta} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <PolishOverlay />
      <ProgressBar color={theme.accent} />
    </AbsoluteFill>
  );
};
