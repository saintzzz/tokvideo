import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "./scenes-ideverray/HookScene";
import { RevealScene } from "./scenes-ideverray/RevealScene";
import { ShowcaseScene } from "./scenes-ideverray/ShowcaseScene";
import { CTAScene } from "./scenes-ideverray/CTAScene";
import { IdeverraySceneKey, TRANSITION_FRAMES } from "./timing";

export type IdeverrayVideoProps = {
  sceneDurations: Record<IdeverraySceneKey, number>;
  hasAudio: Record<IdeverraySceneKey, boolean>;
};

const transition = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
  />
);

export const IdeverrayVideo: React.FC<IdeverrayVideoProps> = ({
  sceneDurations,
  hasAudio,
}) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={sceneDurations.hook}>
        <HookScene hasAudio={hasAudio.hook} durationInFrames={sceneDurations.hook} />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.reveal}>
        <RevealScene
          hasAudio={hasAudio.reveal}
          durationInFrames={sceneDurations.reveal}
        />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.showcase}>
        <ShowcaseScene
          hasAudio={hasAudio.showcase}
          durationInFrames={sceneDurations.showcase}
        />
      </TransitionSeries.Sequence>
      {transition()}
      <TransitionSeries.Sequence durationInFrames={sceneDurations.cta}>
        <CTAScene hasAudio={hasAudio.cta} durationInFrames={sceneDurations.cta} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
