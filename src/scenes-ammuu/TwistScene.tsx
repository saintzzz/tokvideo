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
import { KineticText } from "../components/KineticText";
import { AmMuuBookCovers } from "../components/AmMuuBookCovers";
import { fonts } from "../fonts";

export const TwistScene: React.FC<{
  hasAudio: boolean;
  durationInFrames: number;
}> = ({ hasAudio, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const coverSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 15, mass: 0.7 },
  });
  const coverScale = interpolate(coverSpring, [0, 1], [0.7, 1]);
  const coverOpacity = interpolate(frame, [50, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {hasAudio ? <Audio src={staticFile("audio/ammuu/twist.mp3")} /> : null}

      <KenBurnsImage
        src="images/ammuu/hero.jpg"
        durationInFrames={durationInFrames}
        zoomFrom={1.35}
        zoomTo={1.1}
        panX={5}
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
          gap: 40,
          padding: "0 55px",
        }}
      >
        <KineticText
          text="Bộ sách này chỉ ra sự khác biệt giữa mưu kế ngầm và chiến lược công khai."
          startFrame={0}
          stagger={3}
          fontSize={44}
          fontFamily={fonts.sans}
          fontWeight={800}
          color="#F5E6C8"
          highlightColor="#C9A24B"
          highlightWords={["mưu", "kế", "ngầm", "chiến", "lược", "công", "khai."]}
        />

        <div
          style={{
            transform: `scale(${coverScale})`,
            opacity: coverOpacity,
          }}
        >
          <AmMuuBookCovers scale={0.62} />
        </div>
      </div>
    </>
  );
};
