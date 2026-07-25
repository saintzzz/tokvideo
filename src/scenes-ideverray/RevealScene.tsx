import React from "react";
import { Audio, staticFile } from "remotion";
import { KenBurnsImage } from "../components/KenBurnsImage";
import { ScrimOverlay } from "../components/ScrimOverlay";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";

export const RevealScene: React.FC<{
  hasAudio: boolean;
  durationInFrames: number;
}> = ({ hasAudio, durationInFrames }) => {
  return (
    <>
      {hasAudio ? (
        <Audio src={staticFile("audio/ideverray/reveal.mp3")} />
      ) : null}

      <KenBurnsImage
        src="images/ideverray/01.jpg"
        durationInFrames={durationInFrames}
        zoomFrom={1.18}
        zoomTo={1}
      />
      <ScrimOverlay position="bottom" />

      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        <KineticText
          text="Set áo đôi IDEVE LAZRY"
          startFrame={0}
          stagger={4}
          fontSize={58}
          fontFamily={fonts.sans}
          fontWeight={800}
          color="#FFFFFF"
          highlightColor="#FF3B7F"
          highlightWords={["IDEVE", "LAZRY"]}
        />
        <KineticText
          text="Tặng kèm hộp quà hình bó hoa cực độc đáo"
          startFrame={20}
          stagger={2}
          fontSize={30}
          fontFamily={fonts.sans}
          fontWeight={600}
          color="#F0E6EA"
        />
      </div>
    </>
  );
};
