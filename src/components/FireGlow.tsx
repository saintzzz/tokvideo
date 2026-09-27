import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// Hearth/campfire ambience for storytelling scenes — a flickering warm
// glow rising from below frame (the fire itself is off-screen, we just
// see its light) plus a few embers drifting upward. Deterministic sine
// flicker, tinted by the theme accent.

const EMBERS = [
  { x: 90, speed: 1.6, size: 5, delay: 0 },
  { x: 150, speed: 1.1, size: 4, delay: 0.4 },
  { x: 210, speed: 1.9, size: 6, delay: 0.7 },
  { x: 60, speed: 1.3, size: 3, delay: 0.25 },
];

export const FireGlow: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();

  // Combined sines = organic flicker, 0.75-1.0 range
  const flicker =
    0.82 + 0.1 * Math.sin(frame * 0.5) + 0.06 * Math.sin(frame * 1.7 + 2) + 0.04 * Math.sin(frame * 4.3);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* main glow pooling low-left, like a hearth just out of frame */}
      <div
        style={{
          position: "absolute",
          left: -140,
          bottom: -180,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}40 0%, ${accent}14 45%, transparent 70%)`,
          opacity: flicker,
        }}
      />
      {/* faint second lobe so the light doesn't read as a spotlight */}
      <div
        style={{
          position: "absolute",
          right: -200,
          bottom: -260,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)`,
          opacity: flicker * 0.7,
        }}
      />
      {EMBERS.map((e, i) => {
        // each ember loops bottom -> mid-screen on its own period
        const t = ((frame * e.speed + e.delay * 90) % 260) / 260;
        const y = interpolate(t, [0, 1], [1850, 500]);
        const x = e.x + Math.sin(frame * 0.05 + i * 2) * 26;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: e.size,
              height: e.size,
              borderRadius: "50%",
              backgroundColor: accent,
              boxShadow: `0 0 ${e.size * 3}px ${accent}`,
              opacity: interpolate(t, [0, 0.15, 0.85, 1], [0, 0.9, 0.6, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        );
      })}
    </div>
  );
};
