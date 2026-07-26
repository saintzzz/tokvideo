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
      {hasAudio ? <Audio src={staticFile("audio/ammuu/hook.mp3")} /> : null}

      <KenBurnsImage
        src="images/ammuu/hero.jpg"
        durationInFrames={durationInFrames}
        zoomFrom={1}
        zoomTo={1.18}
      />
      <ScrimOverlay position="full" />

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
        <KineticText
          text="Tôn Tử, nhà chiến lược vĩ đại nhất lịch sử, từng nói một câu ai cũng nên biết."
          startFrame={5}
          stagger={3}
          fontSize={54}
          fontFamily={fonts.sans}
          fontWeight={800}
          color="#F5E6C8"
          highlightColor="#C9A24B"
          highlightWords={["Tôn", "Tử,"]}
        />
      </div>
    </>
  );
};
