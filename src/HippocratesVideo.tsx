import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "./scenes-hippocrates/HookScene";
import { QuoteScene } from "./scenes-hippocrates/QuoteScene";
import { TwistScene } from "./scenes-hippocrates/TwistScene";
import { CTAScene } from "./scenes-hippocrates/CTAScene";
import { HippocratesSceneKey, TRANSITION_FRAMES } from "./timing";

export type HippocratesVideoProps = {
  sceneDurations: Record<HippocratesSceneKey, number>;
  hasAudio: Record<HippocratesSceneKey, boolean>;
};

const transition = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
  />
);

export const HippocratesVideo: React.FC<HippocratesVideoProps> = ({
  sceneDurations,
  hasAudio,
}) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={sceneDurations.hook}>
        <HookScene hasAudio={hasAudio.hook} />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.quote}>
        <QuoteScene hasAudio={hasAudio.quote} />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.twist}>
        <TwistScene hasAudio={hasAudio.twist} />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.cta}>
        <CTAScene hasAudio={hasAudio.cta} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
