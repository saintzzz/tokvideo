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
import { NutritionBookCover } from "../components/NutritionBookCover";
import { DiseaseIconStrip } from "../components/DiseaseIconStrip";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";

export const TwistScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const coverSpring = spring({
    frame: frame - 90,
    fps,
    config: { damping: 15, mass: 0.7 },
  });
  const coverScale = interpolate(coverSpring, [0, 1], [0.7, 1]);
  const coverOpacity = interpolate(frame, [90, 108], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground>
      {hasAudio ? (
        <Audio src={staticFile("audio/hippocrates/twist.mp3")} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          padding: "0 50px",
        }}
      >
        <KineticText
          text="Hơn 500 công thức dinh dưỡng, chia theo từng nhu cầu sức khoẻ:"
          startFrame={0}
          stagger={3}
          fontSize={46}
          fontFamily={fonts.sans}
          fontWeight={800}
          highlightWords={["500", "nhu", "cầu", "sức", "khoẻ"]}
        />

        <DiseaseIconStrip startFrame={45} />

        <div
          style={{
            transform: `scale(${coverScale})`,
            opacity: coverOpacity,
          }}
        >
          <NutritionBookCover scale={0.62} />
        </div>
      </div>
    </NutritionBackground>
  );
};
