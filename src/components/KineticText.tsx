import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type KineticTextProps = {
  text: string;
  startFrame?: number;
  stagger?: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: number;
  color?: string;
  highlightColor?: string;
  highlightWords?: string[];
  align?: "center" | "left";
};

// Per-word reveal: blur-to-focus + rise + scale, staggered — reads as far
// more "produced" than a single opacity fade on a whole paragraph.
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  stagger = 4,
  fontSize,
  fontFamily,
  fontWeight = 700,
  color = "#F5E6C8",
  highlightColor = "#E3B23C",
  highlightWords = [],
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: `0 ${fontSize * 0.22}px`,
      }}
    >
      {words.map((word, i) => {
        const local = frame - startFrame - i * stagger;
        const s = spring({ frame: local, fps, config: { damping: 18, mass: 0.5 } });
        const opacity = interpolate(local, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(s, [0, 1], [26, 0]);
        const scale = interpolate(s, [0, 1], [0.9, 1]);
        const blur = interpolate(local, [0, 10], [8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const isHighlight = highlightWords.some((h) =>
          word.toLowerCase().includes(h.toLowerCase())
        );

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${y}px) scale(${scale})`,
              filter: `blur(${blur}px)`,
              fontFamily,
              fontWeight,
              fontSize,
              color: isHighlight ? highlightColor : color,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
