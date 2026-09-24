import React from "react";
import { useCurrentFrame } from "remotion";

// Soft diagonal light bands sweeping slowly across the frame — the
// cheapest "cinematic" cue there is. Deterministic sine drift; color is
// the theme accent at low opacity so it works with every palette.
export const GodRays: React.FC<{ accent: string; opacity?: number }> = ({
  accent,
  opacity = 0.1,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.02) * 12;
  const shimmer = 0.75 + 0.25 * Math.sin(frame * 0.05);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-20%",
            bottom: "-20%",
            left: `${10 + i * 28 + drift}%`,
            width: "16%",
            transform: "skewX(-18deg)",
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            opacity: opacity * shimmer * (1 - i * 0.25),
            filter: "blur(30px)",
          }}
        />
      ))}
    </div>
  );
};
