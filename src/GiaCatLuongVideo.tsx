import React from "react";
import { Series } from "remotion";
import { HookScene } from "./scenes/HookScene";
import { QuoteScene } from "./scenes/QuoteScene";
import { TwistScene } from "./scenes/TwistScene";
import { CTAScene } from "./scenes/CTAScene";
import { GiaCatLuongSceneKey } from "./timing";

export type GiaCatLuongVideoProps = {
  sceneDurations: Record<GiaCatLuongSceneKey, number>;
  hasAudio: Record<GiaCatLuongSceneKey, boolean>;
};

export const GiaCatLuongVideo: React.FC<GiaCatLuongVideoProps> = ({
  sceneDurations,
  hasAudio,
}) => {
  return (
    <Series>
      <Series.Sequence durationInFrames={sceneDurations.hook}>
        <HookScene hasAudio={hasAudio.hook} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sceneDurations.quote}>
        <QuoteScene hasAudio={hasAudio.quote} />
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
