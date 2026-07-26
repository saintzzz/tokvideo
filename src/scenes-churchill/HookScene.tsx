import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneBackground } from "../components/SceneBackground";
import { ChurchillSilhouette } from "../components/ChurchillSilhouette";
import { fonts } from "../fonts";

export const HookScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [0.85, 1]);
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const silhouetteOpacity = interpolate(frame, [10, 30], [0, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneBackground>
      {hasAudio ? <Audio src={staticFile("audio/churchill/hook.mp3")} /> : null}

      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: silhouetteOpacity,
        }}
      >
        <ChurchillSilhouette scale={1.3} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 55px",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            opacity,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 66,
            lineHeight: 1.3,
            color: "#F5E6C8",
            textShadow: "0 4px 24px rgba(0,0,0,0.6)",
          }}
        >
          Một người phụ nữ từng nói ông nên bị{" "}
          <span
            style={{
              display: "inline-block",
              color: "#1a1206",
              backgroundColor: "#E3B23C",
              borderRadius: 16,
              padding: "2px 18px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            }}
          >
            đầu độc
          </span>
          . Câu trả lời của ông khiến cả nước Anh bật cười.
        </div>
      </div>
    </SceneBackground>
  );
};
