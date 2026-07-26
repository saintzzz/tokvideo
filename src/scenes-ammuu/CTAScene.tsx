import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { KenBurnsImage } from "../components/KenBurnsImage";
import { ScrimOverlay } from "../components/ScrimOverlay";
import { AmMuuBookCovers } from "../components/AmMuuBookCovers";
import { BuyNowPointer } from "../components/BuyNowPointer";
import { fonts } from "../fonts";

export const CTAScene: React.FC<{
  hasAudio: boolean;
  durationInFrames: number;
}> = ({ hasAudio, durationInFrames }) => {
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
    <>
      {hasAudio ? <Audio src={staticFile("audio/ammuu/cta.mp3")} /> : null}

      <KenBurnsImage
        src="images/ammuu/hero.jpg"
        durationInFrames={durationInFrames}
        zoomFrom={1}
        zoomTo={1.1}
      />
      <ScrimOverlay position="full" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <div style={{ transform: `scale(${coverScale})` }}>
          <AmMuuBookCovers scale={0.85} />
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
              color: "#1a1206",
              backgroundColor: "#C9A24B",
              borderRadius: 18,
              padding: "10px 30px",
              boxShadow: "0 10px 30px rgba(201,162,75,0.45)",
            }}
          >
            XEM NGAY GIỎ HÀNG
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: fonts.serif,
              fontSize: 26,
              color: "#F5E6C8",
            }}
          >
            Thuyết Âm Mưu và Thuyết Dương Mưu, SBOOKS
          </div>
        </div>
      </div>

      <BuyNowPointer startFrame={15} />

      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: discOpacity,
          fontFamily: fonts.sans,
          fontSize: 20,
          color: "#B9A98C",
        }}
      >
        #quangcao #sachhaymoingay #chienluoc
      </div>
    </>
  );
};
