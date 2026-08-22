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
import { HostSilhouette } from "../components/HostSilhouette";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";
import { SucKhoeEpisode } from "../suckhoe/types";

export const HookScene: React.FC<{
  episode: SucKhoeEpisode;
  hasAudio: boolean;
}> = ({ episode, hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const silhouetteSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const silhouetteScale = interpolate(silhouetteSpring, [0, 1], [0.7, 1]);
  const silhouetteOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NutritionBackground>
      {hasAudio ? (
        <Audio src={staticFile(`audio/suckhoe/${episode.slug}/hook.mp3`)} />
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
          padding: "0 50px",
        }}
      >
        <div
          style={{
            transform: `scale(${silhouetteScale})`,
            opacity: silhouetteOpacity,
          }}
        >
          <HostSilhouette locale={episode.locale} scale={1.6} isSpeaking={hasAudio} />
        </div>

        <KineticText
          text={episode.hook}
          startFrame={0}
          stagger={3}
          fontSize={52}
          fontFamily={fonts.sans}
          fontWeight={800}
          color="#F2FAEC"
          highlightColor="#7CB342"
        />
      </div>
    </NutritionBackground>
  );
};
