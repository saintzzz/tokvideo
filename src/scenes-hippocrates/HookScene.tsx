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
import { HippocratesSilhouette } from "../components/HippocratesSilhouette";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";

export const HookScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const silhouetteSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const silhouetteScale = interpolate(silhouetteSpring, [0, 1], [0.7, 1]);
  const silhouetteOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground>
      {hasAudio ? (
        <Audio src={staticFile("audio/hippocrates/hook.mp3")} />
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
          padding: "0 80px",
        }}
      >
        <div
          style={{
            transform: `scale(${silhouetteScale})`,
            opacity: silhouetteOpacity,
          }}
        >
          <HippocratesSilhouette scale={0.85} />
        </div>

        <KineticText
          text="Hơn 2.000 năm trước, cha đẻ của y học hiện đại từng nói một câu vẫn còn nguyên giá trị."
          startFrame={0}
          stagger={3}
          fontSize={46}
          fontFamily={fonts.sans}
          fontWeight={800}
          highlightWords={["y", "học", "hiện", "đại"]}
        />
      </div>
    </NutritionBackground>
  );
};
