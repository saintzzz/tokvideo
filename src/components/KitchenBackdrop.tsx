import React from "react";
import { useCurrentFrame } from "remotion";

// Illustrated kitchen backdrop — flat vector, same warm storybook style
// as the Ba Tu model sheet. Renders behind everything: window light top
// left, shelf with jars, hanging herbs, counter line at the bottom.
// Tinted by theme accent so it still respects the per-category palette.
export const KitchenBackdrop: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.05) * 3;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 1080 1920"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* window glow top-left */}
      <rect x="60" y="140" width="300" height="380" rx="18" fill={accent} opacity="0.14" />
      <rect x="80" y="160" width="260" height="340" rx="12" fill="#fff" opacity="0.07" />
      <path d="M210 160 L210 500 M80 330 L340 330" stroke={accent} strokeWidth="8" opacity="0.2" />

      {/* shelf + jars top-right */}
      <rect x="640" y="240" width="360" height="14" rx="6" fill="#000" opacity="0.25" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${680 + i * 110} 170)`}>
          <rect x="0" y="20" width="64" height="52" rx="10" fill={accent} opacity="0.22" />
          <rect x="8" y="6" width="48" height="18" rx="6" fill="#000" opacity="0.3" />
        </g>
      ))}

      {/* hanging herbs — gentle sway */}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${470 + i * 90} 120) rotate(${sway * (i ? -1 : 1)})`}>
          <line x1="0" y1="0" x2="0" y2="60" stroke={accent} strokeWidth="4" opacity="0.35" />
          <ellipse cx="0" cy="80" rx="18" ry="26" fill={accent} opacity="0.3" />
        </g>
      ))}

      {/* counter line at bottom third */}
      <rect x="0" y="1560" width="1080" height="360" fill="#000" opacity="0.28" />
      <rect x="0" y="1560" width="1080" height="10" fill={accent} opacity="0.25" />
    </svg>
  );
};
