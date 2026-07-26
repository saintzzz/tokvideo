import React from "react";
import { Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KenBurnsImage } from "../components/KenBurnsImage";
import { ScrimOverlay } from "../components/ScrimOverlay";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";

export const QuoteScene: React.FC<{
  hasAudio: boolean;
  durationInFrames: number;
}> = ({ hasAudio, durationInFrames }) => {
  const frame = useCurrentFrame();

  const attributionOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {hasAudio ? <Audio src={staticFile("audio/ammuu/quote.mp3")} /> : null}

      <KenBurnsImage
        src="images/ammuu/hero.jpg"
        durationInFrames={durationInFrames}
        zoomFrom={1.2}
        zoomTo={1.35}
        panX={-4}
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
          gap: 22,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        <KineticText
          text="Biết người biết ta, trăm trận trăm thắng."
          startFrame={5}
          stagger={4}
          fontSize={58}
          fontFamily={fonts.serif}
          fontWeight={700}
          color="#F5E6C8"
          highlightColor="#C9A24B"
          highlightWords={["biết", "Biết"]}
        />

        <div
          style={{
            opacity: attributionOpacity,
            fontFamily: fonts.serif,
            fontSize: 32,
            color: "#C9A24B",
            letterSpacing: 4,
          }}
        >
          TÔN TỬ
        </div>
      </div>
    </>
  );
};
