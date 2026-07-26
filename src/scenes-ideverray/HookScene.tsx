import React from "react";
import { Audio, staticFile } from "remotion";
import { KenBurnsImage } from "../components/KenBurnsImage";
import { ScrimOverlay } from "../components/ScrimOverlay";
import { KineticText } from "../components/KineticText";
import { fonts } from "../fonts";

export const HookScene: React.FC<{
  hasAudio: boolean;
  durationInFrames: number;
}> = ({ hasAudio, durationInFrames }) => {
  return (
    <>
      {hasAudio ? (
        <Audio src={staticFile("audio/ideverray/hook.mp3")} />
      ) : null}

      <KenBurnsImage
        src="images/ideverray/03.jpg"
        durationInFrames={durationInFrames}
        zoomFrom={1.05}
        zoomTo={1.25}
      />
      <ScrimOverlay position="full" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 50px",
        }}
      >
        <KineticText
          text="Nhìn như một bó hoa hồng... nhưng KHÔNG PHẢI!"
          startFrame={5}
          stagger={4}
          fontSize={64}
          fontFamily={fonts.sans}
          fontWeight={800}
          color="#FFFFFF"
          highlightColor="#FF3B7F"
          highlightWords={["KHÔNG", "PHẢI!"]}
        />
      </div>
    </>
  );
};
