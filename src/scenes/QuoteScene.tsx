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
import { fonts } from "../fonts";

const QUOTE_WORDS = [
  "Mưu",
  "sự",
  "tại",
  "nhân,",
  "thành",
  "sự",
  "tại",
  "thiên.",
];

export const QuoteScene: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordStagger = 5;
  const attributionStart = QUOTE_WORDS.length * wordStagger + 15;
  const translationStart = attributionStart + 20;

  const attributionOpacity = interpolate(
    frame,
    [attributionStart, attributionStart + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const translationOpacity = interpolate(
    frame,
    [translationStart, translationStart + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <SceneBackground>
      {hasAudio ? <Audio src={staticFile("audio/quote.mp3")} /> : null}
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
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0 18px",
          }}
        >
          {QUOTE_WORDS.map((word, i) => {
            const start = i * wordStagger;
            const localFrame = frame - start;
            const s = spring({
              frame: localFrame,
              fps,
              config: { damping: 16, mass: 0.5 },
            });
            const opacity = interpolate(localFrame, [0, 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(s, [0, 1], [30, 0]);

            return (
              <span
                key={i}
                style={{
                  opacity,
                  transform: `translateY(${y}px)`,
                  fontFamily: fonts.serif,
                  fontWeight: 700,
                  fontSize: 72,
                  color: "#F5E6C8",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 36,
            opacity: attributionOpacity,
            fontFamily: fonts.serif,
            fontSize: 34,
            color: "#E3B23C",
            letterSpacing: 4,
          }}
        >
          — GIA CÁT LƯỢNG —
        </div>

        <div
          style={{
            marginTop: 28,
            opacity: translationOpacity,
            fontFamily: fonts.sans,
            fontSize: 30,
            color: "#B9C3D9",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          (Việc tính toán là ở người, việc thành hay không là ở Trời)
        </div>
      </div>
    </SceneBackground>
  );
};
