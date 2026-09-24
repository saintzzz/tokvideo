import React from "react";
import { useCurrentFrame } from "remotion";

// Animated steam wisps rising off a hot dish — three staggered sine
// curls, deterministic by frame. Place above the dish's rim.
export const SteamWisps: React.FC<{ color?: string; scale?: number }> = ({
  color = "#ffffff",
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={60 * scale}
      height={90 * scale}
      viewBox="0 0 60 90"
      style={{ display: "block", overflow: "visible" }}
    >
      {[0, 1, 2].map((i) => {
        const phase = (frame * 0.045 + i * 0.7) % 1;
        const y = -phase * 55;
        const sway = Math.sin(frame * 0.09 + i * 2.1) * 6;
        const opacity = phase < 0.15 ? phase / 0.15 : phase > 0.75 ? (1 - phase) / 0.25 : 1;
        return (
          <path
            key={i}
            d={`M ${14 + i * 16 + sway} ${62 + y} q -8 -14 0 -26 q 8 -12 0 -24`}
            stroke={color}
            strokeWidth={4 * scale}
            fill="none"
            strokeLinecap="round"
            opacity={0.35 * opacity}
          />
        );
      })}
    </svg>
  );
};
