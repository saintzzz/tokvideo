import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// Stylised illustration (not a photo) evoking a classical Greek physician —
// toga, beard, laurel wreath, a bowl with animated steam. Original shapes.
export const HippocratesSilhouette: React.FC<{ scale?: number }> = ({
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.05) * 2;

  const w = 240 * scale;
  const h = 320 * scale;

  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        transform: `rotate(${sway}deg)`,
      }}
    >
      <svg width={w} height={h} viewBox="0 0 240 320">
        {/* toga body */}
        <path
          d="M 60 320 L 55 190 Q 120 150 185 190 L 180 320 Z"
          fill="#e9e4d8"
        />
        <path
          d="M 55 190 Q 120 220 185 190 L 180 210 Q 120 240 60 210 Z"
          fill="#cfc7b3"
        />
        {/* one shoulder drape */}
        <path d="M 150 165 L 190 200 L 175 215 L 140 178 Z" fill="#cfc7b3" />

        {/* head + neck */}
        <rect x="108" y="128" width="24" height="30" fill="#d8b48f" />
        <ellipse cx="120" cy="108" rx="38" ry="42" fill="#d8b48f" />

        {/* beard */}
        <path
          d="M 84 108 Q 84 150 120 158 Q 156 150 156 108 Q 156 138 120 144 Q 84 138 84 108 Z"
          fill="#e8e2d6"
        />

        {/* laurel wreath */}
        <path
          d="M 84 96 Q 100 80 120 82"
          stroke="#7a9a5a"
          strokeWidth="5"
          fill="none"
        />
        <path
          d="M 156 96 Q 140 80 120 82"
          stroke="#7a9a5a"
          strokeWidth="5"
          fill="none"
        />

        {/* bowl in hands */}
        <ellipse cx="120" cy="238" rx="34" ry="10" fill="#8a6a3a" />
        <path d="M 88 238 Q 120 256 152 238 L 148 244 Q 120 260 92 244 Z" fill="#6b5028" />
      </svg>

      {/* steam */}
      {new Array(3).fill(0).map((_, i) => {
        const t = (frame + i * 20) % 90;
        const opacity = interpolate(t, [0, 20, 70, 90], [0, 0.6, 0.4, 0]);
        const yOffset = interpolate(t, [0, 90], [0, -50]);
        const xWiggle = Math.sin((frame + i * 15) * 0.15) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 110 * scale + i * 8 * scale,
              top: (215 + yOffset) * scale,
              width: 10 * scale,
              height: 24 * scale,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.7)",
              filter: "blur(3px)",
              opacity,
              transform: `translateX(${xWiggle}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
