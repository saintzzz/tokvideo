import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "./scenes-ammuu/HookScene";
import { QuoteScene } from "./scenes-ammuu/QuoteScene";
import { TwistScene } from "./scenes-ammuu/TwistScene";
import { CTAScene } from "./scenes-ammuu/CTAScene";
import { AmMuuSceneKey, TRANSITION_FRAMES } from "./timing";

export type AmMuuVideoProps = {
  sceneDurations: Record<AmMuuSceneKey, number>;
  hasAudio: Record<AmMuuSceneKey, boolean>;
};

const transition = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
  />
);

export const AmMuuVideo: React.FC<AmMuuVideoProps> = ({
  sceneDurations,
  hasAudio,
}) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={sceneDurations.hook}>
        <HookScene hasAudio={hasAudio.hook} durationInFrames={sceneDurations.hook} />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.quote}>
        <QuoteScene
          hasAudio={hasAudio.quote}
          durationInFrames={sceneDurations.quote}
        />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.twist}>
        <TwistScene
          hasAudio={hasAudio.twist}
          durationInFrames={sceneDurations.twist}
        />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.cta}>
        <CTAScene hasAudio={hasAudio.cta} durationInFrames={sceneDurations.cta} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
