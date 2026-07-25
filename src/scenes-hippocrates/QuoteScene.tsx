import React from "react";
import { Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { HippocratesSilhouette } from "../components/HippocratesSilhouette";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";

export const QuoteScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();

  const attributionOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground>
      {hasAudio ? (
        <Audio src={staticFile("audio/hippocrates/quote.mp3")} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          padding: "0 70px",
        }}
      >
        <HippocratesSilhouette scale={0.6} />

        <KineticText
          text="“Hãy để thức ăn là thuốc của bạn, và thuốc là thức ăn của bạn.”"
          startFrame={5}
          stagger={4}
          fontSize={54}
          fontFamily={fonts.serif}
          fontWeight={700}
          highlightWords={["thức", "ăn", "thuốc"]}
        />

        <div
          style={{
            opacity: attributionOpacity,
            fontFamily: fonts.serif,
            fontSize: 30,
            color: "#7CB342",
            letterSpacing: 4,
          }}
        >
          — HIPPOCRATES —
        </div>
      </div>
    </NutritionBackground>
  );
};
