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
      {hasAudio ? <Audio src={staticFile("audio/twist.mp3")} /> : null}
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
            fontSize: 48,
            lineHeight: 1.5,
            color: "#F5E6C8",
            maxWidth: 900,
          }}
        >
          Gia Cát Lượng tinh thông{" "}
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
            thiên văn – dịch lý – đoán mệnh
          </span>
          .
          <br />
          <br />
          Tử Vi Đẩu Số chính là hệ thống ông và người xưa dùng để{" "}
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
            "tính trước phần Trời"
          </span>
          .
        </div>

        <div
          style={{
            marginTop: 50,
            transform: `scale(${coverScale})`,
            opacity: coverOpacity,
          }}
        >
          <BookCover scale={0.7} />
        </div>
      </div>
    </SceneBackground>
  );
};
