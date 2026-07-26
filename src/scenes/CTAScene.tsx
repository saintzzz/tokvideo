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
import { BuyNowPointer } from "../components/BuyNowPointer";
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
          <BookCover scale={0.92} />
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
              display: "inline-block",
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 58,
              color: "#241a10",
              backgroundColor: "#E3B23C",
              borderRadius: 18,
              padding: "10px 30px",
              boxShadow: "0 10px 30px rgba(227,178,60,0.45)",
            }}
          >
            XEM NGAY GIỎ HÀNG
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: fonts.serif,
              fontSize: 28,
              color: "#F5E6C8",
            }}
          >
            Tử Vi Luận Giải — Khải Tâm
          </div>
        </div>
      </div>

      <BuyNowPointer startFrame={15} />

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
