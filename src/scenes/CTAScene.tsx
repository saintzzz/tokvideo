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
import { BookCover } from "../components/BookCover";
import { fonts } from "../fonts";

export const CTAScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const coverSpring = spring({ frame, fps, config: { damping: 13, mass: 0.6 } });
  const coverScale = interpolate(coverSpring, [0, 1], [0.75, 1]);

  const ctaOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bounce = Math.sin(frame * 0.25) * 10;

  const discOpacity = interpolate(frame, [10, 25], [0, 0.75], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneBackground>
      {hasAudio ? <Audio src={staticFile("audio/cta.mp3")} /> : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
        }}
      >
        <div style={{ transform: `scale(${coverScale})` }}>
          <BookCover scale={0.72} />
        </div>

        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${bounce}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 46,
              color: "#F5E6C8",
            }}
          >
            Xem ngay trong giỏ hàng ↓
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: fonts.serif,
              fontSize: 28,
              color: "#E3B23C",
            }}
          >
            Tử Vi Luận Giải — Khải Tâm
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: discOpacity,
          fontFamily: fonts.sans,
          fontSize: 20,
          color: "#8B93A8",
        }}
      >
        #quangcao #tuvi #sachhaymoingay
      </div>
    </SceneBackground>
  );
};
