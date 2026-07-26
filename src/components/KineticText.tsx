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
  /** "color" just tints the word; "chip" wraps it in a solid rounded
   * background pill — reads much bigger/bolder on a small phone screen. */
  highlightStyle?: "color" | "chip";
  highlightTextColor?: string;
};

// Per-word reveal: blur-to-focus + rise + scale, staggered — reads as far
// more "produced" than a single opacity fade on a whole paragraph.
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  stagger = 4,
  fontSize,
  fontFamily,
  fontWeight = 800,
  color = "#F5E6C8",
  highlightColor = "#E3B23C",
  highlightWords = [],
  align = "center",
  highlightStyle = "chip",
  highlightTextColor = "#1a1206",
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
        gap: `${fontSize * 0.18}px ${fontSize * 0.24}px`,
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

        const useChip = isHighlight && highlightStyle === "chip";

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
              lineHeight: 1.15,
              color: useChip
                ? highlightTextColor
                : isHighlight
                  ? highlightColor
                  : color,
              backgroundColor: useChip ? highlightColor : "transparent",
              borderRadius: useChip ? fontSize * 0.22 : 0,
              padding: useChip ? `${fontSize * 0.06}px ${fontSize * 0.18}px` : 0,
              boxShadow: useChip
                ? `0 ${fontSize * 0.08}px ${fontSize * 0.3}px rgba(0,0,0,0.35)`
                : "none",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
