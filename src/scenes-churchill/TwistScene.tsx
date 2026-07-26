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
import { CommunicationBookCover } from "../components/CommunicationBookCover";
import { fonts } from "../fonts";

export const TwistScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const coverSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 15, mass: 0.7 },
  });
  const coverScale = interpolate(coverSpring, [0, 1], [0.7, 1]);
  const coverOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneBackground>
      {hasAudio ? (
        <Audio src={staticFile("audio/churchill/twist.mp3")} />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 50px",
        }}
      >
        <div
          style={{
            opacity: textOpacity,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontSize: 46,
            lineHeight: 1.5,
            color: "#F5E6C8",
            maxWidth: 900,
          }}
        >
          Đó chính là{" "}
          <span
            style={{
              display: "inline-block",
              color: "#1a1206",
              backgroundColor: "#E3B23C",
              fontWeight: 800,
              borderRadius: 14,
              padding: "2px 14px",
            }}
          >
            nghệ thuật đối đáp thông minh
          </span>{" "}
          — biến bạn thành trung tâm của mọi cuộc trò chuyện.
          <br />
          <br />
          Cuốn sách này có sẵn{" "}
          <span
            style={{
              display: "inline-block",
              color: "#1a1206",
              backgroundColor: "#E3B23C",
              fontWeight: 800,
              borderRadius: 14,
              padding: "2px 14px",
            }}
          >
            160 công thức
          </span>{" "}
          như vậy, cho 18 tình huống giao tiếp phổ biến nhất.
        </div>

        <div
          style={{
            marginTop: 50,
            transform: `scale(${coverScale})`,
            opacity: coverOpacity,
          }}
        >
          <CommunicationBookCover scale={0.7} />
        </div>
      </div>
    </SceneBackground>
  );
};
