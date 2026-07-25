import React from "react";
import { Series } from "remotion";
import { HookScene } from "./scenes-churchill/HookScene";
import { StoryScene } from "./scenes-churchill/StoryScene";
import { TwistScene } from "./scenes-churchill/TwistScene";
import { CTAScene } from "./scenes-churchill/CTAScene";
import { ChurchillSceneKey } from "./timing";

export type ChurchillVideoProps = {
  sceneDurations: Record<ChurchillSceneKey, number>;
  hasAudio: Record<ChurchillSceneKey, boolean>;
};

export const ChurchillVideo: React.FC<ChurchillVideoProps> = ({
  sceneDurations,
  hasAudio,
}) => {
  return (
    <Series>
      <Series.Sequence durationInFrames={sceneDurations.hook}>
        <HookScene hasAudio={hasAudio.hook} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sceneDurations.story}>
        <StoryScene hasAudio={hasAudio.story} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sceneDurations.twist}>
        <TwistScene hasAudio={hasAudio.twist} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sceneDurations.cta}>
        <CTAScene hasAudio={hasAudio.cta} />
      </Series.Sequence>
    </Series>
  );
};
