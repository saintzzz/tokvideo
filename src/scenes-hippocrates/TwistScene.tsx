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
          gap: 40,
          padding: "0 70px",
        }}
      >
        <KineticText
          text="Hơn 500 công thức dinh dưỡng chuẩn y khoa, cho từng loại bệnh cụ thể:"
          startFrame={0}
          stagger={3}
          fontSize={38}
          fontFamily={fonts.sans}
          fontWeight={700}
          highlightWords={["500", "chuẩn", "y", "khoa"]}
        />

        <DiseaseIconStrip startFrame={45} />

        <div
          style={{
            transform: `scale(${coverScale})`,
            opacity: coverOpacity,
          }}
        >
          <NutritionBookCover scale={0.5} />
        </div>
      </div>
    </NutritionBackground>
  );
};
