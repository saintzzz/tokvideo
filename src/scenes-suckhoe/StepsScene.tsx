import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { fonts } from "../fonts";
import { SucKhoeEpisode } from "../suckhoe/types";

const StepRow: React.FC<{ index: number; text: string; startFrame: number }> = ({
  index,
  text,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const s = spring({ frame: local, fps, config: { damping: 16, mass: 0.5 } });
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(s, [0, 1], [-40, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
        transform: `translateX(${x}px)`,
        maxWidth: 880,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#7CB342",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 28,
          color: "#0e150d",
        }}
      >
        {index + 1}
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: 32,
          lineHeight: 1.4,
          color: "#F2FAEC",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const StepsScene: React.FC<{
  episode: SucKhoeEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  return (
    <NutritionBackground>
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/steps.mp3`)} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 40,
          padding: "0 90px",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 40,
            color: "#7CB342",
          }}
        >
          Cách làm
        </div>

        {episode.steps.map((step, i) => (
          <StepRow key={i} index={i} text={step} startFrame={i * 20} />
        ))}
      </div>
    </NutritionBackground>
  );
};
