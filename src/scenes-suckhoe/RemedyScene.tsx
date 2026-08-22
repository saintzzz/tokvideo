import React from "react";
import { Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { NutritionBackground } from "../components/NutritionBackground";
import { HealerSilhouette } from "../components/HealerSilhouette";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";
import { SucKhoeEpisode } from "../suckhoe/types";

export const RemedyScene: React.FC<{
  episode: SucKhoeEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const frame = useCurrentFrame();

  const remedyOpacity = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground>
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/remedy.mp3`)} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          padding: "0 55px",
        }}
      >
        <HealerSilhouette scale={1.1} isSpeaking={hasAudio} />

        <KineticText
          text={episode.ingredientName}
          startFrame={0}
          stagger={4}
          fontSize={58}
          fontFamily={fonts.serif}
          fontWeight={700}
          color="#F2FAEC"
          highlightColor="#7CB342"
          highlightWords={episode.ingredientName.split(" ")}
        />

        <div
          style={{
            opacity: remedyOpacity,
            fontFamily: fonts.sans,
            fontSize: 32,
            lineHeight: 1.5,
            color: "#D7E8CB",
            textAlign: "center",
            maxWidth: 850,
          }}
        >
          {episode.remedy}
        </div>
      </div>
    </NutritionBackground>
  );
};
