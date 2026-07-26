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
import { BuyNowPointer } from "../components/BuyNowPointer";
import { fonts } from "../fonts";

export const CTAScene: React.FC<{
  hasAudio: boolean;
  durationInFrames: number;
}> = ({ hasAudio, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const cardScale = interpolate(cardSpring, [0, 1], [0.85, 1]);
  const cardOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bounce = Math.sin(frame * 0.25) * 8;

  const discOpacity = interpolate(frame, [15, 30], [0, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {hasAudio ? <Audio src={staticFile("audio/ideverray/cta.mp3")} /> : null}

      <KenBurnsImage
        src="images/ideverray/04.jpg"
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
          gap: 26,
          padding: "0 60px",
        }}
      >
        <div
          style={{
            transform: `scale(${cardScale})`,
            opacity: cardOpacity,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 20,
            padding: "26px 34px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 34,
              color: "#111",
            }}
          >
            IDEVE LAZRY
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: fonts.sans,
              fontWeight: 600,
              fontSize: 20,
              color: "#555",
            }}
          >
            Set áo đôi · 2 màu đen/trắng · Size S–XL
          </div>
          <div
            style={{
              marginTop: 10,
              display: "inline-block",
              fontFamily: fonts.sans,
              fontWeight: 700,
              fontSize: 18,
              color: "#FF3B7F",
              border: "2px solid #FF3B7F",
              borderRadius: 999,
              padding: "6px 18px",
            }}
          >
            🎁 Tặng hộp quà hình bó hoa
          </div>
        </div>

        <div
          style={{
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
              color: "#FFFFFF",
              backgroundColor: "#FF3B7F",
              borderRadius: 18,
              padding: "10px 30px",
              boxShadow: "0 10px 30px rgba(255,59,127,0.5)",
            }}
          >
            CHỐT ĐƠN NGAY
          </div>
        </div>
      </div>

      <BuyNowPointer startFrame={15} />

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: discOpacity,
          fontFamily: fonts.sans,
          fontSize: 20,
          color: "#FFFFFF",
        }}
      >
        #quangcao #aodoi #ideverray #couplecheck
      </div>
    </>
  );
};
